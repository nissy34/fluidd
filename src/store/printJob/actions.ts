import type { ActionTree } from 'vuex'
import type { PrintJobState } from './types'
import type { AppFile, AppFileWithMeta } from '@/store/files/types'
import type { RootState } from '@/store/types'
import type { AxiosProgressEvent } from 'axios'
import { httpClientActions } from '@/api/httpClientActions'
import { SocketActions } from '@/api/socketActions'
import { parseFilamentMetadata, findUsedExtruders } from '@/util/parseFilamentMetadata'
import { autoMapFilaments } from '@/util/filamentMapper'
import { consola } from 'consola'

/**
 * Fetches a file using a single HTTP request with gzip disabled.
 * @param filepath The file path (e.g., 'gcodes/folder/file.gcode')
 * @param fileSize The size of the file in bytes (used for progress calculation)
 * @param onProgress Optional callback function called during download with the current progress in bytes
 * @returns The file content as a string
 */
async function fetchFileWithByteRanges (
  filepath: string,
  fileSize: number,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    // Use byte range request with large range (1GB) to disable gzip compression
    // Many servers disable compression for range requests
    const rangeEnd = Math.min(fileSize - 1, 1024 * 1024 * 1024 - 1) // 1GB max
    const rangeHeader = `bytes=0-${rangeEnd}`

    const response = await httpClientActions.serverFilesGet<ArrayBuffer>(
      filepath,
      {
        responseType: 'arraybuffer',
        headers: {
          Range: rangeHeader
        },
        onDownloadProgress: (event: AxiosProgressEvent) => {
          if (onProgress) {
            // Use event.loaded for progress
            const progress = event.loaded || 0
            const total = event.total || fileSize
            const currentProgress = Math.min(progress, total)
            onProgress(currentProgress)
          }
        }
      }
    )

    // Check if we got a full content response (200)
    if (response.status !== 200) {
      throw new Error(`Failed to fetch file: ${response.status}`)
    }

    // Decode the response data to text
    const data = new Uint8Array(response.data)

    // Decode to text
    const decoder = new TextDecoder('utf-8', { fatal: false })
    return decoder.decode(data)
  } catch (error) {
    consola.error('Error fetching file:', error)
    throw new Error(`Failed to fetch file: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export const actions: ActionTree<PrintJobState, RootState> = {
  /**
   * Open dialog and load G-code file for configuration
   */
  async openDialog ({ commit, dispatch }, file: AppFile | AppFileWithMeta) {
    commit('setCurrentFile', file)
    commit('setDialogOpen', true)

    // Query print_task_config for fresh filament data
    SocketActions.printerObjectsQuery({ print_task_config: null })

    await dispatch('loadFilamentMetadata', file)
  },

  /**
   * Close dialog and reset state
   */
  closeDialog ({ commit }) {
    commit('reset')
  },

  /**
   * Load and parse G-code file to extract filament metadata and find used extruders
   */
  async loadFilamentMetadata ({ commit, dispatch }, file: AppFile | AppFileWithMeta) {
    commit('setLoading', true)
    commit('setDownloadProgress', 0)

    try {
      // Build full file path
      const fullPath = file.path ? `${file.path}/${file.filename}` : file.filename

      // Ensure filepath includes gcodes/ prefix
      const filepath = fullPath.startsWith('gcodes/')
        ? fullPath
        : `gcodes/${fullPath}`

      // Fetch file with gzip disabled and progress tracking
      const fileSize = file.size || 0

      const gcodeContent = await fetchFileWithByteRanges(
        filepath,
        fileSize,
        (progress) => {
          commit('setDownloadProgress', progress)
        }
      )

      // Set progress to 100% when download completes
      commit('setDownloadProgress', fileSize)

      // Step 1: Get configured filaments from Moonraker metadata (colors, types, vendor)
      // This is already in file.filament_colors, file.filament_type, etc.

      // Step 2a: Find actually used extruders by scanning for T commands
      const usedExtruderIndices = findUsedExtruders(gcodeContent)
      consola.info('Used extruders in G-code:', usedExtruderIndices)

      // Step 2b: Parse filament metadata for additional details
      const metadata = parseFilamentMetadata(gcodeContent)

      // Filter metadata to only include used extruders
      const filteredExtruders = metadata.extruders.filter(
        extruder => usedExtruderIndices.includes(extruder.index)
      )

      // Merge Moonraker metadata with parsed G-code metadata for used extruders
      const enrichedExtruders = usedExtruderIndices.map(index => {
        const gcodeExtruder = filteredExtruders.find(e => e.index === index)
        const fileMetadata = file as AppFileWithMeta

        return {
          index,
          // Prefer Moonraker metadata, fallback to G-code parsing
          color: fileMetadata.filament_colors?.[index] || gcodeExtruder?.color || null,
          type: fileMetadata.filament_type?.[index] || gcodeExtruder?.type || null,
          usageGrams: fileMetadata.filament_weights?.[index] || gcodeExtruder?.usageGrams || null,
          // Vendor name is typically only in G-code comments, not Moonraker metadata
          vendor: gcodeExtruder?.vendor || null
        }
      })

      const enrichedMetadata = {
        ...metadata,
        extruders: enrichedExtruders
      }

      commit('setGcodeMetadata', enrichedMetadata)

      // Step 3: Auto-map ONLY the used extruders to printer slots
      await dispatch('autoMapFilaments')
    } catch (error) {
      consola.error('Failed to load G-code file:', error)
      commit('setGcodeMetadata', null)
      commit('setMappings', [])
    } finally {
      commit('setLoading', false)
    }
  },

  /**
   * Auto-map G-code extruders to physical printer slots
   */
  async autoMapFilaments ({ commit, state, rootState }) {
    if (!state.gcodeMetadata) {
      commit('setMappings', [])
      return
    }

    // Get current printer filament slots
    // @ts-expect-error - filaments is a dynamic module
    const printerSlots = rootState.printer?.filaments?.slots ?? []

    // Run auto-mapping algorithm
    const mappings = autoMapFilaments(state.gcodeMetadata.extruders, printerSlots)
    commit('setMappings', mappings)
  },

  /**
   * Manually update a mapping (user changed dropdown)
   */
  updateMapping ({ commit }, payload: { gcodeExtruderIndex: number, printerSlotIndex: number | null }) {
    commit('updateMapping', payload)
  },

  /**
   * Update print settings (user toggled switch)
   */
  updateSettings ({ commit }, settings: Partial<PrintJobState['settings']>) {
    commit('setSettings', settings)
  },

  /**
   * Start print job - apply all settings and start print
   */
  async startPrint ({ state, dispatch, getters }) {
    if (!getters.canStartPrint) {
      consola.warn('Cannot start print: validation failed or still loading')
      return
    }

    try {
      // 1. Set extruder mappings - ONLY for used extruders
      for (const mapping of state.mappings) {
        if (mapping.printerSlotIndex !== null) {
          const mapCmd = `SET_PRINT_EXTRUDER_MAP CONFIG_EXTRUDER=${mapping.gcodeExtruderIndex} MAP_EXTRUDER=${mapping.printerSlotIndex}`
          SocketActions.printerGcodeScript(mapCmd)
          consola.info(`Mapping G-code T${mapping.gcodeExtruderIndex} → Printer slot ${mapping.printerSlotIndex}`)
        }
      }

      // 2. Set active extruders (which printer slots are used)
      const activeSlots = state.mappings
        .filter(m => m.printerSlotIndex !== null)
        .map(m => m.printerSlotIndex as number)
        .filter((value, index, self) => self.indexOf(value) === index) // unique
        .sort((a, b) => a - b)
        .join(',')

      if (activeSlots) {
        const usedCmd = `SET_PRINT_USED_EXTRUDERS EXTRUDERS=${activeSlots}`
        SocketActions.printerGcodeScript(usedCmd)
        consola.info(`Activating printer slots: ${activeSlots}`)
      }

      // 3. Set print preferences
      const preferences = `SET_PRINT_PREFERENCES BED_LEVEL=${state.settings.autoBedLeveling ? 1 : 0} FLOW_CALIBRATE=${state.settings.flowCalibrate ? 1 : 0} TIME_LAPSE_CAMERA=${state.settings.timeLapseCamera ? 1 : 0}`
      SocketActions.printerGcodeScript(preferences)

      // 4. Start the print
      if (state.currentFile) {
        const fullPath = state.currentFile.path
          ? `${state.currentFile.path}/${state.currentFile.filename}`
          : state.currentFile.filename

        SocketActions.printerPrintStart(fullPath)
      }

      // Close dialog
      dispatch('closeDialog')

      consola.info('Print job started:', state.currentFile?.filename)
    } catch (error) {
      consola.error('Failed to start print job:', error)
    }
  }
}
