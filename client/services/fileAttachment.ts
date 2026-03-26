import { state } from "../state.js";
import {
  fileInput,
  attachFileBtn,
  attachedFilePreview,
  attachedFileName,
  removeAttachedFile,
} from "../ui/elements.js";

let attachedFile: { name: string; content: string; type: string } | null = null;

export function initFileAttachment(): void {
  attachFileBtn.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", async (e) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      await handleFileAttach(file);
    }
  });

  removeAttachedFile.addEventListener("click", () => {
    clearAttachedFile();
  });
}

async function handleFileAttach(file: File): Promise<void> {
  const allowedTypes = [
    "text/plain",
    "text/markdown",
    "text/csv",
    "application/json",
    "text/javascript",
    "text/typescript",
    "text/html",
    "text/css",
    "text/xml",
    "text/yaml",
    "application/x-yaml",
  ];

  const allowedExtensions = [
    ".txt", ".md", ".json", ".js", ".ts", ".py", ".html", ".css",
    ".xml", ".yaml", ".yml", ".csv", ".log", ".sh", ".bat", ".sql"
  ];

  const fileName = file.name.toLowerCase();
  const isAllowedType = allowedTypes.some(type => file.type.includes(type));
  const isAllowedExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

  if (!isAllowedType && !isAllowedExtension) {
    alert("Tipo de archivo no permitido. Solo archivos de texto.");
    return;
  }

  try {
    const content = await readFileContent(file);
    attachedFile = {
      name: file.name,
      content: content,
      type: file.type
    };

    updateFilePreview();
  } catch (error) {
    console.error("Error reading file:", error);
    alert("Error al leer el archivo.");
  }
}

function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function updateFilePreview(): void {
  if (attachedFile) {
    attachedFileName.textContent = attachedFile.name;
    attachedFilePreview.style.display = "flex";
    attachFileBtn.classList.add("has-file");
  } else {
    attachedFilePreview.style.display = "none";
    attachFileBtn.classList.remove("has-file");
  }
}

export function clearAttachedFile(): void {
  attachedFile = null;
  fileInput.value = "";
  updateFilePreview();
}

export function getAttachedFile(): { name: string; content: string; type: string } | null {
  return attachedFile;
}

export function getAttachedFileInfo(): { name: string; extension: string; isCode: boolean } | null {
  if (!attachedFile) return null;
  
  const extension = attachedFile.name.split(".").pop()?.toLowerCase() || "";
  const codeExtensions = ["js", "ts", "py", "html", "css", "json", "xml", "yaml", "yml", "sql", "sh", "bat", "md", "java", "c", "cpp", "h", "go", "rs", "rb", "php", "swift", "kt", "scala", "cs"];
  
  return {
    name: attachedFile.name,
    extension: extension,
    isCode: codeExtensions.includes(extension)
  };
}

export function formatFileContentForPrompt(): string {
  if (!attachedFile) return "";

  const extension = attachedFile.name.split(".").pop()?.toLowerCase() || "";
  const fileTypeLabels: Record<string, string> = {
    js: "JavaScript",
    ts: "TypeScript",
    py: "Python",
    html: "HTML",
    css: "CSS",
    json: "JSON",
    xml: "XML",
    yaml: "YAML",
    yml: "YAML",
    sql: "SQL",
    sh: "Shell Script",
    bat: "Batch Script",
    md: "Markdown",
    txt: "Texto",
    csv: "CSV",
    log: "Log",
    java: "Java",
    c: "C",
    cpp: "C++",
    h: "C Header",
    go: "Go",
    rs: "Rust",
    ruby: "Ruby",
    php: "PHP",
    swift: "Swift",
    kotlin: "Kotlin",
    scala: "Scala",
    cs: "C#",
  };

  const fileType = fileTypeLabels[extension] || "Texto";
  const maxContentLength = 50000;

  let contentToShow = attachedFile.content;
  if (contentToShow.length > maxContentLength) {
    contentToShow = contentToShow.substring(0, maxContentLength) + 
      "\n\n... [ contenido truncado por límite de tamaño ]";
  }

  return `
===== ARCHIVO ADJUNTO =====
Nombre: ${attachedFile.name}
Tipo: ${fileType}
=======================

${contentToShow}

======================
FIN DEL ARCHIVO
`;
}

export function formatFileIndicator(): string {
  if (!attachedFile) return "";
  
  return `<span class="file-attachment-indicator">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
    </svg>
    <span class="attached-file-name">${escapeHtml(attachedFile.name)}</span>
  </span>`;
}

export function formatFileContentForDisplay(): string {
  if (!attachedFile) return "";
  
  const info = getAttachedFileInfo();
  const isCode = info?.isCode || false;
  
  const escapedContent = escapeHtml(attachedFile.content);
  
  if (isCode) {
    return `<div class="attached-file-container">
      <div class="attached-file-header">
        <svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <span class="file-name">${escapeHtml(attachedFile.name)}</span>
        <button class="toggle-code-btn" type="button">
          <span>Ver código</span>
        </button>
      </div>
      <pre class="attached-file-content code-collapsed"><code>${escapedContent}</code></pre>
    </div>`;
  } else {
    return `<div class="attached-file-container">
      <div class="attached-file-header">
        <svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <span class="file-name">${escapeHtml(attachedFile.name)}</span>
      </div>
      <div class="attached-file-content-text">${escapeHtml(attachedFile.content)}</div>
    </div>`;
  }
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}