import type { ServiceSlug } from "./services";

export const intakeKey = "easylife.intake";

export type Intake = {
  firstName: string;
  surname: string;
  email: string;
  phone: string;
  age: string;
  marriageStatus: string;
  location: string;
  message: string;
  service?: ServiceSlug;
  confirmedAdult?: boolean;
  recordId?: string;
};

export const emptyIntake: Intake = {
  firstName: "",
  surname: "",
  email: "",
  phone: "",
  age: "",
  marriageStatus: "",
  location: "",
  message: "",
};

export function readIntake(): Intake | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(intakeKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Intake;
    if (!parsed || typeof parsed !== "object") return null;
    return { ...emptyIntake, ...parsed };
  } catch {
    return null;
  }
}

export function writeIntake(intake: Intake) {
  sessionStorage.setItem(intakeKey, JSON.stringify(intake));
}
