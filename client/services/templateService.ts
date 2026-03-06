import { state } from "../state.js";
import type { PromptTemplate } from "../types.js";
import { escapeHtml } from "../utils.js";
import { autoResize } from "../ui/elements.js";
import {
  messageInput,
  promptTemplatesBtn,
  promptTemplatesDropdown,
  promptTemplatesList,
  templateSearchInput,
  templateModal,
  templateNameInput,
  templateTextInput,
  templateManageList,
} from "../ui/elements.js";

// ─── Templates predefinidos ──────────────────────────────
const DEFAULT_TEMPLATES: PromptTemplate[] = [
  {
    id: "builtin-1",
    name: "Explicar código",
    text: "Explica este código paso a paso: ",
    builtin: true,
  },
  {
    id: "builtin-2",
    name: "Traducir al inglés",
    text: "Traduce al inglés: ",
    builtin: true,
  },
  {
    id: "builtin-3",
    name: "Resumir texto",
    text: "Resume el siguiente texto: ",
    builtin: true,
  },
  {
    id: "builtin-4",
    name: "Encontrar errores",
    text: "Encuentra errores en: ",
    builtin: true,
  },
  {
    id: "builtin-5",
    name: "Tests unitarios",
    text: "Genera tests unitarios para: ",
    builtin: true,
  },
  {
    id: "builtin-6",
    name: "Refactorizar",
    text: "Refactoriza el siguiente código para mejorar su legibilidad: ",
    builtin: true,
  },
  {
    id: "builtin-7",
    name: "Documentar función",
    text: "Genera documentación para la siguiente función: ",
    builtin: true,
  },
  {
    id: "builtin-8",
    name: "Explicar error",
    text: "Explica este error y cómo solucionarlo: ",
    builtin: true,
  },
];

export function loadTemplates(): PromptTemplate[] {
  const saved = localStorage.getItem("promptTemplates");
  const custom: PromptTemplate[] = saved ? JSON.parse(saved) : [];
  return [...DEFAULT_TEMPLATES, ...custom];
}

function saveCustomTemplates(templates: PromptTemplate[]): void {
  const custom = templates.filter((t) => !t.builtin);
  localStorage.setItem("promptTemplates", JSON.stringify(custom));
}

function selectTemplate(template: PromptTemplate): void {
  messageInput.value = template.text;
  closeTemplatesDropdown();
  closeSlashDropdown();
  messageInput.focus();
  autoResize(messageInput);
}

// ─── Dropdown de templates ───────────────────────────────
export function openTemplatesDropdown(): void {
  templateSearchInput.value = "";
  renderTemplatesList("");
  promptTemplatesDropdown.classList.add("active");
  promptTemplatesBtn.classList.add("active");
  state.slashHighlightIndex = -1;
  setTimeout(() => templateSearchInput.focus(), 50);
}

export function closeTemplatesDropdown(): void {
  promptTemplatesDropdown.classList.remove("active");
  promptTemplatesBtn.classList.remove("active");
  state.slashHighlightIndex = -1;
}

export function toggleTemplatesDropdown(): void {
  if (promptTemplatesDropdown.classList.contains("active")) {
    closeTemplatesDropdown();
  } else {
    openTemplatesDropdown();
  }
}

export function renderTemplatesList(filter: string): void {
  const templates = loadTemplates();
  const lowerFilter = filter.toLowerCase();
  const filtered = lowerFilter
    ? templates.filter(
        (t) =>
          t.name.toLowerCase().includes(lowerFilter) ||
          t.text.toLowerCase().includes(lowerFilter),
      )
    : templates;

  if (filtered.length === 0) {
    promptTemplatesList.innerHTML =
      '<div class="no-templates">No se encontraron templates</div>';
    return;
  }

  promptTemplatesList.innerHTML = filtered
    .map(
      (t) => `
    <div class="prompt-template-item" data-template-id="${escapeHtml(t.id)}">
      <span class="template-icon">⚡</span>
      <div class="template-info">
        <span class="template-name">${escapeHtml(t.name)}</span>
        <span class="template-preview">${escapeHtml(t.text)}</span>
      </div>
      ${t.builtin ? '<span class="template-badge">predefinido</span>' : '<span class="template-badge">personalizado</span>'}
    </div>`,
    )
    .join("");

  promptTemplatesList
    .querySelectorAll(".prompt-template-item")
    .forEach((el) => {
      el.addEventListener("click", () => {
        const id = (el as HTMLElement).dataset.templateId;
        const tmpl = templates.find((t) => t.id === id);
        if (tmpl) selectTemplate(tmpl);
      });
    });
}

// ─── Slash commands (/) ──────────────────────────────────
let slashDropdown: HTMLDivElement | null = null;

function getOrCreateSlashDropdown(): HTMLDivElement {
  if (!slashDropdown) {
    slashDropdown = document.createElement("div");
    slashDropdown.className = "slash-command-dropdown";
    slashDropdown.id = "slashCommandDropdown";
    messageInput.parentElement!.appendChild(slashDropdown);
  }
  return slashDropdown;
}

export function openSlashDropdown(filter: string): void {
  const dd = getOrCreateSlashDropdown();
  const templates = loadTemplates();
  const lowerFilter = filter.toLowerCase();
  const filtered = lowerFilter
    ? templates.filter(
        (t) =>
          t.name.toLowerCase().includes(lowerFilter) ||
          t.text.toLowerCase().includes(lowerFilter),
      )
    : templates;

  if (filtered.length === 0) {
    dd.innerHTML = '<div class="no-templates">Sin resultados</div>';
    dd.classList.add("active");
    state.slashHighlightIndex = -1;
    return;
  }

  state.slashHighlightIndex = 0;

  dd.innerHTML = filtered
    .map(
      (t, i) => `
    <div class="prompt-template-item${i === 0 ? " highlighted" : ""}" data-template-id="${escapeHtml(t.id)}">
      <span class="template-icon">⚡</span>
      <div class="template-info">
        <span class="template-name">${escapeHtml(t.name)}</span>
        <span class="template-preview">${escapeHtml(t.text)}</span>
      </div>
    </div>`,
    )
    .join("");

  dd.classList.add("active");

  dd.querySelectorAll(".prompt-template-item").forEach((el) => {
    el.addEventListener("click", () => {
      const id = (el as HTMLElement).dataset.templateId;
      const tmpl = templates.find((t) => t.id === id);
      if (tmpl) {
        messageInput.value = tmpl.text;
        closeSlashDropdown();
        messageInput.focus();
        autoResize(messageInput);
      }
    });
  });
}

export function closeSlashDropdown(): void {
  if (slashDropdown) {
    slashDropdown.classList.remove("active");
  }
  state.slashHighlightIndex = -1;
}

export function isSlashDropdownActive(): boolean {
  return !!slashDropdown && slashDropdown.classList.contains("active");
}

export function navigateSlashDropdown(direction: number): void {
  if (!slashDropdown) return;
  const items = slashDropdown.querySelectorAll(
    ".prompt-template-item[data-template-id]",
  );
  if (items.length === 0) return;
  items.forEach((el) => el.classList.remove("highlighted"));
  state.slashHighlightIndex =
    (state.slashHighlightIndex + direction + items.length) % items.length;
  items[state.slashHighlightIndex].classList.add("highlighted");
  (items[state.slashHighlightIndex] as HTMLElement).scrollIntoView({
    block: "nearest",
  });
}

export function confirmSlashSelection(): void {
  if (!slashDropdown) return;
  const items = slashDropdown.querySelectorAll(
    ".prompt-template-item[data-template-id]",
  );
  if (
    state.slashHighlightIndex >= 0 &&
    state.slashHighlightIndex < items.length
  ) {
    (items[state.slashHighlightIndex] as HTMLElement).click();
  }
}

export function handleSlashInput(): void {
  const val = messageInput.value;
  if (val.startsWith("/")) {
    const query = val.slice(1);
    openSlashDropdown(query);
  } else {
    closeSlashDropdown();
  }
}

// ─── Modal de gestión de templates ───────────────────────
export function openTemplateModal(): void {
  closeTemplatesDropdown();
  templateNameInput.value = "";
  templateTextInput.value = "";
  renderTemplateManageList();
  templateModal.classList.add("active");
}

export function closeTemplateModal(): void {
  templateModal.classList.remove("active");
}

function renderTemplateManageList(): void {
  const templates = loadTemplates();
  if (templates.length === 0) {
    templateManageList.innerHTML =
      '<div class="no-templates">No hay templates</div>';
    return;
  }
  templateManageList.innerHTML = templates
    .map(
      (t) => `
    <div class="template-manage-item">
      <div class="tmi-info">
        <span class="tmi-name">${escapeHtml(t.name)}</span>
        <span class="tmi-text">${escapeHtml(t.text)}</span>
      </div>
      ${t.builtin ? '<span class="tmi-badge">predefinido</span>' : `<button class="tmi-delete" data-delete-id="${escapeHtml(t.id)}" title="Eliminar">✕</button>`}
    </div>`,
    )
    .join("");

  templateManageList.querySelectorAll(".tmi-delete").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = (btn as HTMLElement).dataset.deleteId;
      if (!id) return;
      const all = loadTemplates().filter((t) => t.id !== id);
      saveCustomTemplates(all);
      renderTemplateManageList();
    });
  });
}

export function addCustomTemplate(): void {
  const name = templateNameInput.value.trim();
  const text = templateTextInput.value.trim();
  if (!name || !text) return;

  const templates = loadTemplates();
  const newTemplate: PromptTemplate = {
    id: "custom-" + Date.now(),
    name,
    text,
  };
  templates.push(newTemplate);
  saveCustomTemplates(templates);
  templateNameInput.value = "";
  templateTextInput.value = "";
  renderTemplateManageList();
}
