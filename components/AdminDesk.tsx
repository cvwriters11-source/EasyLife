"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Visit } from "@/lib/records";
import { getService } from "@/lib/services";

function When({ value }: { value: string }) {
  const [label, setLabel] = useState(value);
  useEffect(() => {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      setLabel(date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" }));
    }
  }, [value]);
  return <>{label}</>;
}

export function AdminDesk({ records }: { records: Visit[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <section className="admin shell">
      <div className="admin-top">
        <div>
          <p className="eyebrow">Private</p>
          <h1>Admin desk</h1>
          <p>Every registration, contact message, and room conversation is listed here.</p>
        </div>
        <button className="button" type="button" onClick={signOut} disabled={pending}>
          Sign out
        </button>
      </div>

      {records.length === 0 ? (
        <div className="paper">
          <p>No one has written in yet.</p>
        </div>
      ) : (
        <div className="admin-list">
          {records.map((record) => {
            const room = getService(record.service);
            return (
              <article className="paper admin-card" key={record.id}>
                <header>
                  <div>
                    <h2>
                      {record.firstName} {record.surname}
                    </h2>
                    <p><When value={record.updatedAt} /></p>
                  </div>
                  <span>{record.source === "room" ? "Room entry" : "Contact form"}</span>
                </header>
                <dl>
                  <div>
                    <dt>Room</dt>
                    <dd>{room ? room.title : record.service || "Not chosen"}</dd>
                  </div>
                  <div>
                    <dt>Age</dt>
                    <dd>{record.age || "—"}</dd>
                  </div>
                  <div>
                    <dt>Marital status</dt>
                    <dd>{record.marriageStatus || "—"}</dd>
                  </div>
                  <div>
                    <dt>Location</dt>
                    <dd>{record.location || "—"}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{record.email || "—"}</dd>
                  </div>
                  <div>
                    <dt>Phone</dt>
                    <dd>{record.phone || "—"}</dd>
                  </div>
                </dl>
                {record.message ? (
                  <p className="admin-message">
                    <strong>What they wrote. </strong>
                    {record.message}
                  </p>
                ) : null}
                {record.turns.length > 0 ? (
                  <ol className="admin-turns">
                    {record.turns.map((turn, index) => (
                      <li key={`${turn.at}-${index}`} className={turn.role === "counselor" ? "is-counselor" : ""}>
                        <span>{turn.role === "counselor" ? "Counselor" : "Person"}</span>
                        {turn.text}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="admin-quiet">No conversation stored yet.</p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
