import { generateText, Output } from "ai";
import { z } from "zod";
import { matchService } from "@/lib/match";
import { saveVisit } from "@/lib/records";
import { serviceSlugs, type ServiceSlug } from "@/lib/services";

export const maxDuration = 30;

const schema = z.object({
  service: z.enum(serviceSlugs),
});

function clip(value: unknown, max: number) {
  return value?.toString().trim().slice(0, max) ?? "";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    message?: string;
    marriageStatus?: string;
    age?: string;
    firstName?: string;
    surname?: string;
    email?: string;
    phone?: string;
  } | null;

  const message = clip(body?.message, 4000);
  const marriageStatus = clip(body?.marriageStatus, 80);
  const ageValue = clip(body?.age, 8);
  const age = Number(ageValue);
  const local = matchService(message, marriageStatus);

  if (!message.trim() || (Number.isFinite(age) && age < 18)) {
    return Response.json({ service: local });
  }

  let service: ServiceSlug = local;
  try {
    const result = await generateText({
      model: "google/gemini-3.8-flash",
      output: Output.object({ schema }),
      instructions: `You choose the one Easy Life counseling room that best fits what a person wrote.
life: direction, loneliness, identity, a life that does not fit.
career: work, study, a boss, a job search, money that comes from work.
marriage: a spouse, partner, divorce, trust, or conflict in a couple.
family: parents, children, siblings, in-laws, the household.
grief: death, mourning, a goodbye, an absence.
stress: anxiety, panic, burnout, sleep, a body that will not settle.
growth: confidence, habits, boundaries, self-respect.
Pick the room they most need today. Do not explain.`,
      prompt: `Age: ${Number.isFinite(age) && age > 0 ? age : "unspecified"}
Marriage status: ${marriageStatus || "unspecified"}
What they wrote:
${message}`,
    });

    if (result.output?.service && serviceSlugs.includes(result.output.service)) {
      service = result.output.service;
    }
  } catch {
    service = local;
  }

  const visit = await saveVisit({
    source: "contact",
    firstName: clip(body?.firstName, 80),
    surname: clip(body?.surname, 80),
    email: clip(body?.email, 160),
    phone: clip(body?.phone, 40),
    age: ageValue,
    marriageStatus,
    message,
    service,
  });

  return Response.json({ service, id: visit.id });
}
