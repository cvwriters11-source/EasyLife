import Link from "next/link";
import { services } from "@/lib/services";

export default function HomePage() {
  return (
    <>
      <section className="shell hero">
        <div>
          <p className="eyebrow">Private counseling</p>
          <h1>Speak about the life you are actually living.</h1>
          <p className="lede">
            Easy Life is a quiet set of rooms for life counseling, career development,
            marriage counseling, and the seasons around them. Choose a room yourself,
            or tell us what is happening and we will open the conversation that fits.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/services">Choose a room</Link>
            <Link className="button-ghost" href="/contact">Tell us what is happening</Link>
          </div>
          <img className="room-scene" src="/counsel-room.svg" alt="Two people sitting together in a quiet counseling room" />
        </div>
        <aside className="hero-panel">
          <p className="panel-kicker">Open rooms</p>
          <ol>
            {services.slice(0, 4).map((service) => (
              <li key={service.slug}>
                <Link href={`/session/${service.slug}`}>
                  <strong>{service.title}</strong>
                  <span>{service.summary}</span>
                </Link>
              </li>
            ))}
          </ol>
          <Link className="room-index-link" href="/services">See all seven rooms</Link>
        </aside>
      </section>

      <section className="shell visit">
        <p className="section-kicker">A visit</p>
        <h2>Three quiet steps.</h2>
        <ol className="steps">
          <li>
            <em>01</em>
            <h3>Choose</h3>
            <p>Open the room that matches what you are carrying. If you are unsure, write it in your own words.</p>
          </li>
          <li>
            <em>02</em>
            <h3>Arrive</h3>
            <p>We read what you shared and take you to the counselor who stays with that subject.</p>
          </li>
          <li>
            <em>03</em>
            <h3>Speak</h3>
            <p>Talk the way you would across a table. If speaking feels like too much, you can type.</p>
          </li>
        </ol>
      </section>

      <section className="shell room-index">
        <p className="section-kicker">Services</p>
        <h2>A different room for a different weight.</h2>
        <p className="muted">A marriage problem is not a career problem, and grief is not everyday stress. You should not have to explain one inside the other.</p>
        <ul className="room-list">
          {services.map((service, index) => (
            <li key={service.slug}>
              <Link href={`/session/${service.slug}`}>
                <span className="index">0{index + 1}</span>
                <span>
                  <h3>{service.title}</h3>
                  <p>{service.summary} With {service.counselor}.</p>
                </span>
                <span className="open-label">Open</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="shell note">
        <blockquote>You do not need the right words. You need a place that can stay with the ones you have.</blockquote>
        <Link className="button" href="/contact">Begin with a message</Link>
      </section>
    </>
  );
}
