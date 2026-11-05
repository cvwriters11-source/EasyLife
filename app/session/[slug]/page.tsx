import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VoiceRoom } from "@/components/VoiceRoom";
import { getService } from "@/lib/services";

type Params = { slug: string };

export function generateStaticParams() {
  return [
    { slug: "life" },
    { slug: "career" },
    { slug: "marriage" },
    { slug: "family" },
    { slug: "grief" },
    { slug: "stress" },
    { slug: "growth" },
  ];
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return { title: "Room" };
  return {
    title: service.title,
    description: `${service.title} with ${service.counselor}. ${service.summary}`,
  };
}

export default async function SessionPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();
  return <VoiceRoom slug={service.slug} />;
}
