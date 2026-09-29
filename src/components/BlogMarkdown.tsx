import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';

interface BlogMarkdownProps {
  content: string;
}

export function BlogMarkdown({ content }: BlogMarkdownProps) {
  return (
    <div className="blog-markdown">
      <ReactMarkdown urlTransform={defaultUrlTransform}>{content}</ReactMarkdown>
    </div>
  );
}
