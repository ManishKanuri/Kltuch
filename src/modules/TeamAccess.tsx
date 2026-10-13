"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import { Card, PrimaryButton, SectionTitle } from "@/components/ui";
import { Icon } from "@/components/icons";

export default function TeamAccess() {
  const { coaches, schools, schoolName, toast } = useStore();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>("admin");
  const [coachId, setCoachId] = useState(coaches[0]?.id ?? "");
  const [schoolId, setSchoolId] = useState(schools[0]?.id ?? "");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ email: string; role: Role }[]>([]);

  async function submit() {
    if (!email.trim()) {
      toast("Enter an email address");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/invite-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          role,
          fullName: fullName.trim() || undefined,
          coachId: role === "coach" ? coachId : undefined,
          schoolId: role === "school" ? schoolId : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Invite failed");
        return;
      }
      toast(`Invite sent to ${email.trim()}`);
      setSent((prev) => [{ email: email.trim(), role }, ...prev]);
      setEmail("");
      setFullName("");
    } catch {
      toast("Invite failed. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <SectionTitle icon="coaches">Invite your team</SectionTitle>
      <p className="text-sm text-muted">
        Founders get full access as admins. Coaches and schools only see their own data.
        Each person gets an email with a link to set their password.
      </p>

      <Card className="max-w-xl space-y-4 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="invite-email" className="mb-1.5 block text-[13px] font-semibold text-content">Email</label>
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="k-field w-full"
              placeholder="person@klutchsportsedu.com"
            />
          </div>
          <div>
            <label htmlFor="invite-name" className="mb-1.5 block text-[13px] font-semibold text-content">Full name (optional)</label>
            <input
              id="invite-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="k-field w-full"
              placeholder="Jane Doe"
            />
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-[13px] font-semibold text-content">Role</span>
          <div role="group" aria-label="Role" className="flex gap-2">
            {(["admin", "coach", "school"] as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                aria-pressed={role === r}
                className={`rounded-sm border px-3 py-1.5 text-sm font-semibold capitalize transition-colors ${
                  role === r
                    ? "border-accent bg-accent/[0.08] text-accent"
                    : "border-line text-muted hover:border-accent/50 hover:text-content"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[13px] text-muted">
            {role === "admin" && "Full access to every school, coach and record. Use for founders."}
            {role === "coach" && "Sees only their own assigned classes, students, and assessments."}
            {role === "school" && "Sees only that school's own data, read-only."}
          </p>
        </div>

        {role === "coach" && (
          <div>
            <label htmlFor="invite-coach" className="mb-1.5 block text-[13px] font-semibold text-content">Which coach is this?</label>
            <select id="invite-coach" value={coachId} onChange={(e) => setCoachId(e.target.value)} className="k-field w-full">
              {coaches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({schoolName(c.assignedSchoolId)})
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-[13px] text-muted">
              Links this login to the coach’s record, so they only see their own classes.
            </p>
          </div>
        )}

        {role === "school" && (
          <div>
            <label htmlFor="invite-school" className="mb-1.5 block text-[13px] font-semibold text-content">Which school?</label>
            <select id="invite-school" value={schoolId} onChange={(e) => setSchoolId(e.target.value)} className="k-field w-full">
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <PrimaryButton icon="check" onClick={submit} disabled={sending}>
          {sending ? "Sending invite…" : "Send invite"}
        </PrimaryButton>
      </Card>

      {sent.length > 0 && (
        <Card className="max-w-xl p-5">
          <div className="mb-2.5 font-display text-[15px] font-extrabold tracking-[-0.015em] text-content">Sent this session</div>
          <ul className="space-y-1.5 text-sm">
            {sent.map((s, i) => (
              <li key={i} className="flex items-center gap-2 text-muted">
                <Icon name="check" size={14} className="text-good" />
                {s.email} <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-faint">{s.role}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
