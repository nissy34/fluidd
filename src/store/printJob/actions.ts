import type { ActionTree } from 'vuex'
import type { PrintJobState } from './types'
import type { AppFile, AppFileWithMeta } from '@/store/files/types'
import type { RootState } from '@/store/types'
import { httpClientActions } from '@/api/httpClientActions'
import { SocketActions } from '@/api/socketActions'
import { parseFilamentMetadata, findUsedExtruders } from '@/util/parseFilamentMetadata'
import { autoMapFilaments } from '@/util/filamentMapper'
import { consola } from 'consola'

/**
 * Fetches a file using byte range requests to handle large files and chunked encoding.
 * @param filepath The file path (e.g., 'gcodes/folder/file.gcode')
 * @param fileSize The size of the file in bytes
 * @param chunkSize The size of each chunk in bytes (default: 5MB)
 * @returns The file content as a string
 */
async function fetchFileWithByteRanges (
  filepath: string,
  fileSize: number,
  chunkSize: number = 100 * 1024 * 1024
): Promise<string> {
  if (!fileSize || fileSize <= 0) {
    throw new Error('File size must be greater than 0 for byte range requests')
  }

  const byteChunks: Uint8Array[] = []

  // Fetch file in chunks using byte range requests
  for (let start = 0; start < fileSize; start += chunkSize) {
    const end = Math.min(start + chunkSize - 1, fileSize - 1)
    const rangeHeader = `bytes=${start}-${end}`

    try {
      const chunkResponse = await httpClientActions.serverFilesGet<ArrayBuffer>(
        filepath,
        {
          responseType: 'arraybuffer',
          headers: {
            Range: rangeHeader
          }
        }
      )

      // Check if we got a partial content response (206) or full content (200)
      if (chunkResponse.status !== 200 && chunkResponse.status !== 206) {
        throw new Error(`Failed to fetch chunk ${start}-${end}: ${chunkResponse.status}`)
      }

      byteChunks.push(new Uint8Array(chunkResponse.data))
    } catch (error) {
      consola.error(`Error fetching chunk ${start}-${end}:`, error)
      throw new Error(`Failed to fetch chunk ${start}-${end}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Combine all byte chunks into a single Uint8Array
  const combined = new Uint8Array(fileSize)
  let offset = 0
  for (const chunk of byteChunks) {
    combined.set(chunk, offset)
    offset += chunk.length
  }

  // Decode the complete byte array to text
  const decoder = new TextDecoder('utf-8', { fatal: false })
  return decoder.decode(combined)
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

    try {
      // Build full file path
      const fullPath = file.path ? `${file.path}/${file.filename}` : file.filename

      // Ensure filepath includes gcodes/ prefix
      const filepath = fullPath.startsWith('gcodes/')
        ? fullPath
        : `gcodes/${fullPath}`

      // Use byte range requests to fetch file in chunks - more reliable for large files
      const fileSize = file.size || 0
      if (!fileSize) {
        throw new Error('Cannot determine file size for range requests - file size is required')
      }

      const gcodeContent = await fetchFileWithByteRanges(filepath, fileSize)

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
