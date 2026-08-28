// Filename: dist/ha-time-compare-card-helpers.js
// Timestamp: 2026-08-28 12:03 Europe/Vienna

export function parseTime(value) {
  const match = /^(\d{2}):(\d{2})$/.exec(value || "");
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

export function dateAtTime(dayOffset, time) {
  const minutes = parseTime(time);
  if (minutes === null) return null;
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + dayOffset);
  date.setMinutes(minutes, 0, 0);
  return date;
}

export function getRange(startTime, endTime) {
  const startMinute = parseTime(startTime);
  const endMinute = parseTime(endTime);
  if (startMinute === null || endMinute === null || endMinute <= startMinute) return null;

  const todayStart = dateAtTime(0, startTime);
  const todayEndRequested = dateAtTime(0, endTime);
  const yesterdayStart = dateAtTime(-1, startTime);
  const yesterdayEnd = dateAtTime(-1, endTime);
  const now = new Date();
  const todayEnd = new Date(Math.min(todayEndRequested.getTime(), now.getTime()));

  return {
    startMinute,
    endMinute,
    durationMinutes: endMinute - startMinute,
    todayStart,
    todayEndRequested,
    todayEnd,
    yesterdayStart,
    yesterdayEnd,
    now,
    todayStarted: now >= todayStart,
  };
}

export async function loadHistory(hass, entity, start, end) {
  if (!hass || !entity || !start || !end || end <= start) return [];
  const path = `history/period/${encodeURIComponent(start.toISOString())}`
    + `?filter_entity_id=${encodeURIComponent(entity)}`
    + `&end_time=${encodeURIComponent(end.toISOString())}`
    + `&minimal_response&no_attributes&significant_changes_only=0`;

  const response = await hass.callApi("GET", path);
  const rows = Array.isArray(response) && Array.isArray(response[0]) ? response[0] : [];
  return rows
    .map((row) => {
      const raw = row?.state ?? row?.s;
      const value = Number(raw);
      const stamp = row?.last_changed ?? row?.last_updated ?? row?.lc ?? row?.lu;
      const date = stamp ? new Date(stamp) : null;
      if (!Number.isFinite(value) || !date || Number.isNaN(date.getTime())) return null;

      // Home Assistant can return the state that was already active at the
      // beginning of the requested period. Its actual last_changed timestamp
      // may be older than the requested start. Clamp that point to the period
      // boundary so the chart and time-weighted average start at x=0.
      const normalizedDate = date < start
        ? new Date(start)
        : date > end
          ? new Date(end)
          : date;

      return { value, date: normalizedDate };
    })
    .filter(Boolean);
}

export function alignToWindow(rows, startMinute, durationMinutes) {
  return rows
    .map(({ value, date }) => {
      const minute = date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
      return { x: minute - startMinute, value };
    })
    .filter((point) => point.x >= 0 && point.x <= durationMinutes)
    .sort((a, b) => a.x - b.x);
}

export function downsample(points, maxPoints = 1400) {
  if (points.length <= maxPoints) return points;
  const result = [points[0]];
  const step = (points.length - 2) / (maxPoints - 2);
  for (let i = 1; i < maxPoints - 1; i += 1) {
    result.push(points[Math.round(i * step)]);
  }
  result.push(points[points.length - 1]);
  return result;
}

export function stats(points, visibleEndMinute) {
  if (!points.length) return null;
  const values = points.map((point) => point.value);
  let weighted = 0;
  let duration = 0;

  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const nextX = i < points.length - 1 ? points[i + 1].x : visibleEndMinute;
    const segment = Math.max(0, Math.min(nextX, visibleEndMinute) - Math.max(current.x, 0));
    if (segment > 0) {
      weighted += current.value * segment;
      duration += segment;
    }
  }

  return {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: duration > 0 ? weighted / duration : values.reduce((sum, value) => sum + value, 0) / values.length,
  };
}

export function formatValue(value, unit) {
  if (!Number.isFinite(value)) return "–";
  const absolute = Math.abs(value);
  const digits = absolute >= 100 ? 0 : absolute >= 10 ? 1 : 2;
  const formatted = new Intl.NumberFormat(undefined, { maximumFractionDigits: digits }).format(value);
  return unit ? `${formatted} ${unit}` : formatted;
}

export function formatAxisValue(value) {
  if (!Number.isFinite(value)) return "";
  const absolute = Math.abs(value);
  if (absolute >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (absolute >= 1000) return `${(value / 1000).toFixed(1)}k`;
  if (absolute >= 100) return value.toFixed(0);
  if (absolute >= 10) return value.toFixed(1);
  return value.toFixed(2);
}

export function formatClock(totalMinutes) {
  const minutes = Math.max(0, Math.round(totalMinutes));
  const hour = Math.floor(minutes / 60) % 24;
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
