import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About us",
  description: "Why Easy Life keeps a separate room for life, work, marriage, family, grief, stress, and growth.",
};

export default function AboutPage() {
  return (
    <article className="shell reading">
      <p className="eyebrow">About us</p>
      <h1>A door you can open when the week gets too loud.</h1>
      <p>
        Easy Life began from a plain hope: a person should be able to sit down and talk
        about what is actually happening, without waiting until the problem has a tidy name.
      </p>
      <p>
        Some days the subject is a marriage. Some days it is the job, a parent, a death,
        a mind that will not rest, or the feeling that your life no longer fits. We keep
        those conversations in separate rooms so the person who meets you can stay with
        the thing you came to say.
      </p>
      <p className="pull">We listen first. We do not rush you toward a version of yourself you have not agreed to.</p>
      <p>
        TALENT, Julian, Elena, Naomi, Thomas, Priya, and Leila each keep one room.
        You can choose them from the services page, or tell us what is wrong on the
        contact page and we will open the room that matches.
      </p>
      <ul className="values">
        <li>
          <strong>One subject at a time</strong>
          The room stays with the problem you brought, until you ask to widen it.
        </li>
        <li>
          <strong>Plain language</strong>
          You will hear short, spoken sentences. No performance, no jargon for its own sake.
        </li>
        <li>
          <strong>A next step you can actually take</strong>
          When you are ready, the conversation offers one small step, not a new personality.
        </li>
        <li>
          <strong>A clear limit</strong>
          These are supportive conversations. They are not a diagnosis, a prescription,
          or a substitute for emergency care.
        </li>
      </ul>
      <p>
        If you are in immediate danger, contact local emergency services before you open a room.
      </p>
      <p>
        <Link className="button" href="/services">See the rooms</Link>
      </p>
    </article>
  );
}
