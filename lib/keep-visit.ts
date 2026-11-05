import type { Intake } from "./intake";

export async function keepVisit(intake: Intake, source: "contact" | "room") {
  try {
    const response = await fetch("/api/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...intake, source }),
    });
    if (!response.ok) return intake.recordId ?? "";
    const data = (await response.json()) as { id?: string };
    return data.id || intake.recordId || "";
  } catch {
    return intake.recordId ?? "";
  }
}

export async function keepTurns(id: string | undefined, turns: { role: "person" | "counselor"; text: string }[]) {
  if (!id || turns.length === 0) return;
  try {
    await fetch("/api/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, turns }),
    });
  } catch {
    // The room still continues when a line cannot be stored.
  }
}
