import DOMPurify from 'isomorphic-dompurify';

/**
 * Rich-text bodies are stored as HTML. Tiptap already constrains what the editor
 * can produce, but imported .json files can contain anything, and the app is open
 * to anyone with the URL — so everything passes through here before it reaches
 * `dangerouslySetInnerHTML`.
 */
const CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'span', 'a', 'ul', 'ol', 'li', 'sup', 'sub', 'h1', 'h2', 'h3'],
  ALLOWED_ATTR: ['style', 'href', 'target', 'rel', 'class'],
  ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:|#|\/)/i,
} as const;

export function clean(html: string | undefined | null): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, CONFIG as Record<string, unknown>) as unknown as string;
}
