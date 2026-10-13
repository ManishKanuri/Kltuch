"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogoMark } from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  // Invite/recovery links put the session into a state where Supabase expects
  // a new password, not a sign-in — detect that via onAuthStateChange rather
  // than parsing the URL fragment ourselves.
  const [mode, setMode] = useState<"signin" | "set-password">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Set directly from the URL hash on mount — distinct from `error`, which
  // only ever reflects the result of this page's own form submissions.
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Recovery/invite links put tokens (or an error) in the URL hash fragment
    // (#access_token=...&refresh_token=...&type=recovery, or
    // #error=...&error_code=otp_expired), which the browser never sends to a
    // server — only client JS can read it. The Supabase client *can* detect
    // and consume this automatically (detectSessionInUrl), but that depends
    // on exact timing relative to this component mounting and is not
    // reliable enough to build a password-setup flow on. Instead, parse the
    // hash ourselves and call setSession() explicitly — this is what
    // actually establishes the session updateUser() below needs; merely
    // switching the displayed form (the old, broken approach) left no real
    // session behind it, so submitting failed with "Auth session missing!".
    const hash = window.location.hash;
    if (hash.includes("error=")) {
      const params = new URLSearchParams(hash.slice(1));
      const code = params.get("error_code");
      setLinkError(
        code === "otp_expired"
          ? "That link has expired or was already used. Ask an admin to send you a new one."
          : params.get("error_description")?.replace(/\+/g, " ") ?? "That link is no longer valid."
      );
    } else if (hash.includes("access_token=") && hash.includes("type=recovery")) {
      const params = new URLSearchParams(hash.slice(1));
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      if (access_token && refresh_token) {
        supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
          if (error) {
            setLinkError("That link is no longer valid. Ask an admin to send you a new one.");
          } else {
            setMode("set-password");
          }
        });
      }
    }

    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("set-password");
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  async function handleSetPassword(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  const buttonClass =
    "flex w-full items-center justify-center rounded-sm bg-klutch-cta px-4 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-klutch-cta-hover disabled:bg-content/[0.08] disabled:text-faint";
  const labelClass = "mb-1.5 block text-[13px] font-semibold text-content";

  return (
    <div className="flex min-h-screen flex-col bg-bg md:flex-row">
      {/* The brand's field: royal blue + court markings, the site's hero device */}
      <section className="relative flex shrink-0 flex-col justify-between gap-10 overflow-hidden bg-klutch-field px-6 pb-8 pt-6 text-white md:w-[52%] md:px-12 md:py-10">
        <div
          aria-hidden
          className="court-lines pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[840px] -translate-x-1/2 -translate-y-1/2 opacity-[0.16]"
          style={{ backgroundSize: "100% 100%" }}
        />
        <div className="relative flex items-center gap-3">
          <LogoMark size={36} />
          <span className="font-display text-[19px] leading-none tracking-[-0.02em]">
            <span className="font-black">KLUTCH</span>{" "}
            <span className="font-semibold opacity-70">SportsEd</span>
          </span>
        </div>
        <div className="relative">
          <h1 className="font-display text-[clamp(2.5rem,5.1vw,5.25rem)] font-black uppercase leading-[0.88] tracking-[-0.042em]">
            Sport is a<br />subject now.
          </h1>
          <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.2em] text-white/70 md:mt-6 md:text-[12px]">
            Internal ERP for coaches, schools and founders
          </p>
        </div>
      </section>

      <section className="flex flex-1 justify-center px-6 py-10 md:items-center md:py-12">
        <div className="w-full max-w-sm">
          <h2 className="font-display text-[1.75rem] font-extrabold leading-tight tracking-[-0.025em] text-content">
            {mode === "signin" ? "Sign in" : "Set your password"}
          </h2>
          <p className="mt-1.5 text-[15px] text-muted">
            {mode === "signin"
              ? "Use the email your KLUTCH admin invited."
              : "Choose a password to finish setting up your account."}
          </p>

          {linkError && (
            <div
              role="alert"
              className="mt-6 rounded-sm border border-warn/30 bg-warn/10 px-3 py-2.5 text-[13px] text-content"
            >
              {linkError}
            </div>
          )}

          {mode === "signin" ? (
            <form onSubmit={handleSignIn} className="mt-6 space-y-4">
              <div>
                <label htmlFor="email" className={labelClass}>Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="k-field py-2.5"
                  placeholder="you@klutchsportsedu.com"
                />
              </div>
              <div>
                <label htmlFor="password" className={labelClass}>Password</label>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="k-field py-2.5"
                />
              </div>
              {error && <p role="alert" className="text-[13px] font-medium text-bad">{error}</p>}
              <button type="submit" disabled={loading} className={buttonClass}>
                {loading ? "Signing in…" : "Sign in"}
              </button>
              <p className="text-[13px] text-faint">
                Opening an invite link takes you straight to password setup.
              </p>
            </form>
          ) : (
            <form onSubmit={handleSetPassword} className="mt-6 space-y-4">
              <div>
                <label htmlFor="new-password" className={labelClass}>New password</label>
                <input
                  id="new-password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="k-field py-2.5"
                  placeholder="At least 8 characters"
                />
              </div>
              {error && <p role="alert" className="text-[13px] font-medium text-bad">{error}</p>}
              <button type="submit" disabled={loading} className={buttonClass}>
                {loading ? "Saving…" : "Set password and continue"}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
