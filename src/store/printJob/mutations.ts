import type { MutationTree } from 'vuex'
import type { PrintJobState, PrintJobSettings } from './types'
import type { AppFile, AppFileWithMeta } from '@/store/files/types'
import type { FilamentMetadata } from '@/util/parseFilamentMetadata'
import type { FilamentMapping } from '@/util/filamentMapper'

export const mutations: MutationTree<PrintJobState> = {
  setDialogOpen (state, open: boolean) {
    state.dialogOpen = open
  },

  setCurrentFile (state, file: AppFile | AppFileWithMeta | null) {
    state.currentFile = file
  },

  setGcodeMetadata (state, metadata: FilamentMetadata | null) {
    state.gcodeMetadata = metadata
  },

  setMappings (state, mappings: FilamentMapping[]) {
    state.mappings = mappings
  },

  updateMapping (state, { gcodeExtruderIndex, printerSlotIndex }: { gcodeExtruderIndex: number, printerSlotIndex: number | null }) {
    const mapping = state.mappings.find(m => m.gcodeExtruderIndex === gcodeExtruderIndex)
    if (mapping) {
      mapping.printerSlotIndex = printerSlotIndex
      // Update confidence based on manual selection
      mapping.confidence = printerSlotIndex !== null ? 'high' : 'none'
    }
  },

  setSettings (state, settings: Partial<PrintJobSettings>) {
    state.settings = { ...state.settings, ...settings }
  },

  setLoading (state, loading: boolean) {
    state.isLoading = loading
  },

  setDownloadProgress (state, progress: number) {
    state.downloadProgress = progress
  },

  reset (state) {
    state.dialogOpen = false
    state.currentFile = null
    state.gcodeMetadata = null
    state.mappings = []
    state.settings = {
      autoBedLeveling: false,
      flowCalibrate: false,
      timeLapseCamera: false
    }
    state.isLoading = false
    state.downloadProgress = 0
  }
}
