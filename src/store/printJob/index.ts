import type { Module } from 'vuex'
import { defaultState } from './state'
import { getters } from './getters'
import { mutations } from './mutations'
import { actions } from './actions'
import type { PrintJobState } from './types'
import type { RootState } from '../types'

export const printJob: Module<PrintJobState, RootState> = {
  namespaced: true,
  state: defaultState(),
  getters,
  mutations,
  actions
}
