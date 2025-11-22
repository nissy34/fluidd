import type { PrintJobState } from './types'

export const defaultState = (): PrintJobState => {
  return {
    dialogOpen: false,
    currentFile: null,
    gcodeMetadata: null,
    mappings: [],
    settings: {
      autoBedLeveling: false,
      flowCalibrate: false,
      timeLapseCamera: false
    },
    isLoading: false,
    downloadProgress: 0
  }
}
