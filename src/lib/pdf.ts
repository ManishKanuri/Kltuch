// Renders a DOM element to a single, content-sized PDF page and triggers a
// browser download. Libraries are imported lazily so they only load on use.
//
// Two things make the export clean:
//  1. The report modal normally has `max-height` + `overflow-y-auto`, so only the
//     scrolled-visible slice is on screen. We temporarily expand it to its full
//     height before capture so nothing is clipped.
//  2. The dashboard can be in dark mode, which exports as a dull/dim document.
//     We render the captured clone with the light-theme tokens (via `onclone`,
//     so the live modal is untouched) for a crisp, print-friendly result. The
//     always-dark header keeps the branded look.

// Must stay in sync with :root in globals.css — every theme-aware variable,
// or dark-mode values leak into the light export.
const LIGHT_TOKENS: Record<string, string> = {
  "--bg": "242 243 246",
  "--surface": "255 255 255",
  "--elevated": "246 247 250",
  "--content": "11 18 40",
  "--muted": "78 90 120",
  "--faint": "99 110 137",
  "--line": "201 207 221",
  "--accent": "18 58 214",
  "--good": "78 110 0",
  "--warn": "154 103 0",
  "--bad": "181 48 13",
  "--hue-blue": "18 58 214",
  "--hue-orange": "204 58 17",
  "--hue-lime": "159 197 22",
  "--hue-amber": "224 161 0",
};

export async function downloadElementPdf(el: HTMLElement, filename: string) {
  const [{ default: html2canvas }, { default: JsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);

  // Expand the live element so its full content is measured (not just the
  // visible scroll viewport). Saved and restored around the capture.
  const savedCss = el.style.cssText;
  const savedScroll = el.scrollTop;
  el.style.maxHeight = "none";
  el.style.height = "auto";
  el.style.overflow = "visible";
  el.style.animation = "none";
  el.scrollTop = 0;

  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      windowWidth: el.scrollWidth,
      onclone: (doc, clone) => {
        // The clone is a fresh document, so CSS animations restart from frame 0 —
        // grow-in bars would be captured at scaleX(0). Freeze everything at its
        // final state instead.
        const freeze = doc.createElement("style");
        freeze.textContent = "*,*::before,*::after{animation:none!important;transition:none!important}";
        doc.head.appendChild(freeze);
        // `clone` is the captured copy — editing it leaves the on-screen modal alone.
        const s = (clone as HTMLElement).style;
        for (const [key, value] of Object.entries(LIGHT_TOKENS)) s.setProperty(key, value);
        // Drop interactive controls (download/save buttons) from the exported document.
        clone.querySelectorAll<HTMLElement>("[data-pdf-hide]").forEach((node) => {
          node.style.display = "none";
        });
      },
    });

    // Size the page to the content aspect ratio -> no clipping, no whitespace.
    // The image is 2x resolution but placed at 1x dimensions for crisp output.
    const width = canvas.width / 2;
    const height = canvas.height / 2;
    const doc = new JsPDF({
      unit: "px",
      format: [width, height],
      orientation: width >= height ? "landscape" : "portrait",
    });
    doc.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, width, height);
    doc.save(filename);
  } finally {
    el.style.cssText = savedCss;
    el.scrollTop = savedScroll;
  }
}
