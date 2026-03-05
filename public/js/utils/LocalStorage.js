/**
 * Utility: LocalStorage
 * Utilidad para gestionar almacenamiento local
 * Principio: Single Responsibility - Solo maneja localStorage
 */
export class LocalStorage {
  static get(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.error("Error al leer de localStorage:", error);
      return defaultValue;
    }
  }

  static set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Error al escribir en localStorage:", error);
    }
  }

  static remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error("Error al eliminar de localStorage:", error);
    }
  }

  static clear() {
    try {
      localStorage.clear();
    } catch (error) {
      console.error("Error al limpiar localStorage:", error);
    }
  }
}
