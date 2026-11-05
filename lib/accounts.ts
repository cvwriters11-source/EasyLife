import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { promisify } from "util";
import { saveVisit } from "@/lib/records";

const scryptAsync = promisify(scrypt);

export type PublicAccount = {
  id: string;
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

type Account = PublicAccount & {
  salt: string;
  passwordHash: string;
  createdAt: string;
};

const file = () => path.join(process.cwd(), "data", "accounts.jsonl");

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

function publicAccount(account: Account): PublicAccount {
  return {
    id: account.id,
    email: account.email,
    firstName: account.firstName,
    surname: account.surname,
    age: account.age,
    marriageStatus: account.marriageStatus,
    location: account.location,
    phone: account.phone,
    message: account.message,
    recordId: account.recordId,
  };
}

async function readAccounts(): Promise<Account[]> {
  try {
    const raw = await readFile(file(), "utf8");
    return raw
      .split("\n")
      .filter((line) => line.trim())
      .flatMap((line) => {
        try {
          const row = JSON.parse(line) as Account;
          if (!row?.id || !row.email || !row.passwordHash || !row.salt) return [];
          return [row];
        } catch {
          return [];
        }
      });
  } catch {
    return [];
  }
}

async function writeAccounts(accounts: Account[]) {
  await mkdir(path.dirname(file()), { recursive: true });
  const body = accounts.map((account) => JSON.stringify(account)).join("\n");
  await writeFile(file(), body ? `${body}\n` : "", "utf8");
}

async function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const derived = (await scryptAsync(password, salt, 32)) as Buffer;
  return { salt, passwordHash: derived.toString("hex") };
}

async function passwordMatches(password: string, salt: string, passwordHash: string) {
  const derived = (await scryptAsync(password, salt, 32)) as Buffer;
  const expected = Buffer.from(passwordHash, "hex");
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

export function findAccount(id: string) {
  return enqueue(async () => {
    const accounts = await readAccounts();
    const account = accounts.find((item) => item.id === id);
    return account ? publicAccount(account) : null;
  });
}

export function registerAccount(input: {
  email: string;
  password: string;
  firstName: string;
  surname: string;
  age: string;
  marriageStatus: string;
  location: string;
  phone: string;
  message: string;
}) {
  return enqueue(async () => {
    const email = clip(input.email, 160).toLowerCase();
    const accounts = await readAccounts();
    if (accounts.some((account) => account.email === email)) {
      return { error: "exists" as const };
    }
    const visit = await saveVisit({
      source: "room",
      firstName: clip(input.firstName, 80),
      surname: clip(input.surname, 80),
      email,
      phone: clip(input.phone, 40),
      age: clip(input.age, 8),
      marriageStatus: clip(input.marriageStatus, 80),
      location: clip(input.location, 120),
      message: clip(input.message, 4000),
    });
    const secret = await hashPassword(input.password);
    const account: Account = {
      id: randomBytes(16).toString("hex"),
      email,
      firstName: clip(input.firstName, 80),
      surname: clip(input.surname, 80),
      age: clip(input.age, 8),
      marriageStatus: clip(input.marriageStatus, 80),
      location: clip(input.location, 120),
      phone: clip(input.phone, 40),
      message: clip(input.message, 4000),
      recordId: visit.id,
      createdAt: new Date().toISOString(),
      salt: secret.salt,
      passwordHash: secret.passwordHash,
    };
    accounts.push(account);
    await writeAccounts(accounts);
    return { account: publicAccount(account) };
  });
}

export function loginAccount(email: string, password: string) {
  return enqueue(async () => {
    const accounts = await readAccounts();
    const account = accounts.find((item) => item.email === clip(email, 160).toLowerCase());
    if (!account) return null;
    const matches = await passwordMatches(password, account.salt, account.passwordHash);
    return matches ? publicAccount(account) : null;
  });
}
