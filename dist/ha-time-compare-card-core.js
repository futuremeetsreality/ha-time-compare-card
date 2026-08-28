// Filename: dist/ha-time-compare-card-core.js
// Timestamp: 2026-08-28 11:50 Europe/Vienna
import { CARD_STYLES } from "./ha-time-compare-card-styles.js";
import { CARD_TAG, CARD_VERSION, STRINGS } from "./ha-time-compare-card-strings.js";
import "./ha-time-compare-card-editor.js";
import {
  alignToWindow,
  downsample,
  escapeHtml,
  formatAxisValue,
  formatClock,
  formatValue,
  getRange,
  loadHistory,
  stats,
} from "./ha-time-compare-card-helpers.js";

class HaTimeCompareCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._config = null;
    this._runtime = null;
    this._data = null;
    this._loading = false;
    this._error = null;
    this._loadToken = 0;
    this._refreshTimer = null;
    this._storageKey = null;
  }

  static async getConfigElement() {
    return document.createElement("ha-time-compare-card-editor");
  }

  static getStubConfig(hass, entities) {
    const suggested = Array.isArray(entities)
      ? entities.find((entity) => typeof entity === "string" && entity.startsWith("sensor."))
      : undefined;
    return {
      type: `custom:${CARD_TAG}`,
      ...(suggested ? { entity: suggested } : {}),
      start_time: "06:00",
      end_time: "12:00",
      show_controls: true,
    };
  }

  static getGridOptions() {
    return {
      columns: 12,
      min_columns: 6,
      rows: 7,
      min_rows: 5,
    };
  }

  getCardSize() {
    return 6;
  }

  setConfig(config) {
    if (!config || typeof config !== "object") throw new Error("Invalid configuration");
    this._config = {
      type: `custom:${CARD_TAG}`,
      start_time: "06:00",
      end_time: "12:00",
      show_controls: true,
      ...config,
    };

    if (!this._storageKey) {
      this._storageKey = this._makeStorageKey(this._config);
      this._runtime = this._loadRuntime() || {
        entity: this._config.entity || "",
        start_time: this._config.start_time,
        end_time: this._config.end_time,
      };
    } else if (!this._runtime) {
      this._runtime = {
        entity: this._config.entity || "",
        start_time: this._config.start_time,
        end_time: this._config.end_time,
      };
    }

    this._render();
    this._scheduleLoad();
  }

  set hass(value) {
    this._hass = value;
    const picker = this.shadowRoot?.getElementById("entity-picker");
    if (picker) picker.hass = value;
    if (!this.shadowRoot?.hasChildNodes()) this._render();
    if (!this._data && !this._loading) this._scheduleLoad();
  }

  connectedCallback() {
    if (!this._refreshTimer) {
      this._refreshTimer = window.setInterval(() => this._load(), 5 * 60 * 1000);
    }
    this._render();
    this._scheduleLoad();
  }

  disconnectedCallback() {
    if (this._refreshTimer) {
      clearInterval(this._refreshTimer);
      this._refreshTimer = null;
    }
  }

  _makeStorageKey(config) {
    const source = `${location.pathname}|${config.entity || ""}|${config.start_time || "06:00"}|${config.end_time || "12:00"}`;
    let hash = 2166136261;
    for (let i = 0; i < source.length; i += 1) {
      hash ^= source.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return `ha-time-compare-card:${(hash >>> 0).toString(16)}`;
  }

  _loadRuntime() {
    try {
      const raw = localStorage.getItem(this._storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      return parsed;
    } catch (_error) {
      return null;
    }
  }

  _saveRuntime() {
    try {
      localStorage.setItem(this._storageKey, JSON.stringify(this._runtime));
    } catch (_error) {
      // Local storage is optional; the card remains fully usable without it.
    }
  }

  _language() {
    const language = this._hass?.language || this._hass?.locale?.language || navigator.language || "en";
    return String(language).toLowerCase().startsWith("de") ? "de" : "en";
  }

  _t() {
    return STRINGS[this._language()];
  }

  _scheduleLoad() {
    queueMicrotask(() => this._load());
  }

  async _load() {
    if (!this.isConnected || !this._hass || !this._runtime?.entity) {
      this._data = null;
      this._render();
      return;
    }

    const range = getRange(this._runtime.start_time, this._runtime.end_time);
    if (!range) {
      this._data = null;
      this._error = "invalid-time";
      this._render();
      return;
    }

    const token = ++this._loadToken;
    this._loading = true;
    this._error = null;
    this._render();

    try {
      const todayPromise = range.todayStarted && range.todayEnd > range.todayStart
        ? loadHistory(this._hass, this._runtime.entity, range.todayStart, range.todayEnd)
        : Promise.resolve([]);
      const yesterdayPromise = loadHistory(
        this._hass,
        this._runtime.entity,
        range.yesterdayStart,
        range.yesterdayEnd,
      );

      const [todayRows, yesterdayRows] = await Promise.all([todayPromise, yesterdayPromise]);
      if (token !== this._loadToken) return;

      const today = alignToWindow(todayRows, range.startMinute, range.durationMinutes);
      const yesterday = alignToWindow(yesterdayRows, range.startMinute, range.durationMinutes);
      this._data = { range, today, yesterday };
      this._error = null;
    } catch (error) {
      if (token !== this._loadToken) return;
      console.error(`[${CARD_TAG}]`, error);
      this._data = null;
      this._error = error?.message || "history-error";
    } finally {
      if (token === this._loadToken) {
        this._loading = false;
        this._render();
      }
    }
  }

  _updateRuntime(patch) {
    this._runtime = { ...this._runtime, ...patch };
    this._saveRuntime();
    this._data = null;
    this._error = null;
    this._render();
    this._scheduleLoad();
  }

  _render() {
    if (!this.shadowRoot || !this._config) return;
    const t = this._t();
    const entity = this._runtime?.entity || "";
    const stateObj = entity ? this._hass?.states?.[entity] : null;
    const friendlyName = stateObj?.attributes?.friendly_name || entity || t.title;
    const unit = stateObj?.attributes?.unit_of_measurement || "";
    const title = this._config.title || friendlyName || t.title;

    let body = "";
    if (!entity) {
      body = `<div class="message">${escapeHtml(t.selectEntity)}</div>`;
    } else if (this._error === "invalid-time") {
      body = `<div class="message error">${escapeHtml(t.invalidTime)}</div>`;
    } else if (this._loading && !this._data) {
      body = `<div class="message">${escapeHtml(t.loading)}</div>`;
    } else if (this._error) {
      body = `<div class="message error">${escapeHtml(t.error)}: ${escapeHtml(this._error)}</div>`;
    } else if (this._data) {
      body = this._renderData(unit);
    } else {
      body = `<div class="message">${escapeHtml(t.noData)}</div>`;
    }

    const controls = this._config.show_controls === false ? "" : `
      <div class="controls">
        <div class="field entity-field">
          <span class="label">${escapeHtml(t.entity)}</span>
          <ha-entity-picker id="entity-picker"></ha-entity-picker>
        </div>
        <div class="field">
          <label class="label" for="start-time">${escapeHtml(t.start)}</label>
          <input id="start-time" type="time" step="60" value="${escapeHtml(this._runtime?.start_time || "06:00")}">
        </div>
        <div class="field">
          <label class="label" for="end-time">${escapeHtml(t.end)}</label>
          <input id="end-time" type="time" step="60" value="${escapeHtml(this._runtime?.end_time || "12:00")}">
        </div>
      </div>
    `;

    this.shadowRoot.innerHTML = `
      <style>${CARD_STYLES}</style>
      <ha-card>
        <div class="wrap">
          <div class="header">
            <div class="title">${escapeHtml(title)}</div>
            <button class="refresh" id="refresh" type="button" title="${escapeHtml(t.refresh)}" aria-label="${escapeHtml(t.refresh)}">↻</button>
          </div>
          ${controls}
          ${body}
        </div>
      </ha-card>
    `;

    this._wireControls();
  }

  _wireControls() {
    const refresh = this.shadowRoot.getElementById("refresh");
    refresh?.addEventListener("click", () => this._load());

    const picker = this.shadowRoot.getElementById("entity-picker");
    if (picker && this._hass) {
      picker.hass = this._hass;
      picker.value = this._runtime?.entity || "";
      picker.includeDomains = ["sensor"];
      picker.allowCustomEntity = false;
      picker.addEventListener("value-changed", (event) => {
        const value = event.detail?.value || "";
        if (value !== this._runtime?.entity) this._updateRuntime({ entity: value });
      });
    }

    const start = this.shadowRoot.getElementById("start-time");
    const end = this.shadowRoot.getElementById("end-time");
    start?.addEventListener("change", (event) => {
      if (event.target.value) this._updateRuntime({ start_time: event.target.value });
    });
    end?.addEventListener("change", (event) => {
      if (event.target.value) this._updateRuntime({ end_time: event.target.value });
    });
  }

  _renderData(unit) {
    const t = this._t();
    const { range, today, yesterday } = this._data;
    if (!today.length && !yesterday.length) {
      return `<div class="message">${escapeHtml(t.noData)}</div>`;
    }

    const nowMinute = range.now.getHours() * 60 + range.now.getMinutes() + range.now.getSeconds() / 60;
    const todayVisibleEnd = range.todayStarted
      ? Math.max(0, Math.min(range.durationMinutes, nowMinute - range.startMinute))
      : 0;
    const todayStats = stats(today, todayVisibleEnd);
    const yesterdayStats = stats(yesterday, range.durationMinutes);
    const chart = this._renderChart(today, yesterday, range, unit);
    const todayDate = range.todayStart.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit" });
    const yesterdayDate = range.yesterdayStart.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit" });

    let difference = "–";
    if (todayStats && yesterdayStats) {
      const absolute = todayStats.avg - yesterdayStats.avg;
      const pct = Math.abs(yesterdayStats.avg) > 1e-9 ? (absolute / Math.abs(yesterdayStats.avg)) * 100 : null;
      difference = `${formatValue(absolute, unit)}${pct === null ? "" : ` · ${pct >= 0 ? "+" : ""}${pct.toFixed(1)} %`}`;
    }

    return `
      <div class="chart-shell">${chart}</div>
      <div class="legend">
        <span class="legend-item"><span class="sample"></span>${escapeHtml(t.today)} · ${escapeHtml(todayDate)}</span>
        <span class="legend-item"><span class="sample yesterday"></span>${escapeHtml(t.yesterday)} · ${escapeHtml(yesterdayDate)}</span>
      </div>
      <div class="stats">
        ${this._renderStatsCard(`${t.today} · ${todayDate}`, todayStats, unit, t)}
        ${this._renderStatsCard(`${t.yesterday} · ${yesterdayDate}`, yesterdayStats, unit, t)}
      </div>
      <div class="difference"><strong>${escapeHtml(t.difference)}:</strong> ${escapeHtml(difference)}</div>
    `;
  }

  _renderStatsCard(title, values, unit, t) {
    const metric = (label, value) => `
      <div>
        <div class="metric-label">${escapeHtml(label)}</div>
        <div class="metric-value">${escapeHtml(values ? formatValue(value, unit) : "–")}</div>
      </div>`;

    return `
      <div class="stat-card">
        <div class="stat-title">${escapeHtml(title)}</div>
        <div class="stat-grid">
          ${metric(t.average, values?.avg)}
          ${metric(t.minimum, values?.min)}
          ${metric(t.maximum, values?.max)}
        </div>
      </div>
    `;
  }

  _renderChart(todayRaw, yesterdayRaw, range, unit) {
    const width = 720;
    const height = 248;
    const left = 54;
    const right = 12;
    const top = 12;
    const bottom = 30;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const allValues = [...todayRaw, ...yesterdayRaw].map((point) => point.value);
    let min = Math.min(...allValues);
    let max = Math.max(...allValues);

    if (!Number.isFinite(min) || !Number.isFinite(max)) return "";
    if (min === max) {
      const padding = Math.max(Math.abs(min) * 0.1, 1);
      min -= padding;
      max += padding;
    } else {
      const padding = (max - min) * 0.08;
      min -= padding;
      max += padding;
    }

    const x = (minute) => left + (Math.max(0, Math.min(range.durationMinutes, minute)) / range.durationMinutes) * plotWidth;
    const y = (value) => top + ((max - value) / (max - min)) * plotHeight;
    const path = (points) => downsample(points)
      .map((point, index) => `${index === 0 ? "M" : "L"}${x(point.x).toFixed(2)},${y(point.value).toFixed(2)}`)
      .join(" ");

    const yLines = [];
    for (let i = 0; i <= 4; i += 1) {
      const ratio = i / 4;
      const yy = top + ratio * plotHeight;
      const value = max - ratio * (max - min);
      yLines.push(`<line class="grid-line" x1="${left}" y1="${yy}" x2="${width - right}" y2="${yy}"></line>`);
      yLines.push(`<text class="axis-text" x="${left - 7}" y="${yy + 4}" text-anchor="end">${escapeHtml(formatAxisValue(value))}</text>`);
    }

    const xTicks = [];
    const tickCount = range.durationMinutes <= 180 ? 3 : range.durationMinutes <= 480 ? 4 : 6;
    for (let i = 0; i <= tickCount; i += 1) {
      const ratio = i / tickCount;
      const minute = range.durationMinutes * ratio;
      const xx = x(minute);
      const clock = formatClock(range.startMinute + minute);
      xTicks.push(`<line class="grid-line" x1="${xx}" y1="${top}" x2="${xx}" y2="${height - bottom}"></line>`);
      xTicks.push(`<text class="axis-text" x="${xx}" y="${height - 8}" text-anchor="middle">${clock}</text>`);
    }

    return `
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(this._t().title)}">
        ${yLines.join("")}
        ${xTicks.join("")}
        ${unit ? `<text class="axis-text" x="4" y="10">${escapeHtml(unit)}</text>` : ""}
        ${yesterdayRaw.length ? `<path class="yesterday-line" d="${path(yesterdayRaw)}"></path>` : ""}
        ${todayRaw.length ? `<path class="today-line" d="${path(todayRaw)}"></path>` : ""}
      </svg>
    `;
  }
}

if (!customElements.get(CARD_TAG)) {
  customElements.define(CARD_TAG, HaTimeCompareCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === CARD_TAG)) {
  window.customCards.push({
    type: CARD_TAG,
    name: "Time Compare Card",
    description: "Compare one Home Assistant sensor for today and yesterday over the same time window.",
    preview: true,
    documentationURL: "https://github.com/futuremeetsreality/ha-time-compare-card",
  });
}

console.info(`%c TIME-COMPARE-CARD %c v${CARD_VERSION} `, "color:white;background:#03a9f4;font-weight:700;", "color:#03a9f4;background:white;");
