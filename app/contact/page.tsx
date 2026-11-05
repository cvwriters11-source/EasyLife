import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Tell Easy Life your name and what is happening. We open the counseling room that fits.",
};

export default function ContactPage() {
  return (
    <section className="shell contact-layout">
      <div className="contact-copy">
        <p className="eyebrow">Contact us</p>
        <h1>Tell us what you are carrying.</h1>
        <p className="lede">
          Leave your name, surname, email, phone, age, and marriage status.
          Then write the problem in your own words. We use that message to open
          the room that fits — life, career, marriage, family, grief, stress, or growth.
        </p>
        <p className="muted">
          Your email and phone stay with this enquiry. The room itself uses your first name
          and what you chose to share. Sessions are for adults.
        </p>
      </div>
      <ContactForm />
    </section>
  );
}
