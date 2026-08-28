// Filename: dist/ha-time-compare-card-styles.js
// Timestamp: 2026-08-28 11:36 Europe/Vienna
export const CARD_STYLES = `
  :host {
    display: block;
  }

  ha-card {
    overflow: hidden;
  }

  .wrap {
    padding: 16px;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }

  .title {
    font-size: 18px;
    font-weight: 600;
    line-height: 1.3;
    color: var(--primary-text-color);
  }

  .controls {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 112px 112px;
    gap: 10px;
    align-items: end;
    margin-bottom: 12px;
  }

  .field {
    min-width: 0;
  }

  .label {
    display: block;
    margin: 0 0 5px 2px;
    font-size: 12px;
    color: var(--secondary-text-color);
  }

  ha-entity-picker {
    width: 100%;
  }

  input[type="time"] {
    width: 100%;
    box-sizing: border-box;
    min-height: 48px;
    border: 1px solid var(--divider-color);
    border-radius: 10px;
    background: var(--card-background-color);
    color: var(--primary-text-color);
    padding: 0 10px;
    font: inherit;
  }

  .message {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 180px;
    color: var(--secondary-text-color);
    text-align: center;
    padding: 12px;
  }

  .chart-shell {
    position: relative;
    min-height: 248px;
    margin-top: 4px;
  }

  svg {
    width: 100%;
    height: 248px;
    display: block;
    overflow: visible;
  }

  .grid-line {
    stroke: var(--divider-color);
    stroke-width: 1;
    opacity: 0.55;
  }

  .axis-text {
    fill: var(--secondary-text-color);
    font-size: 11px;
  }

  .today-line {
    fill: none;
    stroke: var(--primary-color);
    stroke-width: 2.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .yesterday-line {
    fill: none;
    stroke: var(--secondary-text-color);
    stroke-width: 2.1;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 7 6;
    opacity: 0.9;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 18px;
    align-items: center;
    margin: 6px 0 0;
    font-size: 12px;
    color: var(--secondary-text-color);
  }

  .legend-item {
    display: inline-flex;
    align-items: center;
    gap: 7px;
  }

  .sample {
    width: 24px;
    height: 0;
    border-top: 3px solid var(--primary-color);
  }

  .sample.yesterday {
    border-top-color: var(--secondary-text-color);
    border-top-style: dashed;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin-top: 14px;
  }

  .stat-card {
    border: 1px solid var(--divider-color);
    border-radius: 12px;
    padding: 10px 12px;
    min-width: 0;
  }

  .stat-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 7px;
    font-size: 13px;
    font-weight: 600;
    color: var(--primary-text-color);
  }

  .stat-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .metric-label {
    font-size: 10px;
    color: var(--secondary-text-color);
    margin-bottom: 2px;
  }

  .metric-value {
    font-size: 14px;
    color: var(--primary-text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .difference {
    margin-top: 10px;
    padding: 9px 11px;
    border-radius: 10px;
    background: var(--secondary-background-color);
    color: var(--primary-text-color);
    font-size: 13px;
  }

  .refresh {
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--primary-color);
    min-width: 42px;
    min-height: 42px;
    cursor: pointer;
    font: inherit;
  }

  .refresh:focus-visible,
  input:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }

  .error {
    color: var(--error-color);
  }

  @media (max-width: 600px) {
    .controls {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .field.entity-field {
      grid-column: 1 / -1;
    }

    .stats {
      grid-template-columns: 1fr;
    }

    .wrap {
      padding: 14px;
    }
  }
`;

export const EDITOR_STYLES = `
  :host { display: block; }
  .editor { display: grid; gap: 16px; padding: 8px 0; }
  .times { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .field { min-width: 0; }
  label { display: block; margin: 0 0 6px 2px; color: var(--secondary-text-color); font-size: 12px; }
  input[type="time"] { width: 100%; box-sizing: border-box; min-height: 48px; border: 1px solid var(--divider-color); border-radius: 10px; background: var(--card-background-color); color: var(--primary-text-color); padding: 0 10px; font: inherit; }
  @media (max-width: 520px) { .times { grid-template-columns: 1fr; } }
`;
