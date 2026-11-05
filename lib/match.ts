import { serviceSlugs, type ServiceSlug } from "./services";

type Rule = { slug: ServiceSlug; weight: number; phrases: string[] };

const rules: Rule[] = [
  {
    slug: "grief",
    weight: 5,
    phrases: [
      "grief",
      "died",
      "death",
      "dead",
      "passed away",
      "passing",
      "funeral",
      "mourning",
      "widow",
      "widower",
      "lost my",
      "loss of",
    ],
  },
  {
    slug: "marriage",
    weight: 4,
    phrases: [
      "marriage",
      "married",
      "husband",
      "wife",
      "spouse",
      "partner",
      "divorce",
      "separated",
      "separation",
      "affair",
      "cheating",
      "fiancé",
      "fiance",
      "fiancée",
      "engagement",
      "intimacy",
      "we fight",
      "my marriage",
    ],
  },
  {
    slug: "career",
    weight: 4,
    phrases: [
      "career",
      "job",
      "work",
      "boss",
      "promotion",
      "unemployed",
      "interview",
      "salary",
      "coworker",
      "colleague",
      "resign",
      "office",
      "studies",
      "studying",
      "university",
      "degree",
      "business",
    ],
  },
  {
    slug: "family",
    weight: 4,
    phrases: [
      "family",
      "mother",
      "father",
      "mom",
      "dad",
      "parent",
      "son",
      "daughter",
      "child",
      "children",
      "sibling",
      "brother",
      "sister",
      "in-law",
      "inlaw",
      "teenager",
    ],
  },
  {
    slug: "stress",
    weight: 4,
    phrases: [
      "stress",
      "stressed",
      "anxiety",
      "anxious",
      "panic",
      "overwhelm",
      "overwhelmed",
      "burnout",
      "burnt out",
      "can't sleep",
      "cannot sleep",
      "insomnia",
      "worry",
      "worried",
    ],
  },
  {
    slug: "growth",
    weight: 3,
    phrases: [
      "confidence",
      "confident",
      "self-esteem",
      "self esteem",
      "habit",
      "habits",
      "boundary",
      "boundaries",
      "purpose",
      "discipline",
      "procrastinat",
      "grow",
      "growth",
    ],
  },
  {
    slug: "life",
    weight: 2,
    phrases: [
      "life",
      "lonely",
      "loneliness",
      "lost",
      "direction",
      "meaning",
      "identity",
      "stuck",
      "empty",
      "future",
      "who am i",
    ],
  },
];

function hits(text: string, phrase: string): boolean {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(text);
}

export function matchService(message: string, marriageStatus = ""): ServiceSlug {
  const text = message.toLowerCase();
  const scores = new Map<ServiceSlug, number>(serviceSlugs.map((slug) => [slug, 0]));

  for (const rule of rules) {
    for (const phrase of rule.phrases) {
      if (hits(text, phrase)) {
        scores.set(rule.slug, (scores.get(rule.slug) ?? 0) + rule.weight);
      }
    }
  }

  const status = marriageStatus.toLowerCase();
  if (/(married|separated|engaged|relationship)/.test(status) && (scores.get("marriage") ?? 0) > 0) {
    scores.set("marriage", (scores.get("marriage") ?? 0) + 1);
  }

  let best: ServiceSlug = "life";
  let bestScore = 0;
  for (const slug of serviceSlugs) {
    const score = scores.get(slug) ?? 0;
    if (score > bestScore) {
      best = slug;
      bestScore = score;
    }
  }

  return bestScore > 0 ? best : "life";
}
