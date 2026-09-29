import { parse as parseYaml } from 'yaml';

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  content: string;
}

const kebabCasePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const frontmatterPattern =
  /^(?:\uFEFF)?---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)([\s\S]*)$/;

function invalidPost(filePath: string, reason: string): never {
  throw new Error(`Invalid blog post "${filePath}": ${reason}`);
}

function getSlug(filePath: string): string {
  const filename = filePath.split(/[\\/]/).pop() ?? '';

  if (!filename.endsWith('.md')) {
    invalidPost(filePath, 'filename must use the .md extension.');
  }

  const slug = filename.slice(0, -3);

  if (!kebabCasePattern.test(slug)) {
    invalidPost(
      filePath,
      `filename-derived slug "${slug}" must be kebab-case (lowercase letters and numbers separated by single hyphens).`
    );
  }

  return slug;
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !isoDatePattern.test(value)) {
    return false;
  }

  const parsedDate = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === value;
}

function requiredText(
  metadata: Record<string, unknown>,
  field: 'title' | 'summary',
  filePath: string
): string {
  const value = metadata[field];

  if (typeof value !== 'string' || value.trim().length === 0) {
    invalidPost(filePath, `frontmatter field "${field}" is required and must be a non-empty string.`);
  }

  return value.trim();
}

export function parseBlogPost(filePath: string, markdown: string): BlogPost {
  const slug = getSlug(filePath);
  const frontmatter = frontmatterPattern.exec(markdown);

  if (!frontmatter) {
    invalidPost(filePath, 'expected YAML frontmatter between opening and closing --- lines.');
  }

  const yamlFrontmatter = frontmatter[1];
  const content = frontmatter[2];

  if (yamlFrontmatter === undefined || content === undefined) {
    invalidPost(filePath, 'expected YAML frontmatter between opening and closing --- lines.');
  }

  let parsedMetadata: unknown;

  try {
    parsedMetadata = parseYaml(yamlFrontmatter);
  } catch (error) {
    const detail =
      error instanceof Error ? error.message.split(/\r?\n/, 1)[0] : 'unknown YAML syntax error';
    invalidPost(filePath, `could not parse YAML frontmatter: ${detail ?? 'unknown syntax error'}`);
  }

  if (
    parsedMetadata === null ||
    typeof parsedMetadata !== 'object' ||
    Array.isArray(parsedMetadata)
  ) {
    invalidPost(filePath, 'frontmatter must be a YAML mapping of metadata fields.');
  }

  const metadata = parsedMetadata as Record<string, unknown>;
  const title = requiredText(metadata, 'title', filePath);
  const summary = requiredText(metadata, 'summary', filePath);
  const date = metadata.date;

  if (!isIsoDate(date)) {
    invalidPost(
      filePath,
      'frontmatter field "date" must be a valid calendar date in ISO YYYY-MM-DD format.'
    );
  }

  const rawTags = metadata.tags;

  if (!Array.isArray(rawTags) || rawTags.length === 0) {
    invalidPost(
      filePath,
      'frontmatter field "tags" must be an array with at least one normalized kebab-case tag.'
    );
  }

  const tags = rawTags.map((tag: unknown, index: number) => {
    if (typeof tag !== 'string' || !kebabCasePattern.test(tag)) {
      invalidPost(
        filePath,
        `frontmatter field "tags[${index}]" must be a normalized kebab-case string (lowercase letters and numbers separated by single hyphens).`
      );
    }

    return tag;
  });

  return {
    slug,
    title,
    date,
    summary,
    tags,
    content,
  };
}

function comparePosts(left: BlogPost, right: BlogPost): number {
  if (left.date !== right.date) {
    return left.date > right.date ? -1 : 1;
  }

  if (left.slug === right.slug) {
    return 0;
  }

  return left.slug < right.slug ? -1 : 1;
}

export function loadBlogPosts(files: Readonly<Record<string, string>>): BlogPost[] {
  const posts: BlogPost[] = [];
  const filesBySlug = new Map<string, string>();

  for (const [filePath, markdown] of Object.entries(files)) {
    const post = parseBlogPost(filePath, markdown);
    const existingFile = filesBySlug.get(post.slug);

    if (existingFile) {
      invalidPost(
        filePath,
        `filename-derived slug "${post.slug}" duplicates "${existingFile}". Use a unique filename.`
      );
    }

    filesBySlug.set(post.slug, filePath);
    posts.push(post);
  }

  return posts.sort(comparePosts);
}

const markdownFiles = import.meta.glob<string>('../content/blog/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
});

export const blogPosts = loadBlogPosts(markdownFiles);
