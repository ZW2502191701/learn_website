import { sanitizeHtml } from '../lib/sanitize';

export function SafeHtml({ html }: { html: string }) {
  return <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />;
}
