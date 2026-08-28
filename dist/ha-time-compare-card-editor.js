// Filename: dist/ha-time-compare-card-editor.js
// Timestamp: 2026-08-28 11:43 Europe/Vienna
import { EDITOR_STYLES } from "./ha-time-compare-card-styles.js";
import { STRINGS } from "./ha-time-compare-card-strings.js";

export class HaTimeCompareCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._config = {};
    this._rendered = false;
  }

  set hass(value) {
    this._hass = value;
    this._render();
  }

  setConfig(config) {
    this._config = { start_time: "06:00", end_time: "12:00", show_controls: true, ...config };
    this._rendered = false;
    this._render();
  }

  _language() {
    const language = this._hass?.language || this._hass?.locale?.language || navigator.language || "en";
    return String(language).toLowerCase().startsWith("de") ? "de" : "en";
  }

  _render() {
    if (!this.shadowRoot || !this._hass || this._rendered) return;
    const t = STRINGS[this._language()];
    this.shadowRoot.innerHTML = `
      <style>${EDITOR_STYLES}</style>
      <div class="editor">
        <div class="field">
          <label>${t.entity}</label>
          <ha-entity-picker id="entity"></ha-entity-picker>
        </div>
        <div class="times">
          <div class="field">
            <label for="start">${t.start}</label>
            <input id="start" type="time" step="60" value="${this._config.start_time || "06:00"}">
          </div>
          <div class="field">
            <label for="end">${t.end}</label>
            <input id="end" type="time" step="60" value="${this._config.end_time || "12:00"}">
          </div>
        </div>
      </div>
    `;

    const picker = this.shadowRoot.getElementById("entity");
    picker.hass = this._hass;
    picker.value = this._config.entity || "";
    picker.includeDomains = ["sensor"];
    picker.allowCustomEntity = false;
    picker.addEventListener("value-changed", (event) => {
      this._updateConfig({ entity: event.detail?.value || undefined });
    });

    this.shadowRoot.getElementById("start").addEventListener("change", (event) => {
      this._updateConfig({ start_time: event.target.value || "06:00" });
    });
    this.shadowRoot.getElementById("end").addEventListener("change", (event) => {
      this._updateConfig({ end_time: event.target.value || "12:00" });
    });

    this._rendered = true;
  }

  _updateConfig(patch) {
    const config = { ...this._config, ...patch };
    Object.keys(config).forEach((key) => config[key] === undefined && delete config[key]);
    this._config = config;
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config },
      bubbles: true,
      composed: true,
    }));
  }
}

if (!customElements.get("ha-time-compare-card-editor")) {
  customElements.define("ha-time-compare-card-editor", HaTimeCompareCardEditor);
}
