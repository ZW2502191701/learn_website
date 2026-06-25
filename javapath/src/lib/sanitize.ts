/**
 * 轻量 HTML sanitizer — 仅允许安全的富文本标签，移除脚本和事件属性。
 * 用于渲染从 PDF 解析出的 HTML 内容。
 */
const BLOCKED_TAGS = /<\/?(?:script|iframe|object|embed|form|input|textarea|button|link|meta|base|style)\b[^>]*>/gi;
const EVENT_ATTRS = /\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const JS_PROTOCOL = /\b(?:href|src|action)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi;
const DATA_ATTR_EVENTS = /\s+xlink:href\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi;

export function sanitizeHtml(html: string): string {
  return html
    .replace(BLOCKED_TAGS, '')
    .replace(EVENT_ATTRS, '')
    .replace(JS_PROTOCOL, '')
    .replace(DATA_ATTR_EVENTS, '');
}
