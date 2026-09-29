import { Link, useLoaderData } from '@tanstack/react-router';
import { BlogTagLinks } from '@/components/BlogTagLinks';
import { BlogMarkdown } from '@/components/BlogMarkdown';

export default function BlogArticlePage() {
  const { post } = useLoaderData({ from: '/blog/$slug' });

  return (
    <main className="blog-article-page" aria-labelledby="blog-article-title">
      <article className="blog-article">
        <header className="blog-article-header">
          <Link
            to="/blog"
            search={{ tag: undefined }}
            className="blog-back-link"
          >
            Back to Blog
          </Link>
          <h1 id="blog-article-title">{post.title}</h1>
          <time className="blog-post-date" dateTime={post.publishedAt}>
            {post.date}
          </time>
          <p className="blog-post-summary">{post.summary}</p>
          <BlogTagLinks
            ariaLabel={`Tags for ${post.title}`}
            tags={post.tags}
            activeTag={undefined}
          />
        </header>
        <BlogMarkdown content={post.content} />
      </article>
    </main>
  );
}
