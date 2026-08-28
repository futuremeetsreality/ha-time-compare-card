# Time Compare Card

A Home Assistant dashboard card for comparing the same numeric sensor over the same time window **today vs. yesterday**.

The card is designed for interactive use: choose the sensor and time window directly on the card. Yesterday is selected automatically and aligned to the same X-axis.

## Features

- Select any numeric `sensor.*` entity directly on the card
- Choose start and end time without YAML edits
- Automatic comparison with yesterday
- Today's line stops at the current time instead of extending into the future
- Shared Y-axis for direct visual comparison
- Time-weighted average, minimum and maximum
- Average difference in absolute value and percent
- German and English UI text
- Responsive layout for phone, tablet and desktop
- Home Assistant graphical card configuration
- Entity suggestions in the card picker on Home Assistant 2026.6+
- HACS-compatible dashboard/plugin structure
- No external JavaScript chart library required

## Requirements

- Home Assistant with Recorder/history enabled for the selected sensor
- A reasonably current Home Assistant frontend
- HACS for the recommended installation method

## Installation with HACS

1. Open HACS.
2. Open the menu in the top-right corner and choose **Custom repositories**.
3. Add:
   `https://github.com/futuremeetsreality/ha-time-compare-card`
4. Select repository type **Dashboard**.
5. Install **Time Compare Card**.
6. Refresh the Home Assistant frontend.
7. Edit a dashboard and add **Time Compare Card** from the card picker.

No manual Lovelace YAML is required for normal use.

## Default behavior

The initial time range is `06:00` to `12:00`.

The solid line is **Today**. The dashed line is **Yesterday**. If the selected end time is still in the future, today's series ends at the current time while yesterday remains complete for the selected time window.

## Optional YAML configuration

YAML is not required, but advanced users can still configure the card manually:

```yaml
type: custom:ha-time-compare-card
entity: sensor.solax_inverter_house_load
start_time: "06:00"
end_time: "12:00"
show_controls: true
```

## Notes

The interactive sensor/time selection is stored locally in the browser for the current dashboard path. The graphical card editor can be used to define dashboard defaults.

Version: **0.1.0**
