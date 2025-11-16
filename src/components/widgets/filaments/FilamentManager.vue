<template>
  <collapsable-card
    :title="$t('app.general.label.filaments')"
    icon="$filament"
    draggable
    layout-path="dashboard.filament-card"
  >
    <template #menu>
      <app-btn
        small
        class="me-1 my-1"
        @click="refreshFilamentData"
      >
        <v-icon
          small
          left
        >
          $refresh
        </v-icon>
        {{ $t('app.general.btn.refresh') }}
      </app-btn>
    </template>

    <v-card-text>
      <v-container
        v-if="filamentSlots.length > 0"
        fluid
      >
        <v-row>
          <v-col
            v-for="slot in filamentSlots"
            :key="slot.index"
            cols="12"
            sm="6"
            md="3"
          >
            <filament-slot :filament-slot="slot" />
          </v-col>
        </v-row>

        <!-- Additional Info -->
        <v-row class="mt-2">
          <v-col cols="12">
            <v-divider class="mb-3" />
            <div class="text-caption grey--text">
              <v-row dense>
                <v-col
                  cols="12"
                  sm="6"
                  md="3"
                >
                  <v-icon
                    x-small
                    left
                    :color="autoReplenishFilament ? 'success' : 'grey'"
                  >
                    {{ autoReplenishFilament ? 'mdi-check-circle' : 'mdi-circle-outline' }}
                  </v-icon>
                  {{ $t('app.general.label.auto_replenish') }}
                </v-col>
                <v-col
                  cols="12"
                  sm="6"
                  md="3"
                >
                  <v-icon
                    x-small
                    left
                    :color="filamentEntangleDetect ? 'success' : 'grey'"
                  >
                    {{ filamentEntangleDetect ? 'mdi-check-circle' : 'mdi-circle-outline' }}
                  </v-icon>
                  {{ $t('app.general.label.entangle_detect') }}
                </v-col>
                <v-col
                  cols="12"
                  sm="6"
                  md="3"
                >
                  <span class="font-weight-medium">{{ $t('app.general.label.loaded') }}:</span>
                  {{ loadedSlotsCount }} / {{ filamentSlots.length }}
                </v-col>
              </v-row>
            </div>
          </v-col>
        </v-row>
      </v-container>

      <!-- Empty State -->
      <v-container
        v-else
        fluid
        class="text-center py-8"
      >
        <v-icon
          size="64"
          color="grey lighten-1"
        >
          $filament
        </v-icon>
        <div class="text-body-1 grey--text mt-3">
          {{ $t('app.general.msg.no_filaments') }}
        </div>
      </v-container>
    </v-card-text>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import FilamentSlot from './FilamentSlot.vue'
import type { FilamentSlot as FilamentSlotType } from '@/store/printer/filaments/types'

@Component({
  components: {
    FilamentSlot
  }
})
export default class FilamentManager extends Vue {
  private refreshInterval: number | null = null

  get filamentSlots (): FilamentSlotType[] {
    return this.$store.getters['printer/filaments/getSlots'] || []
  }

  get loadedSlotsCount (): number {
    return this.$store.getters['printer/filaments/getLoadedSlots']?.length || 0
  }

  get autoReplenishFilament (): boolean {
    return this.$store.state.printer?.filaments?.autoReplenishFilament || false
  }

  get filamentEntangleDetect (): boolean {
    return this.$store.state.printer?.filaments?.filamentEntangleDetect || false
  }

  mounted () {
    // Load filament data from API
    this.$store.dispatch('printer/filaments/fetchFilamentData')

    // Set up auto-refresh every 5 seconds
    this.refreshInterval = window.setInterval(() => {
      this.$store.dispatch('printer/filaments/fetchFilamentData')
    }, 10000)
  }

  beforeDestroy () {
    // Clean up interval when component is destroyed
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
    }
  }

  refreshFilamentData () {
    this.$store.dispatch('printer/filaments/fetchFilamentData')
  }
}
</script>

<style lang="scss" scoped>
// Additional styles if needed
</style>
