"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { minorReply } from "@/lib/crisis";
import { emptyIntake, writeIntake, type Intake } from "@/lib/intake";
import { matchService } from "@/lib/match";
import { getService, serviceSlugs, type ServiceSlug } from "@/lib/services";

const statuses = [
  "Single",
  "In a relationship",
  "Engaged",
  "Married",
  "Separated",
  "Divorced",
  "Widowed",
  "Prefer not to say",
];

function validate(intake: Intake): string | null {
  if (intake.firstName.trim().length < 2) return "Please add your name.";
  if (intake.surname.trim().length < 2) return "Please add your surname.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(intake.email.trim())) return "Please add a real email address.";
  if (intake.phone.replace(/\D/g, "").length < 7) return "Please add a phone number.";
  const age = Number(intake.age);
  if (!Number.isInteger(age) || age < 1 || age > 120) return "Please add your age.";
  if (!intake.marriageStatus) return "Please choose a marriage status.";
  if (intake.message.trim().length < 20) return "Tell us a little more about the problem, in at least a sentence.";
  return null;
}

export function ContactForm() {
  const router = useRouter();
  const [form, setForm] = useState<Intake>(emptyIntake);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<"form" | "minor" | "opening">("form");
  const [destination, setDestination] = useState<ServiceSlug>("life");

  function update<K extends keyof Intake>(key: K, value: Intake[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problem = validate(form);
    if (problem) {
      setError(problem);
      return;
    }
    if (Number(form.age) < 18) {
      setPhase("minor");
      return;
    }

    setError("");
    let service = matchService(form.message, form.marriageStatus);
    let recordId = form.recordId;
    setDestination(service);
    setPhase("opening");

    try {
      const response = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: form.message,
          marriageStatus: form.marriageStatus,
          age: form.age,
          firstName: form.firstName,
          surname: form.surname,
          email: form.email,
          phone: form.phone,
        }),
      });
      if (response.ok) {
        const data = (await response.json()) as { service?: string; id?: string };
        if (data.service && serviceSlugs.includes(data.service as ServiceSlug)) {
          service = data.service as ServiceSlug;
        }
        if (data.id) recordId = data.id;
      }
    } catch {
      service = matchService(form.message, form.marriageStatus);
    }

    writeIntake({ ...form, service, recordId });
    setDestination(service);
    window.setTimeout(() => router.push(`/session/${service}`), 1100);
  }

  if (phase === "minor") {
    return (
      <div className="paper hold">
        <h2>This room is for adults.</h2>
        <p>{minorReply}</p>
      </div>
    );
  }

  const room = getService(destination);

  if (phase === "opening" && room) {
    return (
      <div className="paper opening-note" aria-live="polite">
        <p className="eyebrow">Opening your room</p>
        <h2>The {room.room} is ready.</h2>
        <p>
          {room.counselor} will meet you for {room.title.toLowerCase()}.
          You can speak as soon as you arrive, or type if that feels easier.
        </p>
      </div>
    );
  }

  return (
    <form className="paper" onSubmit={onSubmit} noValidate>
      <div className="form-grid">
        <label className="field">
          <span>Name</span>
          <input
            name="firstName"
            autoComplete="given-name"
            value={form.firstName}
            onChange={(event) => update("firstName", event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Surname</span>
          <input
            name="surname"
            autoComplete="family-name"
            value={form.surname}
            onChange={(event) => update("surname", event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Phone number</span>
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(event) => update("phone", event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Age</span>
          <input
            name="age"
            type="number"
            min={1}
            max={120}
            inputMode="numeric"
            value={form.age}
            onChange={(event) => update("age", event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Marriage status</span>
          <select
            name="marriageStatus"
            value={form.marriageStatus}
            onChange={(event) => update("marriageStatus", event.target.value)}
            required
          >
            <option value="">Select status</option>
            {statuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>
        <label className="field wide">
          <span>Your problem</span>
          <textarea
            name="message"
            value={form.message}
            onChange={(event) => update("message", event.target.value)}
            placeholder="Write what is happening, in your own words."
            required
          />
        </label>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="form-actions">
        <p className="muted">We open the room that matches what you wrote.</p>
        <button className="button" type="submit">Open my room</button>
      </div>
    </form>
  );
}
