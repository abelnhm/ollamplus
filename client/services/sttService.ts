import { messageInput, recordAudioBtn, recordingIndicator, recordingTime, autoSendVoiceBtn } from "../ui/elements.js";
import { autoResize } from "../ui/elements.js";
import { sendMessage } from "./chatService.js";
import { openMicrophoneErrorModal } from "../ui/modalAlert.js";

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
let silenceTimer: ReturnType<typeof setTimeout> | null = null;
let lastTranscriptLength = 0;

const SILENCE_THRESHOLD_MS = 2000;

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
      lastTranscriptLength = messageInput.value.length;
      autoResize(messageInput);

      if (autoSendVoiceBtn.checked) {
        resetSilenceTimer();
      }
    }
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    console.error("Speech recognition error:", event.error);
    if (event.error === "not-allowed" || event.error === "audio-not-allowed") {
      openMicrophoneErrorModal();
    }
    if (event.error !== "no-speech") {
      stopRecording();
    }
  };

  recognition.onend = () => {
    if (isRecording) {
      try {
        recognition?.start();
      } catch (e) {
        stopRecording();
      }
    }
  };

  recordAudioBtn.addEventListener("click", toggleRecording);
}

function resetSilenceTimer(): void {
  if (silenceTimer) {
    clearTimeout(silenceTimer);
  }
  
  silenceTimer = setTimeout(() => {
    if (isRecording && autoSendVoiceBtn.checked && messageInput.value.trim().length > 0) {
      stopRecordingAndSend();
    }
  }, SILENCE_THRESHOLD_MS);
}

function stopRecordingAndSend(): void {
  if (!recognition) return;

  isRecording = false;

  if (silenceTimer) {
    clearTimeout(silenceTimer);
    silenceTimer = null;
  }

  if (recordingTimer) {
    clearInterval(recordingTimer);
    recordingTimer = null;
  }

  recordAudioBtn.classList.remove("recording");
  recordingIndicator.style.display = "none";
  recordingTime.textContent = "0:00";

  const transcript = messageInput.value.trim();

  try {
    recognition.stop();
  } catch (e) {
    console.error("Failed to stop recognition:", e);
  }

  autoResize(messageInput);

  if (transcript.length > 0) {
    sendMessage();
  }
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
  lastTranscriptLength = 0;
  messageInput.focus();

  recordAudioBtn.classList.add("recording");
  recordingIndicator.style.display = "flex";
  recordingStartTime = Date.now();
  updateRecordingTime();

  recordingTimer = setInterval(updateRecordingTime, 1000);

  if (autoSendVoiceBtn.checked) {
    resetSilenceTimer();
  }

  try {
    recognition.start();
  } catch (e) {
    console.error("Failed to start recognition:", e);
    stopRecording();
  }
}

export function startVoiceRecording(): void {
  if (!recognition || isRecording) return;
  startRecording();
}

function stopRecording(): void {
  if (!recognition) return;

  isRecording = false;

  if (silenceTimer) {
    clearTimeout(silenceTimer);
    silenceTimer = null;
  }

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
  const win = window as unknown as WindowWithSpeechRecognition;
  return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
}
