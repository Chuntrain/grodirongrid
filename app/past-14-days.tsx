import { easternPuzzleDate } from "./game-data";

type Props = {
  sport: "NFL" | "NBA" | "MLB";
};

export function Past14Days({ sport }: Props) {
  const today = new Date(`${easternPuzzleDate()}T12:00:00Z`);
  const root = sport === "NFL" ? "" : `/${sport.toLowerCase()}-grid`;
  const days = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - index - 1);
    return date.toISOString().slice(0, 10);
  });

  return (
    <section className="past-14" aria-labelledby={`${sport.toLowerCase()}-past-title`}>
      <div className="past-14-head">
        <div>
          <p className="section-kicker">LAST 14 DAYS</p>
          <h2 id={`${sport.toLowerCase()}-past-title`}>Replay or reveal</h2>
        </div>
        <p>Choose any completed daily grid. Play it without spoilers, or open its official answers.</p>
      </div>
      <div className="past-14-grid">
        {days.map((date, index) => (
          <article key={date}>
            <span>#{String(index + 1).padStart(2, "0")}</span>
            <strong>{date}</strong>
            <div>
              <a href={`${root}/game/${date}/`}>Play grid</a>
              <a href={`${root}/archive/?answers=${date}#${date}`}>View answers</a>
            </div>
          </article>
        ))}
      </div>
      <a className="past-14-all" href={`${root}/archive/`}>Open the complete answer archive →</a>
    </section>
  );
}
