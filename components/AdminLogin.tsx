"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLogin({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (response.status === 429) {
        setError("Too many tries. Wait a minute, then try the password again.");
      } else if (!response.ok) {
        setError("That password does not open the desk.");
      } else {
        setPassword("");
        router.refresh();
      }
    } catch {
      setError("The desk did not open. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="admin shell">
      <form className="paper admin-gate" onSubmit={onSubmit}>
        <p className="eyebrow">Private</p>
        <h1>Admin desk</h1>
        <p>Names, contact details, and room conversations stay on this desk.</p>
        {configured ? (
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
        ) : (
          <p className="form-error">Set ADMIN_PASSWORD in .env.local, then restart the site.</p>
        )}
        {error ? <p className="form-error">{error}</p> : null}
        <button className="button" type="submit" disabled={!configured || pending}>
          {pending ? "Opening" : "Open the desk"}
        </button>
      </form>
    </section>
  );
}
