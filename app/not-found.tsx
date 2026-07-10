import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="home-view" id="homeView">
      <div className="no-results" style={{ marginTop: '60px' }}>
        <div className="no-results-icon">🌴</div>
        <h2 style={{ fontFamily: 'var(--font-display)' }}>Page not found</h2>
        <p>That cheatsheet doesn&apos;t exist (yet).</p>
        <p>
          <Link
            className="back-home"
            href="/"
            style={{ display: 'inline-flex', marginTop: '12px' }}
          >
            <span>←</span> <span>Back to the hub</span>
          </Link>
        </p>
      </div>
    </main>
  );
}
