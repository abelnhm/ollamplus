import type { ModelOptions } from "../types.js";
import { enableModelParams } from "../ui/elements.js";

export const PARAM_DEFAULTS: Record<string, number | string> = {
  temperature: 0.8,
  top_p: 0.9,
  top_k: 40,
  num_ctx: 2048,
  repeat_penalty: 1.1,
  seed: "",
  num_predict: -1,
  stop: "",
  mirostat: 0,
  mirostat_tau: 5.0,
  mirostat_eta: 0.1,
};

export function getModelOptions(): ModelOptions | null {
  if (!enableModelParams.checked) return null;

  const opts: ModelOptions = {};

  const tempEl = document.getElementById(
    "param_temperature_val",
  ) as HTMLInputElement;
  if (tempEl) opts.temperature = parseFloat(tempEl.value);

  const topPEl = document.getElementById("param_top_p_val") as HTMLInputElement;
  if (topPEl) opts.top_p = parseFloat(topPEl.value);

  const topKEl = document.getElementById("param_top_k") as HTMLInputElement;
  if (topKEl) opts.top_k = parseInt(topKEl.value, 10);

  const numCtxEl = document.getElementById(
    "param_num_ctx",
  ) as HTMLSelectElement;
  if (numCtxEl) opts.num_ctx = parseInt(numCtxEl.value, 10);

  const repeatEl = document.getElementById(
    "param_repeat_penalty_val",
  ) as HTMLInputElement;
  if (repeatEl) opts.repeat_penalty = parseFloat(repeatEl.value);

  const seedEl = document.getElementById("param_seed") as HTMLInputElement;
  if (seedEl && seedEl.value !== "") opts.seed = parseInt(seedEl.value, 10);

  const numPredEl = document.getElementById(
    "param_num_predict",
  ) as HTMLInputElement;
  if (numPredEl) opts.num_predict = parseInt(numPredEl.value, 10);

  const stopEl = document.getElementById("param_stop") as HTMLInputElement;
  if (stopEl && stopEl.value.trim() !== "") {
    opts.stop = stopEl.value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const mirostatEl = document.getElementById(
    "param_mirostat",
  ) as HTMLSelectElement;
  if (mirostatEl) opts.mirostat = parseInt(mirostatEl.value, 10);

  const mirostatTauEl = document.getElementById(
    "param_mirostat_tau_val",
  ) as HTMLInputElement;
  if (mirostatTauEl) opts.mirostat_tau = parseFloat(mirostatTauEl.value);

  const mirostatEtaEl = document.getElementById(
    "param_mirostat_eta_val",
  ) as HTMLInputElement;
  if (mirostatEtaEl) opts.mirostat_eta = parseFloat(mirostatEtaEl.value);

  return opts;
}

export function resetModelParams(): void {
  const pairs: [string, string][] = [
    ["param_temperature", "param_temperature_val"],
    ["param_top_p", "param_top_p_val"],
    ["param_repeat_penalty", "param_repeat_penalty_val"],
    ["param_mirostat_tau", "param_mirostat_tau_val"],
    ["param_mirostat_eta", "param_mirostat_eta_val"],
  ];
  for (const [rangeId, numId] of pairs) {
    const key = rangeId.replace("param_", "");
    const def = PARAM_DEFAULTS[key];
    (document.getElementById(rangeId) as HTMLInputElement).value = String(def);
    (document.getElementById(numId) as HTMLInputElement).value = String(def);
  }

  (document.getElementById("param_top_k") as HTMLInputElement).value = String(
    PARAM_DEFAULTS.top_k,
  );
  (document.getElementById("param_num_ctx") as HTMLSelectElement).value =
    String(PARAM_DEFAULTS.num_ctx);
  (document.getElementById("param_seed") as HTMLInputElement).value = "";
  (document.getElementById("param_num_predict") as HTMLInputElement).value =
    String(PARAM_DEFAULTS.num_predict);
  (document.getElementById("param_stop") as HTMLInputElement).value = "";
  (document.getElementById("param_mirostat") as HTMLSelectElement).value =
    String(PARAM_DEFAULTS.mirostat);
}

export function initParamSync(): void {
  const pairs: [string, string][] = [
    ["param_temperature", "param_temperature_val"],
    ["param_top_p", "param_top_p_val"],
    ["param_repeat_penalty", "param_repeat_penalty_val"],
    ["param_mirostat_tau", "param_mirostat_tau_val"],
    ["param_mirostat_eta", "param_mirostat_eta_val"],
  ];
  for (const [rangeId, numId] of pairs) {
    const range = document.getElementById(rangeId) as HTMLInputElement;
    const num = document.getElementById(numId) as HTMLInputElement;
    range.addEventListener("input", () => {
      num.value = range.value;
    });
    num.addEventListener("input", () => {
      range.value = num.value;
    });
  }
}

export function initParamTooltips(): void {
  let activeTooltip: HTMLElement | null = null;

  function removeTooltip(): void {
    if (activeTooltip) {
      activeTooltip.remove();
      activeTooltip = null;
    }
  }

  document.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest(
      ".param-help-btn",
    ) as HTMLElement | null;
    if (!btn) {
      removeTooltip();
      return;
    }

    e.stopPropagation();
    if (activeTooltip) {
      removeTooltip();
      return;
    }

    const text = btn.getAttribute("data-tooltip") || "";
    const tip = document.createElement("div");
    tip.className = "param-tooltip";
    tip.textContent = text;
    document.body.appendChild(tip);

    const rect = btn.getBoundingClientRect();
    let top = rect.bottom + 6;
    let left = rect.left - 100;
    if (left < 8) left = 8;
    if (left + 280 > window.innerWidth) left = window.innerWidth - 288;
    if (top + 100 > window.innerHeight) top = rect.top - tip.offsetHeight - 6;

    tip.style.top = top + "px";
    tip.style.left = left + "px";
    activeTooltip = tip;
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") removeTooltip();
  });
}
