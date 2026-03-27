import { messageInput, recordAudioBtn, recordingIndicator, recordingTime } from "../ui/elements.js";
import { autoResize } from "../ui/elements.js";

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface WindowWithSpeechRecognition {
  SpeechRecognition: new () => ISpeechRecognition;
  webkitSpeechRecognition: new () => ISpeechRecognition;
}

let recognition: ISpeechRecognition | null = null;
let isRecording = false;
let recordingStartTime = 0;
let recordingTimer: ReturnType<typeof setInterval> | null = null;

export function initSpeechToText(): void {
  const win = window as unknown as WindowWithSpeechRecognition;
  const SpeechRecognitionAPI = win.SpeechRecognition || win.webkitSpeechRecognition;

  if (!SpeechRecognitionAPI) {
    console.warn("Speech Recognition API not supported in this browser");
    recordAudioBtn.style.display = "none";
    return;
  }

  recognition = new SpeechRecognitionAPI();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "es-ES";

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let finalTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + " ";
      }
    }

    if (finalTranscript) {
      messageInput.value += finalTranscript;
    }

    autoResize(messageInput);
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    console.error("Speech recognition error:", event.error);
    stopRecording();
  };

  recognition.onend = () => {
    if (isRecording) {
      stopRecording();
    }
  };

  recordAudioBtn.addEventListener("click", toggleRecording);
}

function toggleRecording(): void {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}

function startRecording(): void {
  if (!recognition) return;

  isRecording = true;
  messageInput.value = "";
  messageInput.focus();

  recordAudioBtn.classList.add("recording");
  recordingIndicator.style.display = "flex";
  recordingStartTime = Date.now();
  updateRecordingTime();

  recordingTimer = setInterval(updateRecordingTime, 1000);

  try {
    recognition.start();
  } catch (e) {
    console.error("Failed to start recognition:", e);
    stopRecording();
  }
}

function stopRecording(): void {
  if (!recognition) return;

  isRecording = false;

  if (recordingTimer) {
    clearInterval(recordingTimer);
    recordingTimer = null;
  }

  recordAudioBtn.classList.remove("recording");
  recordingIndicator.style.display = "none";
  recordingTime.textContent = "0:00";

  try {
    recognition.stop();
  } catch (e) {
    console.error("Failed to stop recognition:", e);
  }

  autoResize(messageInput);
}

function updateRecordingTime(): void {
  const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  recordingTime.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function isSttSupported(): boolean {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}
