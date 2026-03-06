import { sidebar, sidebarOverlay } from "./elements.js";

export function openSidebar(): void {
  sidebar.classList.add("open");
  sidebarOverlay.classList.add("active");
}

export function closeSidebar(): void {
  sidebar.classList.remove("open");
  sidebarOverlay.classList.remove("active");
}
