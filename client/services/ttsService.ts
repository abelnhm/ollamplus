import { state } from "../state.js";
import { getSelectedVoice } from "./ttsVoices.js";
import { startVoiceRecording } from "./sttService.js";

let currentUtterance: SpeechSynthesisUtterance | null = null;
let currentButton: HTMLButtonElement | null = null;

export function speakText(text: string, btn?: HTMLButtonElement): void {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    
    if (currentButton && currentButton !== btn) {
      resetButtonIcon(currentButton);
      currentButton = null;
    }
    
    let textToSpeak = stripCodeForSpeech(text);
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    const selectedVoice = getSelectedVoice();
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    } else {
      utterance.lang = detectLanguage(text);
    }
    
    utterance.rate = state.ttsSpeed || 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    currentUtterance = utterance;
    currentButton = btn || null;
    
    if (btn) {
      btn.innerHTML = getStopIcon();
      btn.classList.add("playing");
    }
    
    utterance.onend = () => {
      currentUtterance = null;
      if (currentButton) {
        resetButtonIcon(currentButton);
        currentButton = null;
      }
      if (state.autoVoiceAfterTts) {
        setTimeout(() => startVoiceRecording(), 500);
      }
    };
    
    utterance.onerror = () => {
      currentUtterance = null;
      if (currentButton) {
        resetButtonIcon(currentButton);
        currentButton = null;
      }
    };
    
    window.speechSynthesis.speak(utterance);
  }
}

export function stopSpeaking(): void {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    if (currentButton) {
      resetButtonIcon(currentButton);
      currentButton.classList.remove("playing");
    }
    currentUtterance = null;
    currentButton = null;
  }
}

function detectLanguage(text: string): string {
  const spanishPatterns = /[áéíóúüñ¿¡]/i;
  if (spanishPatterns.test(text)) {
    return "es-ES";
  }
  return "en-US";
}

function stripCodeForSpeech(htmlText: string): string {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlText;
  
  tempDiv.querySelectorAll("code, pre").forEach((el) => {
    el.remove();
  });
  
  let text = tempDiv.textContent || "";
  
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
  text = text.replace(/\*([^*]+)\*/g, "$1");
  text = text.replace(/`([^`]+)`/g, "$1");
  text = text.replace(/^#{1,6}\s+/gm, "");
  text = text.replace(/^\s*[-*+]\s+/gm, "");
  text = text.replace(/^\s*\d+\.\s+/gm, "");
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1");
  text = text.replace(/^\s*[-=_]{3,}\s*$/gm, "");
  
  return text.trim();
}

export function isSpeaking(): boolean {
  return "speechSynthesis" in window && window.speechSynthesis.speaking;
}

function getPlayIcon(): string {
  return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
}

function getStopIcon(): string {
  return `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
}

function resetButtonIcon(btn: HTMLButtonElement): void {
  btn.innerHTML = getPlayIcon();
  btn.classList.remove("playing");
}