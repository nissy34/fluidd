# Filament Manager Component

This component displays filament information for multi-extruder 3D printers, showing material type, color, and manufacturer details for each loaded filament.

## Components

### FilamentManager.vue
Main container component that displays all filament slots in a responsive grid layout.

**Features:**
- Displays up to 4 filament slots
- Shows loaded/empty status
- Displays auto-replenish and entangle detection settings
- Empty state when no filaments are available

### FilamentSlot.vue
Individual filament slot card component.

**Displays:**
- Slot number (1-4)
- Color indicator (circular avatar with hex color)
- Material type badge (PLA, ABS, etc.)
- Manufacturer name and sub-type
- Loaded/Empty status
- Edit button (currently disabled, for future use)

## Store Module

Location: `src/store/printer/filaments/`

**Files:**
- `types.ts` - TypeScript interfaces for filament data
- `index.ts` - Vuex store module with state, getters, mutations, and actions

**State Structure:**
```typescript
interface FilamentState {
  slots: FilamentSlot[]
  extruderMapTable: number[]
  extrudersUsed: boolean[]
  extrudersReplenished: number[]
  autoReplenishFilament: boolean
  filamentEntangleDetect: boolean
  timeLapseCamera: boolean
  autoBedLeveling: boolean
  flowCalibrate: boolean
  shaperCalibrate: boolean
}
```

## Data Flow

Currently using mock data based on the print_task.json structure:
```
Mock Data → FilamentManager → FilamentSlot (display)
```

Future integration:
```
Moonraker API → SocketActions → Vuex Store → FilamentManager → FilamentSlot
```

## API Integration

Socket actions have been added to `src/api/socketActions.ts`:
- `printerFilamentGetStatus()` - Fetch current filament status
- `printerFilamentUpdate()` - Update filament configuration

These are placeholders for when the Moonraker API is ready.

## Usage

The component is integrated into the Dashboard view and will appear when `supportsFilaments` returns true.

**Layout path:** `dashboard.filament-card`

## Future Enhancements

### Phase 2 - Editing
- Click to edit filament properties
- Color picker dialog
- Material type dropdown
- Manufacturer selection
- Save/Cancel actions

### Phase 3 - Print Job Mapping
- Visual mapping interface between model colors and loaded filaments
- Preview of color assignments
- Override `extruder_map_table` before print
- Integration with print job submission

## Localization

Added to `src/locales/en.yaml`:
- `app.general.label.filaments`
- `app.general.label.loaded`
- `app.general.label.empty`
- `app.general.label.auto_replenish`
- `app.general.label.entangle_detect`
- `app.general.msg.no_filaments`

## Data Source

The component expects data in the format defined in `print_task.json`:
- Array-based structure with indices matching extruder slots
- Color data in both integer and RGBA hex format
- Metadata flags for official filaments, SKU, editability, etc.
