import { CHEATSHEETS } from '@/data/cheatsheets';
import { countCommands } from '@/lib/commands';

/**
 * Landing hero: brand mark, headline, blurb, and live stats
 * (cheatsheet count, total topics, and command count — all computed from the
 * data and content at build time, so none of them go stale).
 */
export default function Hero() {
  const cheatsheetCount = CHEATSHEETS.length;
  const topicCount = CHEATSHEETS.reduce((sum, c) => sum + c.topicCount, 0);
  const commandCount = countCommands();

  return (
    <section className="hero">
      <div className="hero-text">
        <div className="brand-mark">Cybersecurity Study Hub</div>
        <h1>
          Learn Cyber
          <br />
          Security, <span className="accent">Deliciously</span>
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
            <span className="stat-num" id="statCommands">
              {commandCount}
            </span>
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
