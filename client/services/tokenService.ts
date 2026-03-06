import { state } from "../state.js";
import { apiPost } from "../api.js";
import { getOllamaUrl, formatTokenCount } from "../utils.js";
import {
  enableModelParams,
  tokenUsageContainer,
  tokenUsageSummary,
  tokenUsageBar,
  tokenPromptCount,
  tokenResponseCount,
  tokenContextLimit,
} from "../ui/elements.js";
import { getSystemPrompt } from "./systemPrompt.js";

export function updateTokenDisplay(): void {
  const numCtxEl = document.getElementById(
    "param_num_ctx",
  ) as HTMLSelectElement | null;
  const userCtx =
    enableModelParams.checked && numCtxEl ? parseInt(numCtxEl.value, 10) : 0;
  const effectiveLimit = userCtx > 0 ? userCtx : state.modelContextLength;

  if (effectiveLimit <= 0 && state.totalTokensUsed <= 0) {
    tokenUsageContainer.style.display = "none";
    return;
  }

  tokenUsageContainer.style.display = "";

  const limit = effectiveLimit > 0 ? effectiveLimit : 0;
  const pct =
    limit > 0 ? Math.min((state.totalTokensUsed / limit) * 100, 100) : 0;

  tokenUsageSummary.textContent =
    limit > 0
      ? `${formatTokenCount(state.totalTokensUsed)} / ${formatTokenCount(limit)}`
      : `${formatTokenCount(state.totalTokensUsed)}`;
  tokenContextLimit.textContent = limit > 0 ? formatTokenCount(limit) : "—";

  tokenUsageBar.style.width = pct + "%";
  tokenUsageBar.classList.remove("warning", "danger");
  if (pct >= 90) {
    tokenUsageBar.classList.add("danger");
  } else if (pct >= 70) {
    tokenUsageBar.classList.add("warning");
  }
}

export function updateTokenUsage(
  promptTokens: number,
  responseTokens: number,
): void {
  state.totalTokensUsed = promptTokens + responseTokens;
  tokenPromptCount.textContent = formatTokenCount(promptTokens);
  tokenResponseCount.textContent = formatTokenCount(responseTokens);
  updateTokenDisplay();
}

export function resetTokenUsage(): void {
  state.totalTokensUsed = 0;
  tokenPromptCount.textContent = "0";
  tokenResponseCount.textContent = "0";
  updateTokenDisplay();
}

export async function countChatTokens(chatId: string): Promise<void> {
  try {
    const data = await apiPost<{ promptTokens: number }>(
      `/api/chat/${chatId}/count-tokens`,
      {
        ollamaUrl: getOllamaUrl(),
        systemPrompt: getSystemPrompt(),
      },
    );
    state.totalTokensUsed = data.promptTokens;
    tokenPromptCount.textContent = formatTokenCount(data.promptTokens);
    tokenResponseCount.textContent = "0";
    updateTokenDisplay();
  } catch (err) {
    console.error("Error contando tokens:", err);
  }
}
