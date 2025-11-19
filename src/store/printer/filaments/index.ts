import type { Module } from 'vuex'
import type { FilamentState, PrintTaskData, FilamentSlot } from './types'
import type { RootState } from '@/store/types'

export const getDefaultState = (): FilamentState => {
  return {
    slots: [],
    extruderMapTable: [],
    extrudersUsed: [],
    extrudersReplenished: [],
    autoReplenishFilament: false,
    filamentEntangleDetect: false,
    timeLapseCamera: false,
    autoBedLeveling: false,
    flowCalibrate: false,
    shaperCalibrate: false,
    reprintInfo: null,
    rawData: {}
  }
}

export const state = getDefaultState()

export const getters = {
  getSlots: (state: FilamentState): FilamentSlot[] => {
    return state.slots
  },

  getSlotByIndex: (state: FilamentState) => (index: number): FilamentSlot | undefined => {
    return state.slots.find(slot => slot.index === index)
  },

  getLoadedSlots: (state: FilamentState): FilamentSlot[] => {
    return state.slots.filter(slot => slot.exists)
  },

  getExtruderMapTable: (state: FilamentState): number[] => {
    return state.extruderMapTable
  }
}

export const mutations = {
  setFilamentData (state: FilamentState, payload: PrintTaskData) {
    // Store raw data for later use
    state.rawData = payload as any

    const slots: FilamentSlot[] = []

    // Convert the array-based structure to individual slot objects
    const slotCount = payload.filament_vendor?.length || 0
    for (let i = 0; i < slotCount; i++) {
      slots.push({
        index: i,
        vendor: payload.filament_vendor?.[i] || '',
        type: payload.filament_type?.[i] || '',
        subType: payload.filament_sub_type?.[i] || '',
        colorRgba: payload.filament_color_rgba?.[i] || '',
        colorInt: payload.filament_color?.[i] || 0,
        official: payload.filament_official?.[i] || false,
        sku: payload.filament_sku?.[i] || 0,
        exists: payload.filament_exist?.[i] || false,
        soft: payload.filament_soft?.[i] || false,
        editable: payload.filament_edit?.[i] || false
      })
    }

    state.slots = slots
    state.extruderMapTable = payload.extruder_map_table || []
    state.extrudersUsed = payload.extruders_used || []
    state.extrudersReplenished = payload.extruders_replenished || []
    state.autoReplenishFilament = payload.auto_replenish_filament || false
    state.filamentEntangleDetect = payload.filament_entangle_detect || false
    state.timeLapseCamera = payload.time_lapse_camera || false
    state.autoBedLeveling = payload.auto_bed_leveling || false
    state.flowCalibrate = payload.flow_calibrate || false
    state.shaperCalibrate = payload.shaper_calibrate || false
    state.reprintInfo = payload.reprint_info || null
  },

  updateFilamentData (state: FilamentState, payload: Partial<PrintTaskData>) {
    // Merge partial updates with existing data
    const mergedData = {
      ...state.rawData,
      ...payload
    } as PrintTaskData

    // Only update slots if we have complete slot data
    if (payload.filament_vendor && payload.filament_vendor.length > 0) {
      const slots: FilamentSlot[] = []
      const slotCount = payload.filament_vendor.length

      for (let i = 0; i < slotCount; i++) {
        slots.push({
          index: i,
          vendor: payload.filament_vendor[i],
          type: payload.filament_type?.[i] || state.slots[i]?.type || '',
          subType: payload.filament_sub_type?.[i] || state.slots[i]?.subType || '',
          colorRgba: payload.filament_color_rgba?.[i] || state.slots[i]?.colorRgba || '',
          colorInt: payload.filament_color?.[i] || state.slots[i]?.colorInt || 0,
          official: payload.filament_official?.[i] ?? state.slots[i]?.official ?? false,
          sku: payload.filament_sku?.[i] ?? state.slots[i]?.sku ?? 0,
          exists: payload.filament_exist?.[i] ?? state.slots[i]?.exists ?? false,
          soft: payload.filament_soft?.[i] ?? state.slots[i]?.soft ?? false,
          editable: payload.filament_edit?.[i] ?? state.slots[i]?.editable ?? false
        })
      }
      state.slots = slots
    } else if (payload.filament_color_rgba || payload.filament_color) {
      // Update only colors in existing slots
      state.slots = state.slots.map((slot, i) => ({
        ...slot,
        colorRgba: payload.filament_color_rgba?.[i] ?? slot.colorRgba,
        colorInt: payload.filament_color?.[i] ?? slot.colorInt
      }))
    }

    // Update other fields if provided
    if (payload.extruder_map_table !== undefined) state.extruderMapTable = payload.extruder_map_table
    if (payload.extruders_used !== undefined) state.extrudersUsed = payload.extruders_used
    if (payload.extruders_replenished !== undefined) state.extrudersReplenished = payload.extruders_replenished
    if (payload.auto_replenish_filament !== undefined) state.autoReplenishFilament = payload.auto_replenish_filament
    if (payload.filament_entangle_detect !== undefined) state.filamentEntangleDetect = payload.filament_entangle_detect
    if (payload.time_lapse_camera !== undefined) state.timeLapseCamera = payload.time_lapse_camera
    if (payload.auto_bed_leveling !== undefined) state.autoBedLeveling = payload.auto_bed_leveling
    if (payload.flow_calibrate !== undefined) state.flowCalibrate = payload.flow_calibrate
    if (payload.shaper_calibrate !== undefined) state.shaperCalibrate = payload.shaper_calibrate
    if (payload.reprint_info !== undefined) state.reprintInfo = payload.reprint_info

    // Update raw data
    state.rawData = mergedData
  },

  resetFilamentState (state: FilamentState) {
    Object.assign(state, getDefaultState())
  }
}

export const actions = {
  async onPrintTaskConfigUpdate ({ commit, state }: any, payload: Partial<PrintTaskData>) {
    // Check if this is a full update (has filament_vendor array) or partial update
    const isFullUpdate = payload.filament_vendor && payload.filament_vendor.length > 0
    const isPartialUpdate = !isFullUpdate && (payload.filament_color || payload.filament_color_rgba || Object.keys(payload).length > 0)

    if (isFullUpdate) {
      // Full data - use setFilamentData
      commit('setFilamentData', payload)
    } else if (isPartialUpdate && state.slots.length > 0) {
      // Partial update - merge with existing data
      commit('updateFilamentData', payload)
    } else if (isFullUpdate === false && state.slots.length === 0) {
      // No existing data and incomplete update - log warning
      console.warn('Received partial print_task_config update but no existing data:', payload)
    }
  }
}

const namespaced = true

export const filaments = {
  namespaced,
  state,
  getters,
  actions,
  mutations
} satisfies Module<FilamentState, RootState>
