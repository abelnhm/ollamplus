export function getOllamaUrl(): string {
  const host = localStorage.getItem("ollamaHost") || "localhost";
  const port = localStorage.getItem("ollamaPort") || "11434";
  return `http://${host}:${port}`;
}

export function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

export function formatMarkdown(text: string): string {
  const marked = (window as any).marked;
  const Prism = (window as any).Prism;

  if (!marked) {
    return escapeHtml(text).replace(/\n/g, "<br>");
  }

  marked.setOptions({
    breaks: true,
    gfm: true,
  });

  let html = marked.parse(text) as string;

  if (Prism) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    
    tempDiv.querySelectorAll("pre code").forEach((block) => {
      Prism.highlightElement(block as HTMLElement);
    });
    
    html = tempDiv.innerHTML;
  }

  return html;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function formatTokenCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}
export function formatDateTime(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "0 ms";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function estimateTokensFromText(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return Math.max(1, Math.round(trimmed.length / 4));
}
