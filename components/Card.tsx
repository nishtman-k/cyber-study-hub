import Link from 'next/link';
import type { Cheatsheet } from '@/data/cheatsheets';

/**
 * One cheatsheet card: colour-coded stripe + accent, icon number, subtitle,
 * title, description, tags, and a topic count. Links to /cheatsheet/<id>.
 */
export default function Card({ sheet }: { sheet: Cheatsheet }) {
  return (
    <Link
      className="card"
      data-color={sheet.color}
      data-id={sheet.id}
      href={`/cheatsheet/${sheet.id}`}
    >
      <span className="card-stripe" />
      <div className="card-header">
        <span className="card-number">{sheet.icon}</span>
        <span className="card-subtitle">{sheet.subtitle}</span>
      </div>
      <h3>{sheet.title}</h3>
      <p>{sheet.description}</p>
      <div className="card-tags">
        {sheet.tags.map((tag) => (
          <span className="card-tag" key={tag}>
            {tag}
          </span>
        ))}
      </div>
      <div className="card-footer">
        <span className="card-topics">{sheet.topicCount} topics</span>
        <span className="card-arrow">→</span>
      </div>
    </Link>
  );
}
