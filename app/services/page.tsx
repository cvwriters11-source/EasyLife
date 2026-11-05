import type { Metadata } from "next";
import Link from "next/link";
import { services } from "@/lib/services";

export const metadata: Metadata = {
  title: "Services",
  description: "Life counseling, career development, marriage counseling, family, grief, stress, and personal growth.",
};

export default function ServicesPage() {
  return (
    <section className="shell service-board">
      <div className="service-stage">
        <p className="eyebrow">Services</p>
        <h1>Choose the room, then speak.</h1>
        <p className="stage-lead">
          Open the conversation that fits. If you are not sure, write what is happening
          and we will take you there.
        </p>
        <div className="plan-grid">
          {services.map((service) => (
            <article key={service.slug} className="plan" style={{ ["--plan" as string]: service.accent }}>
              <div className="plan-banner">
                <span className="plan-tab">{service.label}</span>
              </div>
              <span className="plan-badge">
                <strong>{service.counselor}</strong>
                <em>with you</em>
              </span>
              <h2>{service.title}</h2>
              <ul>
                {service.points.map((point) => (
                  <li key={point}>
                    <span aria-hidden="true">✓</span>
                    {point}
                  </li>
                ))}
              </ul>
              <Link className="plan-button" href={`/session/${service.slug}`}>Open this room</Link>
            </article>
          ))}
        </div>
        <p className="stage-foot">
          <Link href="/contact">I would rather describe the problem first</Link>
        </p>
      </div>
    </section>
  );
}
