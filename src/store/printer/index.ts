import type { Module } from 'vuex'
import { state } from './state'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import { filaments } from './filaments'
import type { PrinterState } from './types'
import type { RootState } from '../types'

const namespaced = true

export const printer = {
  namespaced,
  state,
  getters,
  actions,
  mutations,
  modules: {
    filaments
  }
} satisfies Module<PrinterState, RootState>
