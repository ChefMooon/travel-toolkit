import { Link, useLoaderData } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { BlogTagLinks } from '@/components/BlogTagLinks';
import { BlogMarkdown } from '@/components/BlogMarkdown';
import { getBlogPostDisplayDate } from '@/lib/blogPosts';
import { useTranslation } from 'react-i18next';

export default function BlogArticlePage() {
  const { t, i18n } = useTranslation();
  const { post } = useLoaderData({ from: '/blog/$slug' });

  return (
    <main key={post.slug} className="blog-article-page" data-page-entrance aria-labelledby="blog-article-title">
      <Link to="/blog" search={{ tag: undefined }} className="blog-back-link">
        <ArrowLeft aria-hidden="true" size={16} /> {t('backToBlog')}
      </Link>
      {i18n.resolvedLanguage === 'fr-CA' ? <p lang="fr-CA" className="blog-source-notice">{t('articleSourceNotice')}</p> : null}
      <article className="blog-article" lang="en">
        <header className="blog-article-header">
          <h1 id="blog-article-title">{post.title}</h1>
          <time className="blog-post-date" dateTime={post.publishedAt} lang={i18n.resolvedLanguage ?? 'en'}>
            {getBlogPostDisplayDate(post.publishedAt)}
          </time>
          <p className="blog-post-summary">{post.summary}</p>
          <BlogTagLinks
            ariaLabel={t('tagsForPost', { title: post.title })}
            tags={post.tags}
            activeTag={undefined}
          />
        </header>
        <BlogMarkdown content={post.content} />
      </article>
    </main>
  );
}
