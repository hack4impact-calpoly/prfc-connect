const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
};

const HTML_ESCAPE_RE = /[&<>"']/g;

export function escapeHtml(str: string): string {
  return str.replace(HTML_ESCAPE_RE, (char) => HTML_ESCAPE_MAP[char]);
}

export function plaintextToHtml(text: string): string {
  return escapeHtml(text)
    .split(/\n\n+/)
    .map((para) => `<p style="margin: 0 0 16px;">${para.replace(/\n/g, "<br>")}</p>`)
    .join("");
}
