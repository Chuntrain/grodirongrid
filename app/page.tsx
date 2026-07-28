import type { Metadata } from "next";
import { DailyGrid } from "./daily-grid";
import { teams, teamLogo } from "./game-data";

const faq = [
  {
    question: "What is Gridiron Grid?",
    answer:
      "Gridiron Grid is a free daily NFL trivia game. Each row and column gives you a football clue, and your job is to name one player who matches both clues for every square in the 3×3 board.",
  },
  {
    question: "When does a new Gridiron Grid appear?",
    answer:
      "A fresh puzzle is published every day at 8:00 PM Eastern Time. Your current score and streak are saved on this device so you can return without creating an account.",
  },
  {
    question: "How many guesses do I get?",
    answer:
      "You have nine total guesses—one for each square. A correct player locks the square; a wrong answer still uses that guess, so check the row and column clues before submitting.",
  },
  {
    question: "Can one player be used more than once?",
    answer:
      "No. Each player may be used only once in the daily grid. This makes versatile players useful, but it also rewards planning before you commit an answer.",
  },
  {
    question: "Do trades and former teams count?",
    answer:
      "Yes. A player qualifies for a team if he appeared in at least one regular-season game for that franchise. Historical franchise records and renamed teams are treated as the same lineage.",
  },
  {
    question: "Can I share my score without spoiling answers?",
    answer:
      "Yes. The Share Result button creates a spoiler-free emoji grid showing correct, missed, and unfinished squares, plus your score and streak.",
  },
];

export const metadata: Metadata = {
  title: "Gridiron Grid – Free Daily NFL Grid Game | New Puzzle Every Day",
  description:
    "Play the free daily Gridiron Grid. Fill a 3×3 football grid by matching NFL players to teams, stats, and achievements. A new puzzle arrives every day.",
  alternates: { canonical: "/" },
};

export default function Home() {
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Game",
      name: "Gridiron Grid",
      description:
        "A free daily NFL trivia puzzle where players complete a 3×3 grid by matching football players to teams, statistics, and achievements.",
      genre: ["Trivia", "Sports"],
      gamePlatform: "Web browser",
      playMode: "SinglePlayer",
      applicationCategory: "Game",
      isAccessibleForFree: true,
      inLanguage: "en-US",
      url: "https://gridirongrid.to/",
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://gridirongrid.to/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "NFL Grid",
          item: "https://gridirongrid.to/#play",
        },
      ],
    },
  ];

  return (
    <>
      <header className="site-header">
        <a className="brand" href="/" aria-label="Gridiron Grid home">
          <span className="brand-ball">G</span>
          <span>GRIDIRON<span>GRID</span></span>
        </a>
        <nav aria-label="Game categories">
          <a className="active" href="#play">NFL Grid</a>
          <a href="/nba-grid/">NBA Grid</a>
          <a href="#more-games">MLB Grid</a>
        </nav>
        <a className="today-link" href="#play">Today&apos;s grid <span>↗</span></a>
      </header>

      <main>
        <section className="hero" id="play">
          <div className="eyebrow"><span /> NEW PUZZLE EVERY DAY</div>
          <h1>Play the Daily<br /><em>Gridiron Grid</em></h1>
          <p className="hero-copy">
            Nine squares. Nine guesses. Prove how deep your NFL knowledge goes.
          </p>
          <DailyGrid />
        </section>

        <section className="ticker" aria-label="Game features">
          <span>FRESH GRID DAILY</span><i>✦</i>
          <span>9 GUESSES</span><i>✦</i>
          <span>BUILD YOUR STREAK</span><i>✦</i>
          <span>SHARE YOUR SCORE</span>
        </section>

        <section className="team-directory" aria-labelledby="teams-title">
          <div className="team-directory-head">
            <div><p className="section-kicker">ALL 32 CLUBS</p><h2 id="teams-title">Every team is in play</h2></div>
            <p>Today’s board pulls three clubs from the complete NFL field. Come back after 8 PM ET for a new combination.</p>
          </div>
          <div className="conference-groups">
            {(["AFC", "NFC"] as const).map((conference) => (
              <section key={conference} className="conference">
                <h3>{conference}</h3>
                <div className="team-wall">
                  {teams.filter((team) => team.conference === conference).map((team) => (
                    <div className="team-tile" key={team.id} style={{ "--team": team.color, "--accent": team.accent } as React.CSSProperties}>
                      <img src={teamLogo(team.id)} alt={`${team.name} logo`} width="48" height="48" loading="lazy" />
                      <span><strong>{team.shortName}</strong><small>{team.division}</small></span>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <p className="marks-note">Player history and season statistics are built from nflverse data, with a curated historical supplement. Team names and logos are trademarks of their respective owners. Gridiron Grid is an independent fan project.</p>
        </section>

        <article className="guide">
          <div className="breadcrumbs" aria-label="Breadcrumb">
            <a href="/">Home</a><span>/</span><span>NFL Grid</span>
          </div>

          <section className="intro-grid" id="how-to-play">
            <div>
              <p className="section-kicker">THE FILM ROOM</p>
              <h2>How to play<br />Gridiron Grid</h2>
            </div>
            <div className="lead-copy">
              <p>
                Gridiron Grid is a daily NFL trivia challenge built around a simple
                3×3 board. The three clues across the top meet the three clues down
                the side. Every square needs a player whose career matches both.
                Complete all nine before your guesses run out.
              </p>
              <p>
                Start by reading the full board. A square might ask for a player
                who suited up for the <strong>Chicago Bears</strong> and also made
                the <strong>Pro Bowl</strong>, or a player connected to two
                franchises. Type a name, choose the matching player, and submit.
                Correct answers turn green and lock in place.
              </p>
            </div>
          </section>

          <section className="steps" aria-label="How to play steps">
            <div><b>01</b><h3>Read the clues</h3><p>Match one row condition with one column condition.</p></div>
            <div><b>02</b><h3>Pick a player</h3><p>Use team history, awards, stats, and career milestones.</p></div>
            <div><b>03</b><h3>Complete the nine</h3><p>Every choice counts. Finish the board in nine guesses.</p></div>
          </section>

          <section className="strategy">
            <div className="strategy-copy">
              <p className="section-kicker">COACH&apos;S NOTES</p>
              <h2>Tips for a perfect 9/9</h2>
              <p>
                The best approach is not to fill the board in order. Scan all nine
                squares first and lock in the players you know immediately. Those
                answers reduce the choices you need to hold in your head and help
                you avoid using the same flexible player twice.
              </p>
              <ul>
                <li><span>01</span><div><strong>Take the sure points first.</strong> Fill obvious team-and-award combinations before tackling obscure franchise overlaps.</div></li>
                <li><span>02</span><div><strong>Remember the whole career.</strong> Short stints, late-career moves, and practice-squad time can separate a good guess from a miss.</div></li>
                <li><span>03</span><div><strong>Save versatile players.</strong> Journeymen may fit several squares. Use specialists where possible and keep flexible names available.</div></li>
                <li><span>04</span><div><strong>Check the exact wording.</strong> “Won a Super Bowl” and “played in a Super Bowl” are different clues.</div></li>
              </ul>
            </div>
            <aside className="playbook-card" aria-label="Winning playbook">
              <div className="playbook-top"><span>GRIDIRON GRID</span><span>PLAYBOOK 01</span></div>
              <div className="mini-field">
                <span className="x x1">×</span><span className="x x2">×</span><span className="x x3">×</span>
                <span className="o o1">○</span><span className="o o2">○</span><span className="o o3">○</span>
                <span className="route r1">↗</span><span className="route r2">⤴</span>
              </div>
              <strong>GO WITH<br />WHAT YOU KNOW.</strong>
            </aside>
          </section>

          <section className="daily">
            <p className="section-kicker">MAKE IT A RITUAL</p>
            <h2>Why play every day?</h2>
            <div className="daily-grid">
              <p>
                Each new grid is a quick test of memory, football history, and
                roster knowledge. It takes only a few minutes, but the changing
                combinations keep the challenge fresh. Your streak gives every
                puzzle a little more weight.
              </p>
              <p>
                The spoiler-free result is made for group chats and friendly
                competition. Compare scores, discover the forgotten player your
                friend remembered, and come back tomorrow for a completely new
                board.
              </p>
            </div>
          </section>

          <section className="faq" id="faq">
            <p className="section-kicker">POSTGAME PRESSER</p>
            <h2>Frequently asked questions</h2>
            <div className="faq-list">
              {faq.map((item, index) => (
                <details key={item.question} open={index === 0}>
                  <summary>{item.question}<span>+</span></summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        </article>

        <section className="more-games" id="more-games">
          <div>
            <p className="section-kicker">KEEP PLAYING</p>
            <h2>More daily games</h2>
          </div>
          <div className="game-links">
            <a href="#play"><span>🏈</span><div><small>FOOTBALL</small><strong>Red Zone</strong></div><b>↗</b></a>
            <a href="/nba-grid/"><span>🏀</span><div><small>BASKETBALL</small><strong>NBA Grid</strong></div><b>↗</b></a>
            <a href="#play"><span>⚾</span><div><small>BASEBALL</small><strong>Diamond Nine</strong></div><b>↗</b></a>
          </div>
        </section>
      </main>

      <footer>
        <a className="brand footer-brand" href="/"><span className="brand-ball">G</span><span>GRIDIRON<span>GRID</span></span></a>
        <p>Built for fans who remember every snap.</p>
        <div><a href="#play">Play</a><a href="#how-to-play">How to play</a><a href="#faq">FAQ</a></div>
        <small>© 2026 Gridiron Grid. Not affiliated with the NFL.</small>
      </footer>

      {schema.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}
