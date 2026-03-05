/**
 * UI Component: ModelSelector
 * Gestiona el selector de modelos
 * Principio: Single Responsibility - Solo maneja la UI del selector de modelos
 */
export class ModelSelector {
  #container;
  #selectElement;
  #onModelSelected;

  constructor(containerElement, selectElement) {
    this.#container = containerElement;
    this.#selectElement = selectElement;
  }

  /**
   * Muestra el selector
   */
  show() {
    this.#container.classList.add("visible");
  }

  /**
   * Oculta el selector
   */
  hide() {
    this.#container.classList.remove("visible");
  }

  /**
   * Verifica si está visible
   */
  isVisible() {
    return this.#container.classList.contains("visible");
  }

  /**
   * Carga modelos en el selector
   */
  loadModels(models) {
    this.#selectElement.innerHTML = models
      .map((model) => `<option value="${model.name}">${model.name}</option>`)
      .join("");
  }

  /**
   * Obtiene el modelo seleccionado
   */
  getSelectedModel() {
    return this.#selectElement.value;
  }

  /**
   * Registra callback cuando se selecciona un modelo
   */
  onModelSelected(callback) {
    this.#onModelSelected = callback;
    this.#selectElement.addEventListener("change", () => {
      if (this.#onModelSelected) {
        this.#onModelSelected(this.getSelectedModel());
      }
    });
  }
}
