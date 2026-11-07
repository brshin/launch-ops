# Signal color scheme

One meaning per hue across the queue, mission card, and console overview.
Source of truth for class tokens: `frontend/src/lib/signalColors.ts`.

| Hue | Meaning | Where it shows up |
|-----|---------|-------------------|
| **Cyan** | Brand / schedule / upcoming | Chrome, New updates, T− countdown, default queue chips |
| **Emerald** | Live / Go / positive energy | STREAM, In Flight, Live updates, Go pill, T+ elapsed |
| **Green** (deeper) | Success outcome | Success status only — finished well, not “on air” |
| **Amber** | Caution / changed plan | Hold, provisional NET, Time (reschedule) updates |
| **Violet** | Soft meta / uncertainty | TBC pill, Status (abbrev changed) updates |
| **Red / rose** | Failure | Failure, Partial Failure |
| **Slate** | Gone / unknown / muted | Gone updates, default/unknown status |

## Why Live ≠ Success

Both sit in the green family on purpose, but they are different weights:

- **Live / Go** → `emerald` — active, cleared, rolling now
- **Success** → `green-500` / `green-400` — outcome already locked

Sky was retired for live/stream so the board does not wash blue (cyan brand + sky live + cyan countdowns).

## Console update chips

| Chip | Kind | Color |
|------|------|--------|
| Live | `webcast` | emerald |
| New | `scheduled` | cyan |
| Time | `rescheduled` | amber |
| Status | `status` | violet |
| Gone | `removed` | slate |
