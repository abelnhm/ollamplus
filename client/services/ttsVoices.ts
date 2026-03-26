import { ttsVoiceSelect } from "../ui/elements.js";
import { state } from "../state.js";

export async function loadVoices(): Promise<void> {
  const voices = window.speechSynthesis.getVoices();
  
  ttsVoiceSelect.innerHTML = "";
  
  if (voices.length === 0) {
    ttsVoiceSelect.innerHTML = '<option value="">No hay voces disponibles</option>';
    return;
  }
  
  const groupedVoices: Record<string, SpeechSynthesisVoice[]> = {};
  
  for (const voice of voices) {
    const lang = voice.lang.slice(0, 2);
    if (!groupedVoices[lang]) {
      groupedVoices[lang] = [];
    }
    groupedVoices[lang].push(voice);
  }
  
  const langNames: Record<string, string> = {
    es: "Español",
    en: "English",
    fr: "Français",
    de: "Deutsch",
    it: "Italiano",
    pt: "Português",
    ja: "日本語",
    zh: "中文",
    ko: "한국어",
    ru: "Русский",
    ar: "العربية",
    nl: "Nederlands",
    pl: "Polski",
    sv: "Svenska",
    da: "Dansk",
    fi: "Suomi",
    no: "Norsk",
    tr: "Türkçe",
    th: "ไทย",
    hi: "हिन्दी",
    vi: "Tiếng Việt",
    id: "Bahasa Indonesia",
    ms: "Bahasa Melayu",
    cs: "Čeština",
    el: "Ελληνικά",
    he: "עברית",
    hu: "Magyar",
    ro: "Română",
    uk: "Українська",
  };
  
  const savedVoice = localStorage.getItem("ttsVoice") || "";
  
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Automático (detectar idioma)";
  defaultOption.selected = savedVoice === "";
  ttsVoiceSelect.appendChild(defaultOption);
  
  const languages = Object.keys(groupedVoices).sort((a, b) => {
    const priority = ["es", "en"];
    const aIdx = priority.indexOf(a);
    const bIdx = priority.indexOf(b);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return a.localeCompare(b);
  });
  
  for (const lang of languages) {
    const voices = groupedVoices[lang];
    const groupLabel = langNames[lang] || lang;
    
    const femaleVoices = voices.filter(v => 
      v.name.toLowerCase().includes("female") || 
      v.name.toLowerCase().includes("woman") ||
      v.name.toLowerCase().includes("chica") ||
      v.name.toLowerCase().includes("donna") ||
      v.name.toLowerCase().includes("femme") ||
      v.name.toLowerCase().includes("mulher") ||
      v.name.toLowerCase().includes("weiblich") ||
      v.name.includes("Female") ||
      v.name.includes("Woman")
    );
    
    const maleVoices = voices.filter(v => 
      v.name.toLowerCase().includes("male") || 
      v.name.toLowerCase().includes("man") ||
      v.name.toLowerCase().includes("hombre") ||
      v.name.toLowerCase().includes("uomo") ||
      v.name.toLowerCase().includes("homme") ||
      v.name.toLowerCase().includes("homem") ||
      v.name.toLowerCase().includes("männlich") ||
      v.name.includes("Male") ||
      v.name.includes("Man")
    );
    
    const neutralVoices = voices.filter(v => 
      !femaleVoices.includes(v) && !maleVoices.includes(v)
    );
    
    const group = document.createElement("optgroup");
    group.label = groupLabel;
    
    if (femaleVoices.length > 0) {
      const femaleLabel = document.createElement("option");
      femaleLabel.value = "";
      femaleLabel.textContent = `── ${groupLabel} Fem ──`;
      femaleLabel.disabled = true;
      group.appendChild(femaleLabel);
      
      for (const voice of femaleVoices) {
        const option = document.createElement("option");
        option.value = voice.name;
        option.textContent = voice.name;
        option.selected = savedVoice === voice.name;
        group.appendChild(option);
      }
    }
    
    if (neutralVoices.length > 0) {
      const neutralLabel = document.createElement("option");
      neutralLabel.value = "";
      neutralLabel.textContent = `── ${groupLabel} Neu ──`;
      neutralLabel.disabled = true;
      group.appendChild(neutralLabel);
      
      for (const voice of neutralVoices) {
        const option = document.createElement("option");
        option.value = voice.name;
        option.textContent = voice.name;
        option.selected = savedVoice === voice.name;
        group.appendChild(option);
      }
    }
    
    if (maleVoices.length > 0) {
      const maleLabel = document.createElement("option");
      maleLabel.value = "";
      maleLabel.textContent = `── ${groupLabel} Masc ──`;
      maleLabel.disabled = true;
      group.appendChild(maleLabel);
      
      for (const voice of maleVoices) {
        const option = document.createElement("option");
        option.value = voice.name;
        option.textContent = voice.name;
        option.selected = savedVoice === voice.name;
        group.appendChild(option);
      }
    }
    
    ttsVoiceSelect.appendChild(group);
  }
}

export function getSelectedVoice(): SpeechSynthesisVoice | null {
  const selectedName = state.ttsVoice;
  if (!selectedName) return null;
  
  const voices = window.speechSynthesis.getVoices();
  return voices.find(v => v.name === selectedName) || null;
}

if (typeof window !== "undefined") {
  if (window.speechSynthesis.getVoices().length > 0) {
    loadVoices();
  } else {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}