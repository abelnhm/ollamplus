/**
 * Utility: MarkdownRenderer
 * Utilidad para renderizar markdown
 * Principio: Single Responsibility - Solo renderiza markdown
 */
export class MarkdownRenderer {
  constructor() {
    this.#configureMarked();
  }

  #configureMarked() {
    marked.setOptions({
      highlight: (code, lang) => {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(code, { language: lang }).value;
          } catch (err) {}
        }
        return hljs.highlightAuto(code).value;
      },
      breaks: true,
      gfm: true,
    });
  }

  render(markdown) {
    return marked.parse(markdown);
  }
}
