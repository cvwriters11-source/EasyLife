import Link from "next/link";

export default function NotFound() {
  return (
    <section className="shell reading">
      <p className="eyebrow">Missing room</p>
      <h1>That door does not open.</h1>
      <p>The page is not here. The counseling rooms still are.</p>
      <Link className="button" href="/services">Back to services</Link>
    </section>
  );
}
