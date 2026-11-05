const crisisPatterns = [
  /suicid/i,
  /kill myself/i,
  /killing myself/i,
  /end my life/i,
  /want to die/i,
  /wanna die/i,
  /do not want to live/i,
  /don't want to live/i,
  /dont want to live/i,
  /don't want to be alive/i,
  /self[-\s]?harm/i,
  /hurt myself/i,
  /cut myself/i,
  /take my (own )?life/i,
  /overdose/i,
];

export function isCrisis(text: string): boolean {
  return crisisPatterns.some((pattern) => pattern.test(text));
}

export const crisisReply =
  "I hear how much pain is in what you just said. Please reach a person who can stay with you right now. If you might act on these feelings, contact emergency services where you are. In the United States, call or text 988. In South Africa, call SADAG on 0800 567 567. Anywhere else, the International Association for Suicide Prevention lists local lines at iasp.info. You matter, and this should not be carried alone.";

export const minorReply =
  "Easy Life rooms are for adults. If you are under 18, please talk with a parent, guardian, teacher, or a counselor who works with young people. If you are in danger, contact local emergency services now.";
