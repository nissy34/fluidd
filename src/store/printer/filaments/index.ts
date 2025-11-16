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
    shaperCalibrate: false
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
    const slots: FilamentSlot[] = []

    // Convert the array-based structure to individual slot objects
    const slotCount = payload.filament_vendor.length
    for (let i = 0; i < slotCount; i++) {
      slots.push({
        index: i,
        vendor: payload.filament_vendor[i],
        type: payload.filament_type[i],
        subType: payload.filament_sub_type[i],
        colorRgba: payload.filament_color_rgba[i],
        colorInt: payload.filament_color[i],
        official: payload.filament_official[i],
        sku: payload.filament_sku[i],
        exists: payload.filament_exist[i],
        soft: payload.filament_soft[i],
        editable: payload.filament_edit[i]
      })
    }

    state.slots = slots
    state.extruderMapTable = payload.extruder_map_table
    state.extrudersUsed = payload.extruders_used
    state.extrudersReplenished = payload.extruders_replenished
    state.autoReplenishFilament = payload.auto_replenish_filament
    state.filamentEntangleDetect = payload.filament_entangle_detect
    state.timeLapseCamera = payload.time_lapse_camera
    state.autoBedLeveling = payload.auto_bed_leveling
    state.flowCalibrate = payload.flow_calibrate
    state.shaperCalibrate = payload.shaper_calibrate
  },

  resetFilamentState (state: FilamentState) {
    Object.assign(state, getDefaultState())
  }
}

export const actions = {
  async fetchFilamentData ({ commit }: any) {
    try {
      const { httpClientActions } = await import('@/api/httpClientActions')
      const response = await httpClientActions.serverFilesGetPrintTask()
      if (response.data) {
        commit('setFilamentData', response.data)
      }
    } catch (error) {
      console.error('Failed to fetch filament data:', error)
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
