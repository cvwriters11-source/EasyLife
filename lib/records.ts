import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export type StoredTurn = {
  at: string;
  role: "person" | "counselor";
  text: string;
};

export type Visit = {
  id: string;
  at: string;
  updatedAt: string;
  source: "contact" | "room";
  firstName: string;
  surname: string;
  email: string;
  phone: string;
  age: string;
  marriageStatus: string;
  location: string;
  message: string;
  service: string;
  turns: StoredTurn[];
};

const folder = () => path.join(process.cwd(), "data");
const recordsFile = () => path.join(folder(), "records.jsonl");
const legacyFile = () => path.join(folder(), "enquiries.jsonl");

let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(job: () => Promise<T>): Promise<T> {
  const run = queue.then(job, job);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function clip(value: unknown, max: number) {
  return value?.toString().trim().slice(0, max) ?? "";
}

function asVisit(value: unknown): Visit | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<Visit>;
  if (!row.firstName && !row.surname && !row.message) return null;
  const turns = Array.isArray(row.turns)
    ? row.turns
        .filter((turn) => turn && (turn.role === "person" || turn.role === "counselor") && turn.text?.trim())
        .map((turn) => ({
          at: clip(turn.at, 40) || new Date().toISOString(),
          role: turn.role,
          text: clip(turn.text, 2000),
        }))
    : [];
  return {
    id: clip(row.id, 80) || randomUUID(),
    at: clip(row.at, 40) || new Date().toISOString(),
    updatedAt: clip(row.updatedAt, 40) || clip(row.at, 40) || new Date().toISOString(),
    source: row.source === "room" ? "room" : "contact",
    firstName: clip(row.firstName, 80),
    surname: clip(row.surname, 80),
    email: clip(row.email, 160),
    phone: clip(row.phone, 40),
    age: clip(row.age, 8),
    marriageStatus: clip(row.marriageStatus, 80),
    location: clip(row.location, 120),
    message: clip(row.message, 4000),
    service: clip(row.service, 40),
    turns,
  };
}

async function readLines(file: string) {
  try {
    const raw = await readFile(file, "utf8");
    return raw.split("\n").filter((line) => line.trim());
  } catch {
    return [];
  }
}

async function readStored(): Promise<Visit[]> {
  const lines = await readLines(recordsFile());
  return lines.flatMap((line) => {
    try {
      const visit = asVisit(JSON.parse(line));
      return visit ? [visit] : [];
    } catch {
      return [];
    }
  });
}

async function writeStored(visits: Visit[]) {
  await mkdir(folder(), { recursive: true });
  const body = visits.map((visit) => JSON.stringify(visit)).join("\n");
  await writeFile(recordsFile(), body ? `${body}\n` : "", "utf8");
}

export async function readRecords(): Promise<Visit[]> {
  const stored = await readStored();
  const seen = new Set(stored.map((visit) => visit.id));
  const legacyLines = await readLines(legacyFile());
  const legacy = legacyLines.flatMap((line, index) => {
    try {
      const visit = asVisit({ ...JSON.parse(line), id: `legacy-${index + 1}`, source: "contact" });
      if (!visit || seen.has(visit.id)) return [];
      return [visit];
    } catch {
      return [];
    }
  });
  return [...stored, ...legacy].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function saveVisit(input: {
  id?: string;
  source?: "contact" | "room";
  firstName?: string;
  surname?: string;
  email?: string;
  phone?: string;
  age?: string;
  marriageStatus?: string;
  location?: string;
  message?: string;
  service?: string;
}) {
  return enqueue(async () => {
    const visits = await readStored();
    const now = new Date().toISOString();
    const id = clip(input.id, 80);
    const index = id ? visits.findIndex((visit) => visit.id === id) : -1;
    if (index >= 0) {
      const current = visits[index];
      const next: Visit = {
        ...current,
        updatedAt: now,
        firstName: clip(input.firstName, 80) || current.firstName,
        surname: clip(input.surname, 80) || current.surname,
        email: clip(input.email, 160) || current.email,
        phone: clip(input.phone, 40) || current.phone,
        age: clip(input.age, 8) || current.age,
        marriageStatus: clip(input.marriageStatus, 80) || current.marriageStatus,
        location: clip(input.location, 120) || current.location,
        message: clip(input.message, 4000) || current.message,
        service: clip(input.service, 40) || current.service,
      };
      visits[index] = next;
      await writeStored(visits);
      return next;
    }

    const created: Visit = {
      id: randomUUID(),
      at: now,
      updatedAt: now,
      source: input.source === "room" ? "room" : "contact",
      firstName: clip(input.firstName, 80),
      surname: clip(input.surname, 80),
      email: clip(input.email, 160),
      phone: clip(input.phone, 40),
      age: clip(input.age, 8),
      marriageStatus: clip(input.marriageStatus, 80),
      location: clip(input.location, 120),
      message: clip(input.message, 4000),
      service: clip(input.service, 40),
      turns: [],
    };
    visits.push(created);
    await writeStored(visits);
    return created;
  });
}

export function appendTurns(id: string, turns: { role: "person" | "counselor"; text: string }[]) {
  return enqueue(async () => {
    const key = clip(id, 80);
    const nextTurns = turns
      .filter((turn) => (turn.role === "person" || turn.role === "counselor") && turn.text?.trim())
      .slice(0, 4)
      .map((turn) => ({
        at: new Date().toISOString(),
        role: turn.role,
        text: clip(turn.text, 2000),
      }));
    if (!key || nextTurns.length === 0) return;
    const visits = await readStored();
    const index = visits.findIndex((visit) => visit.id === key);
    if (index < 0) return;
    visits[index] = {
      ...visits[index],
      updatedAt: new Date().toISOString(),
      turns: [...visits[index].turns, ...nextTurns].slice(-80),
    };
    await writeStored(visits);
  });
}
