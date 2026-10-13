"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogoMark } from "@/components/Logo";
import { Icon } from "@/components/icons";

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

  useEffect(() => {
    const supabase = createClient();

    // Recovery/invite links put tokens in the URL hash fragment
    // (#access_token=...&type=recovery), which the browser never sends to a
    // server — only client JS can read it. The Supabase client is supposed
    // to detect and consume this automatically on load (detectSessionInUrl),
    // firing a PASSWORD_RECOVERY auth event — but if this listener subscribes
    // even slightly after that detection already ran, the event is missed
    // entirely with no second chance. Checking the hash directly here is a
    // synchronous, reliable fallback that doesn't depend on listener timing.
    const hash = window.location.hash;
    if (hash.includes("type=recovery") || hash.includes("type=invite")) {
      setMode("set-password");
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-klutch-ink bg-sidebar-glow p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur">
        <div className="mb-6 flex flex-col items-center gap-3">
          <LogoMark size={44} />
          <div className="text-center">
            <div className="font-display text-xl font-bold text-white">KLUTCH SportsEd</div>
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Internal ERP</div>
          </div>
        </div>

        {mode === "signin" ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-klutch-blue-bright"
                placeholder="you@klutchsportsed.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-klutch-blue-bright"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-brand disabled:opacity-60"
            >
              <Icon name="check" size={15} />
              {loading ? "Signing in…" : "Sign in"}
            </button>
            <p className="text-center text-[11px] text-slate-500">
              First time here from an invite link? It'll drop you into password setup automatically.
            </p>
          </form>
        ) : (
          <form onSubmit={handleSetPassword} className="space-y-4">
            <p className="text-sm text-slate-300">Set a password to finish setting up your account.</p>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">New password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-klutch-blue-bright"
                placeholder="At least 8 characters"
              />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-brand disabled:opacity-60"
            >
              <Icon name="check" size={15} />
              {loading ? "Saving…" : "Set password & continue"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
