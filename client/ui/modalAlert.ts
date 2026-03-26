export type Language = "es" | "en";

interface Translations {
  alertTitle: string;
  noActiveChat: string;
  printError: string;
  chatDataError: string;
  accept: string;
}

const translations: Record<Language, Translations> = {
  es: {
    alertTitle: "Aviso",
    noActiveChat: "No hay conversación activa para exportar.",
    printError: "No se pudo abrir la ventana de impresión. Permite las ventanas emergentes.",
    chatDataError: "No se pudo obtener los datos del chat.",
    accept: "Aceptar",
  },
  en: {
    alertTitle: "Notice",
    noActiveChat: "No active conversation to export.",
    printError: "Could not open print window. Allow popups.",
    chatDataError: "Could not get chat data.",
    accept: "Accept",
  },
};

let currentLanguage: Language = "es";

export function initLanguageAlert(): void {
  const saved = localStorage.getItem("language") as Language | null;
  if (saved && (saved === "es" || saved === "en")) {
    currentLanguage = saved;
  } else {
    const browserLang = navigator.language.split("-")[0];
    currentLanguage = browserLang === "en" ? "en" : "es";
  }
}

export function t(key: keyof Translations): string {
  return translations[currentLanguage][key];
}

import { alertModal, alertModalText, alertModalOk, closeAlertModalBtn } from "./elements.js";

function closeAlertModal(): void {
  alertModal.classList.remove("active");
}

export function openAlertModal(message: string, title?: string): void {
  alertModalText.textContent = message;
  if (title) {
    const h2 = alertModal.querySelector("h2");
    if (h2) h2.textContent = title;
  } else {
    const h2 = alertModal.querySelector("h2");
    if (h2) h2.textContent = t("alertTitle");
  }
  alertModalOk.textContent = t("accept");
  alertModal.classList.add("active");
}

export function openNoActiveChatModal(): void {
  openAlertModal(t("noActiveChat"));
}

export function openPrintErrorModal(): void {
  openAlertModal(t("printError"));
}

export function openChatDataErrorModal(): void {
  openAlertModal(t("chatDataError"));
}

alertModalOk.addEventListener("click", closeAlertModal);
closeAlertModalBtn.addEventListener("click", closeAlertModal);
