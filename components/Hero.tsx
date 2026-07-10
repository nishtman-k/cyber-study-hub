import { CHEATSHEETS } from '@/data/cheatsheets';

/**
 * Landing hero: brand mark, headline, blurb, and live stats
 * (cheatsheet count + total topics, computed from the data).
 */
export default function Hero() {
  const cheatsheetCount = CHEATSHEETS.length;
  const topicCount = CHEATSHEETS.reduce((sum, c) => sum + c.topicCount, 0);

  return (
    <section className="hero">
      <div className="hero-text">
        <div className="brand-mark">Cybersecurity Study Hub</div>
        <h1>
          Learn Linux
          <br />
          security, <span className="accent">deliciously </span>.
        </h1>
        <p>
          A friendly, hands-on collection of cheatsheets for cybersecurity
          students. Real commands, real examples, no fluff.
        </p>
        <div className="hero-stats">
          <div className="stat">
            <span className="stat-num" id="statCheats">
              {cheatsheetCount}
            </span>
            <span className="stat-label">cheatsheets</span>
          </div>
          <div className="stat">
            <span className="stat-num" id="statTopics">
              {topicCount}
            </span>
            <span className="stat-label">topics covered</span>
          </div>
          <div className="stat">
            <span className="stat-num">200+</span>
            <span className="stat-label">commands</span>
          </div>
        </div>
      </div>
      <div className="hero-deco" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="blob blob-4" />
      </div>
    </section>
  );
}
