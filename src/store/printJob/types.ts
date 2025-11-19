import type { FilamentMetadata } from '@/util/parseFilamentMetadata'
import type { FilamentMapping } from '@/util/filamentMapper'
import type { AppFile, AppFileWithMeta } from '@/store/files/types'

export interface PrintJobState {
  dialogOpen: boolean
  currentFile: AppFile | AppFileWithMeta | null
  gcodeMetadata: FilamentMetadata | null
  mappings: FilamentMapping[]
  settings: PrintJobSettings
  isLoading: boolean
}

export interface PrintJobSettings {
  autoBedLeveling: boolean
  flowCalibrate: boolean
  timeLapseCamera: boolean
}

export interface ReprintInfo {
  auto_bed_leveling: boolean
  flow_calibrate: boolean
  time_lapse_camera: boolean
  extruder_map_table: number[]
  extruders_used: boolean[]
}
