"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { crisisReply, isCrisis, minorReply } from "@/lib/crisis";
import { readIntake, writeIntake, type Intake } from "@/lib/intake";
import { keepTurns, keepVisit } from "@/lib/keep-visit";
import { getService, greetingFor, type ServiceSlug } from "@/lib/services";

type Turn = { role: "user" | "counselor"; text: string };

type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

type RecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
};

const maritalStatuses = [
  "Single",
  "In a relationship",
  "Engaged",
  "Married",
  "Separated",
  "Divorced",
  "Widowed",
  "Prefer not to say",
];

type AccountProfile = {
  email: string;
  firstName: string;
  surname: string;
  age: string;
  marriageStatus: string;
  location: string;
  phone: string;
  message: string;
  recordId: string;
};

function profileToIntake(profile: AccountProfile, service?: ServiceSlug): Intake {
  return {
    firstName: profile.firstName,
    surname: profile.surname,
    email: profile.email,
    phone: profile.phone ?? "",
    age: profile.age,
    marriageStatus: profile.marriageStatus,
    location: profile.location ?? "",
    message: profile.message ?? "",
    recordId: profile.recordId,
    service,
    confirmedAdult: true,
  };
}

function isRegistered(saved: Intake | null): boolean {
  if (!saved) return false;
  const years = Number(saved.age);
  return (
    saved.firstName.trim().length >= 2 &&
    saved.surname.trim().length >= 2 &&
    Number.isInteger(years) &&
    years >= 18 &&
    years <= 120 &&
    saved.marriageStatus.trim().length > 0
  );
}

const starters: Record<ServiceSlug, string[]> = {
  life: ["I feel lost", "My days feel empty", "I don't know what I want"],
  career: ["I dread going to work", "I want a different career", "I am afraid to leave"],
  marriage: ["We keep having the same fight", "I feel distant from my partner", "I don't know if we can repair this"],
  family: ["Home feels tense", "I cannot reach my child", "A parent is wearing me down"],
  grief: ["Someone I love is gone", "Ordinary days feel wrong now", "I don't know how to carry this"],
  stress: ["I cannot switch off", "My body feels braced", "Sleep has fallen apart"],
  growth: ["I don't trust myself", "I break the promises I make", "I want to feel more like myself"],
};

function SeatedPerson({
  facing,
  cloth,
  hair,
  active,
}: {
  facing: "left" | "right";
  cloth: string;
  hair: string;
  active: boolean;
}) {
  return (
    <svg
      className={active ? "sitter is-active" : "sitter"}
      viewBox="0 0 140 168"
      aria-hidden="true"
      style={facing === "left" ? { transform: "scaleX(-1)" } : undefined}
    >
      <path d="M36 96v40M36 130h68M100 130v26" stroke="#cbb89a" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M50 82c2-20 16-26 26-16 8 8 12 20 10 38H54c-1-8-2-14-4-22z" fill={cloth} />
      <circle cx="72" cy="48" r="15" fill="#efd0b8" />
      <path d="M57 50c2-18 30-20 32 0-7-9-24-11-32 0z" fill={hair} />
      <path d="M80 90c14 3 22 7 28 14" stroke="#efd0b8" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M60 118c20 8 36 7 48-2" stroke="#2c3330" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M104 118c4 14 1 22-5 28" stroke="#2c3330" strokeWidth="6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  return (
    voices.find((voice) => /en-GB/i.test(voice.lang) && /female|libby|sonia|hazel|serena|maisie/i.test(voice.name)) ||
    voices.find((voice) => /en-GB/i.test(voice.lang)) ||
    voices.find((voice) => /^en/i.test(voice.lang))
  );
}

export function VoiceRoom({ slug }: { slug: ServiceSlug }) {
  const service = getService(slug);
  const [intake, setIntake] = useState<Intake | null>(null);
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState("");
  const [callName, setCallName] = useState("");
  const [surname, setSurname] = useState("");
  const [age, setAge] = useState("");
  const [marriageStatus, setMarriageStatus] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"details" | "create" | "signin">("details");
  const [draftIntake, setDraftIntake] = useState<Intake | null>(null);
  const [accountBusy, setAccountBusy] = useState(false);
  const [gateError, setGateError] = useState("");
  const [clock, setClock] = useState("");
  const [battery, setBattery] = useState<number | null>(null);
  const [charging, setCharging] = useState(false);
  const [messages, setMessages] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [interim, setInterim] = useState("");
  const [listening, setListening] = useState(false);
  const [phase, setPhase] = useState<"idle" | "thinking" | "speaking">("idle");
  const [micReady, setMicReady] = useState(true);
  const [crisis, setCrisis] = useState(false);
  const messagesRef = useRef<Turn[]>([]);
  const recognitionRef = useRef<Recognition | null>(null);
  const greeted = useRef(false);
  const busy = useRef(false);

  function enterWith(next: Intake) {
    const years = Number(next.age);
    if (Number.isInteger(years) && years > 0 && years < 18) {
      setBlocked(minorReply);
      return;
    }
    writeIntake(next);
    setIntake(next);
    setCallName(next.firstName);
    setSurname(next.surname);
    setAge(next.age);
    setMarriageStatus(next.marriageStatus);
    setLocation(next.location);
    setEmail(next.email);
    setReady(isRegistered(next));
  }

  useEffect(() => {
    const saved = readIntake();
    if (saved) {
      setCallName(saved.firstName);
      setSurname(saved.surname);
      setAge(saved.age);
      setMarriageStatus(saved.marriageStatus);
      setLocation(saved.location ?? "");
      setEmail(saved.email);
    }
    void (async () => {
      try {
        const response = await fetch("/api/account/me");
        if (!response.ok) return;
        const data = (await response.json()) as { account?: AccountProfile };
        if (!data.account) return;
        enterWith(profileToIntake(data.account, saved?.service));
      } catch {
        // The registration form stays open when the account cannot be read.
      }
    })();
  }, []);

  useEffect(() => {
    const tick = () => {
      setClock(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    };
    tick();
    let interval = 0;
    const wait = window.setTimeout(() => {
      tick();
      interval = window.setInterval(tick, 60000);
    }, 60000 - (Date.now() % 60000) + 250);
    return () => {
      window.clearTimeout(wait);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const nav = navigator as Navigator & {
      getBattery?: () => Promise<{
        level: number;
        charging: boolean;
        addEventListener: (type: string, listener: () => void) => void;
        removeEventListener: (type: string, listener: () => void) => void;
      }>;
    };
    if (!nav.getBattery) return;
    let alive = true;
    let manager: Awaited<ReturnType<NonNullable<typeof nav.getBattery>>> | null = null;
    const read = () => {
      if (!alive || !manager) return;
      setBattery(Math.round(manager.level * 100));
      setCharging(manager.charging);
    };
    nav.getBattery().then((next) => {
      if (!alive) return;
      manager = next;
      read();
      next.addEventListener("levelchange", read);
      next.addEventListener("chargingchange", read);
    }).catch(() => {});
    return () => {
      alive = false;
      manager?.removeEventListener("levelchange", read);
      manager?.removeEventListener("chargingchange", read);
    };
  }, []);

  useEffect(() => {
    const loadVoices = () => pickVoice();
    window.speechSynthesis?.addEventListener("voiceschanged", loadVoices);
    return () => {
      window.speechSynthesis?.removeEventListener("voiceschanged", loadVoices);
      window.speechSynthesis?.cancel();
      recognitionRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (!ready || !service || greeted.current) return;
    greeted.current = true;
    const room = service;
    void (async () => {
      const saved = readIntake();
      let recordId = saved?.recordId;
      if (saved && !recordId) {
        recordId = await keepVisit({ ...saved, service: saved.service ?? room.slug }, saved.email ? "contact" : "room");
        if (recordId) writeIntake({ ...saved, recordId, service: saved.service ?? room.slug });
      }
      const concern = saved?.message && (!saved.service || saved.service === room.slug) ? saved.message : "";
      if (concern && isCrisis(concern)) {
        setCrisis(true);
        const opening = [{ role: "counselor" as const, text: crisisReply }];
        messagesRef.current = opening;
        setMessages(opening);
        void keepTurns(recordId, [{ role: "counselor", text: crisisReply }]);
        void speak(crisisReply);
        return;
      }
      const line = greetingFor(room, saved?.firstName ?? "", concern);
      const opening = [{ role: "counselor" as const, text: line }];
      messagesRef.current = opening;
      setMessages(opening);
      void keepTurns(recordId, [{ role: "counselor", text: line }]);
      void speak(line);
    })();
  }, [ready, service]);

  function speak(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setPhase("idle");
      return Promise.resolve();
    }
    setPhase("speaking");
    return new Promise<void>((resolve) => {
      window.setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.96;
        utterance.pitch = 1;
        utterance.lang = "en-GB";
        const voice = pickVoice();
        if (voice) utterance.voice = voice;
        utterance.onend = () => {
          setPhase("idle");
          resolve();
        };
        utterance.onerror = () => {
          setPhase("idle");
          resolve();
        };
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }, 60);
    });
  }

  async function begin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const firstName = callName.trim();
    const family = surname.trim();
    const years = Number(age);
    if (firstName.length < 2) {
      setGateError("Please add your name.");
      return;
    }
    if (family.length < 2) {
      setGateError("Please add your surname.");
      return;
    }
    if (!Number.isInteger(years) || years < 1 || years > 120) {
      setGateError("Please add your age.");
      return;
    }
    if (years < 18) {
      setBlocked(minorReply);
      return;
    }
    if (!marriageStatus) {
      setGateError("Please choose a marital status.");
      return;
    }
    setGateError("");
    const next: Intake = {
      firstName,
      surname: family,
      email: intake?.email ?? "",
      phone: intake?.phone ?? "",
      age: String(years),
      marriageStatus,
      location: location.trim(),
      message: intake?.message ?? "",
      service: intake?.service,
      confirmedAdult: true,
    };
    setDraftIntake(next);
    setPassword("");
    setConfirmPassword("");
    setStep("create");
  }

  async function createAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draftIntake) {
      setStep("details");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setGateError("Please add a real email address.");
      return;
    }
    if (password.length < 8) {
      setGateError("Use at least 8 characters for the password.");
      return;
    }
    if (password !== confirmPassword) {
      setGateError("The passwords do not match.");
      return;
    }
    setAccountBusy(true);
    setGateError("");
    try {
      const response = await fetch("/api/account/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draftIntake, email: email.trim(), password }),
      });
      const data = (await response.json().catch(() => null)) as { account?: AccountProfile } | null;
      if (response.status === 409) {
        setGateError("That email already has an account. Sign in instead.");
        return;
      }
      if (!response.ok || !data?.account) {
        setGateError("The account did not open. Try again.");
        return;
      }
      setPassword("");
      setConfirmPassword("");
      enterWith(profileToIntake(data.account, service?.slug));
    } catch {
      setGateError("The account did not open. Try again.");
    } finally {
      setAccountBusy(false);
    }
  }

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setGateError("Please add the email on the account.");
      return;
    }
    if (!password) {
      setGateError("Please add the password.");
      return;
    }
    setAccountBusy(true);
    setGateError("");
    try {
      const response = await fetch("/api/account/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string; account?: AccountProfile } | null;
      if (response.status === 429) {
        setGateError("Too many tries. Wait a minute, then sign in again.");
        return;
      }
      if (!response.ok || !data?.account) {
        setGateError("That email or password does not match.");
        return;
      }
      setPassword("");
      enterWith(profileToIntake(data.account, service?.slug));
    } catch {
      setGateError("The account did not open. Try again.");
    } finally {
      setAccountBusy(false);
    }
  }

  async function send(text: string) {
    const cleaned = text.trim();
    if (!cleaned || !service || busy.current || blocked) return;
    busy.current = true;
    recognitionRef.current?.stop();
    setListening(false);
    setInterim("");
    setDraft("");

    const spoken = [...messagesRef.current, { role: "user" as const, text: cleaned }];
    messagesRef.current = spoken;
    setMessages(spoken);

    if (isCrisis(cleaned)) {
      setCrisis(true);
      const withHelp = [...spoken, { role: "counselor" as const, text: crisisReply }];
      messagesRef.current = withHelp;
      setMessages(withHelp);
      await keepTurns(readIntake()?.recordId, [
        { role: "person", text: cleaned },
        { role: "counselor", text: crisisReply },
      ]);
      await speak(crisisReply);
      busy.current = false;
      return;
    }

    setPhase("thinking");
    let reply = "";
    try {
      const saved = readIntake();
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: service.slug,
          firstName: saved?.firstName ?? "",
          age: saved?.age ?? "",
          marriageStatus: saved?.marriageStatus ?? "",
          location: saved?.location ?? "",
          recordId: saved?.recordId ?? "",
          concern: saved?.service === service.slug || !saved?.service ? saved?.message ?? "" : "",
          history: spoken.slice(-12).map((turn) => ({
            role: turn.role === "counselor" ? "assistant" : "user",
            text: turn.text,
          })),
        }),
      });
      if (!response.ok) throw new Error("quiet");
      const data = (await response.json()) as { text?: string; blocked?: boolean };
      reply = data.text?.trim() || "I am here. Say that once more, a little more slowly, and I will stay with it.";
      if (data.blocked) setBlocked(reply);
    } catch {
      reply = "The room went quiet for a moment. Say it again, and I will stay with you.";
    }

    const withReply = [...messagesRef.current, { role: "counselor" as const, text: reply }];
    messagesRef.current = withReply;
    setMessages(withReply);
    await speak(reply);
    busy.current = false;
  }

  function toggleMic() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const speechWindow = window as Window & {
      SpeechRecognition?: new () => Recognition;
      webkitSpeechRecognition?: new () => Recognition;
    };
    const Ctor = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Ctor) {
      setMicReady(false);
      return;
    }
    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      let finalText = "";
      let live = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const piece = event.results[index][0]?.transcript ?? "";
        if (event.results[index].isFinal) finalText += piece;
        else live += piece;
      }
      setInterim(live);
      if (finalText.trim()) void send(finalText);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  if (!service) return null;

  const youName = (intake?.firstName?.trim() || "You").replace(/^./, (letter) => letter.toUpperCase());
  const counselorLive = phase === "speaking" || phase === "thinking";
  const status = listening
    ? `${service.counselor} is listening`
    : phase === "thinking"
      ? `${service.counselor} is taking that in`
      : phase === "speaking"
        ? `${service.counselor} is speaking`
        : `${service.counselor} asked. Your turn to answer.`;

  return (
    <section className="voice">
      <div className={listening || counselorLive ? "phone-screen is-advert" : "phone-screen"}>
      <img className="voice-advert" src="/logo.jpg" alt="" />
      <div className="phone-status" aria-hidden="true">
        <span>{clock}</span>
        <span className="phone-status-icons">
          <svg viewBox="0 0 18 12" aria-hidden="true"><rect x="0" y="7" width="3" height="5" rx="0.6" fill="currentColor"/><rect x="5" y="4.5" width="3" height="7.5" rx="0.6" fill="currentColor"/><rect x="10" y="2" width="3" height="10" rx="0.6" fill="currentColor"/><rect x="15" y="0" width="3" height="12" rx="0.6" fill="currentColor"/></svg>
          <svg viewBox="0 0 16 12" aria-hidden="true"><path d="M8 9.2a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6Z" fill="currentColor"/><path d="M3.2 7.2a6.8 6.8 0 0 1 9.6 0" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round"/><path d="M.8 4.4a10.2 10.2 0 0 1 14.4 0" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round"/></svg>
          <span className="phone-battery">
            {battery !== null ? <span className="phone-battery-pct">{battery}</span> : null}
            <svg viewBox="0 0 25 12" aria-hidden="true">
              <rect x="0.6" y="0.6" width="20" height="10.8" rx="2.2" stroke="currentColor" strokeWidth="1.2" fill="none"/>
              <rect x="2.2" y="2.2" width={battery === null ? 14.5 : Math.max(0.8, 14.5 * (battery / 100))} height="7.6" rx="1" fill={battery !== null && battery <= 20 && !charging ? "#b42318" : "currentColor"}/>
              {charging ? <path d="M11.2 2.4 8.4 6.5h2.3L9.6 9.6l4.2-4.6h-2.4l2.2-2.6h-2.4Z" fill="#0e2a56"/> : null}
              <rect x="21.6" y="3.6" width="2" height="4.8" rx="0.6" fill="currentColor"/>
            </svg>
          </span>
        </span>
      </div>
      <div className="voice-top">
        <div>
          <p className="eyebrow">{service.title}</p>
          <h1>With {service.counselor}</h1>
        </div>
        <Link className="button" href="/services">Leave</Link>
      </div>

      {blocked ? (
        <div className="hold">
          <p>{blocked}</p>
          <p><Link href="/contact">Return to contact</Link></p>
        </div>
      ) : null}

      {!ready && !blocked && step === "details" ? (
        <form className="paper gate" onSubmit={begin}>
          <p>Register before you enter. {service.counselor} needs your name, surname, age, and marital status.</p>
          <label className="field">
            <span>Name</span>
            <input value={callName} onChange={(event) => setCallName(event.target.value)} autoComplete="given-name" required />
          </label>
          <label className="field">
            <span>Surname</span>
            <input value={surname} onChange={(event) => setSurname(event.target.value)} autoComplete="family-name" required />
          </label>
          <label className="field">
            <span>Age</span>
            <input value={age} onChange={(event) => setAge(event.target.value)} type="number" min={1} max={120} inputMode="numeric" required />
          </label>
          <label className="field">
            <span>Marital status</span>
            <select value={marriageStatus} onChange={(event) => setMarriageStatus(event.target.value)} required>
              <option value="">Select status</option>
              {maritalStatuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Location <em>optional</em></span>
            <input value={location} onChange={(event) => setLocation(event.target.value)} autoComplete="address-level2" placeholder="City or town" />
          </label>
          <p className="muted">These conversations are for adults.</p>
          {gateError ? <p className="form-error">{gateError}</p> : null}
          <button className="button" type="submit">Get an invoice</button>
          <button className="button-ghost" type="button" onClick={() => { setGateError(""); setStep("signin"); }}>
            Sign in
          </button>
        </form>
      ) : null}

      {!ready && !blocked && step === "create" ? (
        <form className="paper gate" onSubmit={createAccount}>
          <p>Create your account. Use an email and password so you can sign in next time.</p>
          <label className="field">
            <span>Email</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required />
          </label>
          <label className="field">
            <span>Password</span>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="new-password" minLength={8} required />
          </label>
          <label className="field">
            <span>Confirm password</span>
            <input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" autoComplete="new-password" minLength={8} required />
          </label>
          {gateError ? <p className="form-error">{gateError}</p> : null}
          <button className="button" type="submit" disabled={accountBusy}>Create account</button>
          <button className="button-ghost" type="button" onClick={() => { setGateError(""); setPassword(""); setStep("signin"); }}>
            Sign in
          </button>
        </form>
      ) : null}

      {!ready && !blocked && step === "signin" ? (
        <form className="paper gate" onSubmit={signIn}>
          <p>Sign in with the email and password on your account.</p>
          <label className="field">
            <span>Email</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required />
          </label>
          <label className="field">
            <span>Password</span>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required />
          </label>
          {gateError ? <p className="form-error">{gateError}</p> : null}
          <button className="button" type="submit" disabled={accountBusy}>Sign in</button>
          <button className="button-ghost" type="button" onClick={() => { setGateError(""); setPassword(""); setStep("details"); }}>
            Register
          </button>
        </form>
      ) : null}

      {ready && !blocked ? (
        <>
          <div className="parlor">
            <div className={listening ? "seat is-live" : "seat"}>
              <SeatedPerson facing="right" cloth="#1d74ff" hair="#07111f" active={listening} />
              <strong>{youName}</strong>
            </div>
            <div className="between" aria-hidden="true"><span /></div>
            <div className={counselorLive ? "seat is-live" : "seat"}>
              <SeatedPerson facing="left" cloth="#0c2a5c" hair="#06101c" active={counselorLive} />
              <strong>{service.counselor}</strong>
            </div>
          </div>
          <p className="status-line">{interim ? `${youName} is speaking` : status}</p>
          <ol className="transcript" aria-live="polite">
            {messages.map((turn, index) => (
              <li key={`${turn.role}-${index}`} className={turn.role}>
                <small>{turn.role === "counselor" ? service.counselor : youName}</small>
                {turn.text}
              </li>
            ))}
            {interim ? (
              <li className="user">
                <small>{youName}</small>
                {interim}
              </li>
            ) : null}
          </ol>
          {crisis ? (
            <div className="crisis-card">
              <p>Please contact someone who can stay with you in person.</p>
              <p>United States: call or text 988. South Africa: SADAG 0800 567 567.</p>
              <p><a href="https://www.iasp.info/suicidalthoughts/">Find a local line</a></p>
            </div>
          ) : (
            <div className="starters">
              {starters[service.slug].map((prompt) => (
                <button key={prompt} type="button" onClick={() => void send(prompt)} disabled={phase !== "idle" || listening}>
                  {prompt}
                </button>
              ))}
            </div>
          )}
          {micReady ? (
            <button className={listening ? "mic is-on" : "mic"} type="button" onClick={toggleMic} disabled={phase !== "idle" && !listening}>
              {listening ? `${service.counselor} is listening — tap when you are done` : `Answer ${service.counselor}`}
            </button>
          ) : (
            <p className="muted">This browser cannot open the microphone. You can type instead.</p>
          )}
          <form
            className="composer"
            onSubmit={(event) => {
              event.preventDefault();
              void send(draft);
            }}
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type your answer"
              aria-label={`Type your answer to ${service.counselor}`}
              disabled={phase !== "idle" || listening}
            />
            <button className="button" type="submit" disabled={phase !== "idle" || listening || !draft.trim()}>
              Send
            </button>
          </form>
        </>
      ) : null}
      <div className="phone-home" aria-hidden="true"><span /></div>
      </div>
    </section>
  );
}
