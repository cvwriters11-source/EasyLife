import type { Service } from "./services";

export type Turn = { role: "user" | "counselor"; text: string };

function echo(text: string): string | null {
  const clean = text.replace(/\s+/g, " ").trim().replace(/[.?!]+$/g, "");
  if (clean.length < 8 || clean.length > 160) return null;
  return clean;
}

export function spokenReply(input: {
  service: Service;
  firstName: string;
  latest: string;
  history: Turn[];
}): string {
  const name = input.firstName.trim();
  const address = name ? `${name}, ` : "";
  const heard = echo(input.latest);
  const userTurns = input.history.filter((turn) => turn.role === "user").length;
  const heardLine = heard ? `I hear you. ` : "I am with you. ";

  if (userTurns <= 1) {
    return `${address}${heardLine}We do not have to solve all of it today. What feels hardest, if you name only one piece?`;
  }

  if (userTurns === 2) {
    return `${address}There is a pattern in the way you are telling it, and it sounds tiring to carry. What have you already tried, even if it only helped for a moment?`;
  }

  if (userTurns === 3) {
    return `${address}Here is one step that fits this room. ${input.service.step} Would you be willing to try that, or does another step feel more honest?`;
  }

  return `${address}I have heard the weight of this, and I have also heard that you are still here talking about it. What do you want the next few days to feel like, even if the problem is not finished?`;
}
