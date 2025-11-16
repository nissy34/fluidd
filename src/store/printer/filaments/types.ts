export interface FilamentSlot {
  index: number
  vendor: string
  type: string
  subType: string
  colorRgba: string
  colorInt: number
  official: boolean
  sku: number
  exists: boolean
  soft: boolean
  editable: boolean
}

export interface FilamentState {
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

export interface PrintTaskData {
  filament_vendor: string[]
  filament_type: string[]
  filament_sub_type: string[]
  filament_color: number[]
  filament_color_rgba: string[]
  filament_official: boolean[]
  filament_sku: number[]
  filament_edit: boolean[]
  filament_exist: boolean[]
  filament_soft: boolean[]
  extruder_map_table: number[]
  extruders_used: boolean[]
  extruders_replenished: number[]
  time_lapse_camera: boolean
  auto_bed_leveling: boolean
  flow_calibrate: boolean
  shaper_calibrate: boolean
  auto_replenish_filament: boolean
  filament_entangle_detect: boolean
}
