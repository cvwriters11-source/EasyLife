import { generateText } from "ai";
import { cleanSpoken, counselorBrief } from "@/lib/counselor";
import { crisisReply, isCrisis, minorReply } from "@/lib/crisis";
import { spokenReply } from "@/lib/fallback";
import { appendTurns } from "@/lib/records";
import { getService, serviceSlugs, type ServiceSlug } from "@/lib/services";

export const maxDuration = 30;

type IncomingTurn = { role?: string; text?: string };

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    service?: string;
    firstName?: string;
    age?: string;
    marriageStatus?: string;
    location?: string;
    concern?: string;
    history?: IncomingTurn[];
    recordId?: string;
  } | null;

  const slug = body?.service ?? "";
  const service = serviceSlugs.includes(slug as ServiceSlug) ? getService(slug) : undefined;
  if (!service) {
    return Response.json({ text: "That room is not open. Choose another from the services page." }, { status: 400 });
  }

  const age = Number(body?.age);
  if (Number.isFinite(age) && age > 0 && age < 18) {
    return Response.json({ text: minorReply, blocked: true });
  }

  const history = (body?.history ?? [])
    .filter((turn) => (turn.role === "user" || turn.role === "assistant") && turn.text?.trim())
    .slice(-12)
    .map((turn) => ({
      role: turn.role === "assistant" ? ("assistant" as const) : ("user" as const),
      text: turn.text!.trim().slice(0, 2000),
    }));

  const latest = [...history].reverse().find((turn) => turn.role === "user")?.text ?? "";
  const firstName = body?.firstName?.toString().slice(0, 80) ?? "";
  const recordId = body?.recordId?.toString().slice(0, 80) ?? "";

  async function storeExchange(reply: string) {
    if (!recordId || !latest) return;
    try {
      await appendTurns(recordId, [
        { role: "person", text: latest },
        { role: "counselor", text: reply },
      ]);
    } catch {
      // The spoken reply still returns when the desk cannot store the line.
    }
  }

  if (latest && isCrisis(latest)) {
    await storeExchange(crisisReply);
    return Response.json({ text: crisisReply });
  }

  const local = spokenReply({
    service,
    firstName,
    latest,
    history: history.map((turn) => ({
      role: turn.role === "assistant" ? "counselor" : "user",
      text: turn.text,
    })),
  });

  try {
    const result = await generateText({
      model: "google/gemini-3.8-flash",
      maxOutputTokens: 180,
      instructions: counselorBrief({
        service,
        firstName,
        age: body?.age?.toString() ?? "",
        marriageStatus: body?.marriageStatus?.toString().slice(0, 80) ?? "",
        location: body?.location?.toString().slice(0, 120) ?? "",
        concern: body?.concern?.toString().slice(0, 2000) ?? "",
      }),
      messages: history.map((turn) => ({
        role: turn.role,
        content: turn.text,
      })),
    });

    const text = cleanSpoken(result.text) || local;
    await storeExchange(text);
    return Response.json({ text });
  } catch {
    await storeExchange(local);
    return Response.json({ text: local });
  }
}
