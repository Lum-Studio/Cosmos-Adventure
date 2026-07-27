# Project: Cosmos-Adventure Celestial Selection Screen Modularization

## Architecture
Modular JSON UI architecture for Minecraft Bedrock Resource Pack (`RP/ui/celestial/`).
Replaces monolithic `RP/ui/celestial_selector.json` with clean sub-templates registered in `RP/ui/_ui_defs.json` under namespace `celestial`.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Exploration & Analysis | Analyze `celestial_selector.json`, `_ui_defs.json`, `server_form.json`, `ui_datagen.ts`, `deploy.py` | none | DONE |
| 2 | Modular JSON UI Split | Extract sub-components into `RP/ui/celestial/*.json` | M1 | DONE |
| 3 | Pre-generator & Registration | Update `_ui_defs.json`, `server_form.json`, and `ui_datagen.ts` | M2 | DONE |
| 4 | Verification & Deployment | Run `deploy.py`, audit integrity, and test build | M3 | DONE |

## Interface Contracts
### `server_form.json` ↔ `celestial:selector_screen`
- `server_form.json` traps `#title_text` == "Celestial Panel" (or containing "Celestial Panel") to embed `celestial:selector_screen` or direct to `celestial` namespace controls.
- All controls maintain existing binding names, variables, and button mapping actions.

## Code Layout
- `RP/ui/celestial/celestial_base.json`
- `RP/ui/celestial/solar_system_map.json`
- `RP/ui/celestial/planet_views.json`
- `RP/ui/celestial/station_recipe_panel.json`
- `RP/ui/celestial/station_list_panel.json`
- `RP/ui/_ui_defs.json`
- `RP/ui/server_form.json`
- `ui_datagen.ts` / generator scripts
