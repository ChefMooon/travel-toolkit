import { createFileRoute, Link } from '@tanstack/react-router';
import { BlogTagLinks } from '@/components/BlogTagLinks';
import { blogPosts, getBlogPostDisplayDate } from '@/lib/blogPosts';
import { useTranslation } from 'react-i18next';

function BlogPostCard({
  post,
}: {
  post: (typeof blogPosts)[number];
}) {
  const { t, i18n } = useTranslation();
  return (
    <article className="blog-post-card" lang="en">
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
        <time className="blog-post-date" dateTime={post.publishedAt} lang={i18n.resolvedLanguage ?? 'en'}>
          {getBlogPostDisplayDate(post.publishedAt)}
        </time>
      </header>
      <p className="blog-post-summary">{post.summary}</p>
      <BlogTagLinks
        ariaLabel={t('tagsForPost', { title: post.title })}
        tags={post.tags}
        activeTag={undefined}
      />
    </article>
  );
}

function BlogIndexPage() {
  const { t } = useTranslation();
  const { tag } = Route.useSearch();
  const tags = [...new Set(blogPosts.flatMap((post) => post.tags))].sort();
  const filteredPosts =
    tag === undefined ? blogPosts : blogPosts.filter((post) => post.tags.includes(tag));

  return (
    <main className="blog-page" data-page-entrance aria-labelledby="blog-title">
      <header className="blog-page-header">
        <h1 id="blog-title">{t('blog')}</h1>
        <p>{t('blogDescription')}</p>
      </header>

      <section className="blog-filter" aria-labelledby="blog-filter-title">
        <h2 id="blog-filter-title">{t('filterByTag')}</h2>
        <BlogTagLinks
          ariaLabel={t('filterPostsByTag')}
          tags={tags}
          activeTag={tag}
          showAll
        />
      </section>

      {filteredPosts.length === 0 ? (
        <div className="blog-empty-state" role="status">
          <p>
            {tag === undefined
              ? t('noPublishedPosts')
              : t('noPostsForTag', { tag })}
          </p>
          <Link
            to="/blog"
            search={{ tag: undefined }}
            className="blog-clear-filter-link"
          >
            {tag === undefined ? t('viewAllPosts') : t('clearTagFilter')}
          </Link>
        </div>
      ) : (
        <section className="blog-results" aria-label={t('blogPosts')}>
          <p className="blog-results-summary" role="status">
            {tag === undefined
              ? t('showingAllPosts', { count: filteredPosts.length })
              : t('showingTaggedPosts', { count: filteredPosts.length, tag })}
          </p>
          <ul className="blog-post-list" aria-label={t('publishedBlogPosts')}>
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
