import type { GetterTree } from 'vuex'
import type { PrintJobState } from './types'
import type { RootState } from '@/store/types'
import { validateMappings } from '@/util/filamentMapper'

export const getters: GetterTree<PrintJobState, RootState> = {
  isValid: (state): boolean => {
    return validateMappings(state.mappings)
  },

  hasMetadata: (state): boolean => {
    return state.gcodeMetadata?.hasMetadata ?? false
  },

  canStartPrint: (state, getters): boolean => {
    return !state.isLoading && getters.isValid && state.currentFile !== null
  }
}
