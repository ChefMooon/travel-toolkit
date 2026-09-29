import { createFileRoute, lazyRouteComponent, notFound } from '@tanstack/react-router';
import { blogPosts } from '@/lib/blogPosts';

const BlogArticlePage = lazyRouteComponent(() => import('@/features/blog'));

export const Route = createFileRoute('/blog/$slug')({
  loader: ({ params }) => {
    const post = blogPosts.find((candidate) => candidate.slug === params.slug);

    if (!post) {
      throw notFound({ routeId: '__root__' });
    }

    return { post };
  },
  component: BlogArticlePage,
});
