import { appendTurns, saveVisit } from "@/lib/records";

function clip(value: unknown, max: number) {
  return value?.toString().trim().slice(0, max) ?? "";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    id?: string;
    source?: string;
    firstName?: string;
    surname?: string;
    email?: string;
    phone?: string;
    age?: string;
    marriageStatus?: string;
    location?: string;
    message?: string;
    service?: string;
    turns?: { role?: string; text?: string }[];
  } | null;

  const id = clip(body?.id, 80);
  const turns = (body?.turns ?? [])
    .filter((turn) => (turn.role === "person" || turn.role === "counselor") && turn.text?.trim())
    .map((turn) => ({
      role: turn.role as "person" | "counselor",
      text: clip(turn.text, 2000),
    }));

  if (id && turns.length > 0 && !body?.firstName) {
    await appendTurns(id, turns);
    return Response.json({ id });
  }

  const age = Number(clip(body?.age, 8));
  if (Number.isFinite(age) && age > 0 && age < 18) {
    return Response.json({ error: "adults" }, { status: 403 });
  }

  const firstName = clip(body?.firstName, 80);
  const surname = clip(body?.surname, 80);
  if (firstName.length < 2 || surname.length < 2) {
    return Response.json({ error: "name" }, { status: 400 });
  }

  const visit = await saveVisit({
    id,
    source: body?.source === "room" ? "room" : "contact",
    firstName,
    surname,
    email: clip(body?.email, 160),
    phone: clip(body?.phone, 40),
    age: clip(body?.age, 8),
    marriageStatus: clip(body?.marriageStatus, 80),
    location: clip(body?.location, 120),
    message: clip(body?.message, 4000),
    service: clip(body?.service, 40),
  });

  return Response.json({ id: visit.id });
}
