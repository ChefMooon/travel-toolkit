import { createFileRoute, Link } from '@tanstack/react-router';
import { BlogTagLinks } from '@/components/BlogTagLinks';
import { blogPosts } from '@/lib/blogPosts';

function BlogPostCard({
  post,
}: {
  post: (typeof blogPosts)[number];
}) {
  return (
    <article className="blog-post-card">
      <header className="blog-post-card-header">
        <h2>
          <Link
            to="/blog/$slug"
            params={{ slug: post.slug }}
            className="blog-post-title-link"
          >
            {post.title}
          </Link>
        </h2>
        <time className="blog-post-date" dateTime={post.publishedAt}>
          {post.date}
        </time>
      </header>
      <p className="blog-post-summary">{post.summary}</p>
      <BlogTagLinks
        ariaLabel={`Tags for ${post.title}`}
        tags={post.tags}
        activeTag={undefined}
      />
    </article>
  );
}

function BlogIndexPage() {
  const { tag } = Route.useSearch();
  const tags = [...new Set(blogPosts.flatMap((post) => post.tags))].sort();
  const filteredPosts =
    tag === undefined ? blogPosts : blogPosts.filter((post) => post.tags.includes(tag));

  return (
    <main className="blog-page" aria-labelledby="blog-title">
      <header className="blog-page-header">
        <h1 id="blog-title">Blog</h1>
        <p>Articles and changelogs from Travel Toolkit.</p>
      </header>

      <section className="blog-filter" aria-labelledby="blog-filter-title">
        <h2 id="blog-filter-title">Filter by tag</h2>
        <BlogTagLinks
          ariaLabel="Filter posts by tag"
          tags={tags}
          activeTag={tag}
          showAll
        />
      </section>

      {filteredPosts.length === 0 ? (
        <div className="blog-empty-state" role="status">
          <p>
            {tag === undefined
              ? 'There are no published blog posts yet.'
              : `No posts were found for the “${tag}” tag.`}
          </p>
          <Link
            to="/blog"
            search={{ tag: undefined }}
            className="blog-clear-filter-link"
          >
            {tag === undefined ? 'View all posts' : 'Clear tag filter'}
          </Link>
        </div>
      ) : (
        <section className="blog-results" aria-label="Blog posts">
          <p className="blog-results-summary" role="status">
            {tag === undefined
              ? `Showing all ${filteredPosts.length} published ${
                  filteredPosts.length === 1 ? 'post' : 'posts'
                }.`
              : `Showing ${filteredPosts.length} ${
                  filteredPosts.length === 1 ? 'post' : 'posts'
                } tagged “${tag}”.`}
          </p>
          <ul className="blog-post-list" aria-label="Published blog posts">
            {filteredPosts.map((post) => (
              <li key={post.slug}>
                <BlogPostCard post={post} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

export const Route = createFileRoute('/blog/')({
  validateSearch: (search: Record<string, unknown>) => ({
    tag: typeof search['tag'] === 'string' ? search['tag'] : undefined,
  }),
  component: BlogIndexPage,
});
