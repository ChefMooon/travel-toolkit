import { Link } from '@tanstack/react-router';

interface BlogTagLinksProps {
  ariaLabel: string;
  tags: readonly string[];
  activeTag: string | undefined;
  showAll?: boolean;
}

export function BlogTagLinks({
  ariaLabel,
  tags,
  activeTag,
  showAll = false,
}: BlogTagLinksProps) {
  return (
    <nav className="blog-tag-nav" aria-label={ariaLabel}>
      <ul className="blog-tag-list">
        {showAll ? (
          <li>
            <Link
              to="/blog"
              search={{ tag: undefined }}
              className="blog-tag-link"
              aria-current={activeTag === undefined ? 'page' : undefined}
            >
              All posts
            </Link>
          </li>
        ) : null}
        {tags.map((tag) => (
          <li key={tag}>
            <Link
              to="/blog"
              search={{ tag }}
              className="blog-tag-link"
              aria-label={`Filter posts by tag ${tag}`}
              aria-current={activeTag === tag ? 'page' : undefined}
            >
              {tag}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
