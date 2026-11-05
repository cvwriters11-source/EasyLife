export const serviceSlugs = [
  "life",
  "career",
  "marriage",
  "family",
  "grief",
  "stress",
  "growth",
] as const;

export type ServiceSlug = (typeof serviceSlugs)[number];

export type Service = {
  slug: ServiceSlug;
  label: string;
  title: string;
  counselor: string;
  room: string;
  summary: string;
  description: string;
  listensFor: string;
  points: string[];
  step: string;
  accent: string;
};

export const services: Service[] = [
  {
    slug: "life",
    label: "Life",
    title: "Life counseling",
    accent: "#1d74ff",
    counselor: "TALENT",
    room: "life room",
    summary: "Direction, loneliness, and days that no longer fit.",
    description:
      "A room for the larger questions: who you are becoming, why the week feels empty, and what you want your life to feel like from the inside.",
    listensFor: "Feeling lost, stuck, lonely, or unsure what you want next.",
    points: ["Feeling lost or stuck", "Loneliness", "Days that no longer fit", "A next step you can name"],
    step: "Name one thing that feels heavy, and one thing that is still yours. Keep both sentences short.",
  },
  {
    slug: "career",
    label: "Career",
    title: "Career development",
    accent: "#3d92ff",
    counselor: "Julian",
    room: "career room",
    summary: "Work, study, and the shape of the next chapter.",
    description:
      "For the job that drains you, the offer you are afraid to take, the studies that stalled, and the quiet question of what your work is for.",
    listensFor: "A boss, a job search, burnout at work, money tied to work, or a change you keep postponing.",
    points: ["A job that drains you", "A boss or a job search", "Studies that stalled", "The shape of the next chapter"],
    step: "Write two lines: the part of your work that drains you, and the part that still fits. That split is where we start.",
  },
  {
    slug: "marriage",
    label: "Marriage",
    title: "Marriage counseling",
    accent: "#1456d6",
    counselor: "Elena",
    room: "marriage room",
    summary: "Conflict, distance, trust, and daily life as a couple.",
    description:
      "A place to talk about a spouse or partner, the arguments that repeat, the silence after them, and whether the two of you still know how to reach each other.",
    listensFor: "A husband, wife, fiancé, divorce, trust, or the distance between you at home.",
    points: ["The argument that repeats", "Distance at home", "Trust", "One calm sentence"],
    step: "Choose one calm moment and say a single sentence that starts with “I feel,” rather than “you always.”",
  },
  {
    slug: "family",
    label: "Family",
    title: "Family counseling",
    accent: "#1493d6",
    counselor: "Naomi",
    room: "family room",
    summary: "Parents, children, siblings, and roles that got stuck.",
    description:
      "For the conversations that never quite happen at the table: ageing parents, a child you cannot reach, a sibling rift, or a household that runs on old wounds.",
    listensFor: "Parents, children, in-laws, brothers, sisters, or the mood of the house.",
    points: ["Parents and children", "Siblings and in-laws", "A tense house", "One unhurried conversation"],
    step: "Pick one conversation to have when everyone is fed and not rushing out the door. One subject only.",
  },
  {
    slug: "grief",
    label: "Grief",
    title: "Grief and loss",
    accent: "#4c6dff",
    counselor: "Thomas",
    room: "grief room",
    summary: "A death, a goodbye, or a life that changed too soon.",
    description:
      "Grief does not keep office hours. This room is for a person who died, a relationship that ended, or a future you can no longer have.",
    listensFor: "Death, mourning, a funeral, or the absence that follows you through ordinary days.",
    points: ["A death or a goodbye", "Ordinary days after loss", "A future you cannot have", "Time to name it"],
    step: "You do not have to tidy the loss. Set aside ten quiet minutes and let it be named, without fixing it.",
  },
  {
    slug: "stress",
    label: "Calm",
    title: "Stress and overwhelm",
    accent: "#0e4db8",
    counselor: "Priya",
    room: "calm room",
    summary: "Anxiety, poor sleep, and a mind that will not settle.",
    description:
      "When your body is braced all day, sleep breaks, and every small decision feels loud. This room slows the moment down before we talk about the cause.",
    listensFor: "Panic, worry, burnout, exhaustion, or a chest and mind that will not rest.",
    points: ["A mind that will not settle", "Poor sleep", "Panic and worry", "One slower breath"],
    step: "Put both feet on the floor, lengthen the exhale, and name five things you can see before the next decision.",
  },
  {
    slug: "growth",
    label: "Growth",
    title: "Personal growth",
    accent: "#5eb8ff",
    counselor: "Leila",
    room: "growth room",
    summary: "Confidence, habits, and self-respect you can live with.",
    description:
      "For the person you keep meaning to become: boundaries you do not keep, confidence that disappears in the room, and habits that no longer match your life.",
    listensFor: "Confidence, habits, boundaries, self-respect, or a change you want to make real.",
    points: ["Confidence that disappears", "Habits you want to change", "Boundaries", "One promise small enough to keep"],
    step: "Choose one promise small enough to keep today, smaller than your doubt. Do that, and nothing extra.",
  },
];

export function getService(slug: string): Service | undefined {
  return services.find((service) => service.slug === slug);
}

export function greetingFor(service: Service, firstName: string, concern: string): string {
  const hello = firstName ? `Hello ${firstName}.` : "Hello.";
  const trimmed = concern.replace(/\s+/g, " ").trim();
  const known =
    trimmed.length > 0 && trimmed.length <= 180
      ? ` I have what you shared, and we can begin with the part that feels heaviest.`
      : trimmed.length > 180
        ? ` I have what you wrote. We can begin with the part that feels heaviest.`
        : ` Tell me what brought you here, in whatever words you have.`;

  return `${hello} I'm ${service.counselor}. This is the ${service.room}.${known}`;
}
