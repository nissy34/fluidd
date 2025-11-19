<template>
  <div>
    <collapsable-card
      :title="$t('app.general.label.filaments')"
      icon="$filament"
      draggable
      layout-path="dashboard.filament-manager"
    >
      <template #menu>
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <app-btn
              v-bind="attrs"
              small
              icon
              class="me-1 my-1"
              @click="refreshFilamentData"
              v-on="on"
            >
              <v-icon small>
                $refresh
              </v-icon>
            </app-btn>
          </template>
          <span>{{ $t('app.general.btn.refresh') }}</span>
        </v-tooltip>
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
              <filament-slot
                :filament-slot="slot"
                @edit="handleEditSlot"
              />
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

    <!-- Edit Dialog -->
    <filament-edit-dialog
      :open.sync="editDialogOpen"
      :filament-slot="selectedSlot"
      @save="handleSaveFilament"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import FilamentSlot from './FilamentSlot.vue'
import FilamentEditDialog, { type FilamentConfig } from './FilamentEditDialog.vue'
import type { FilamentSlot as FilamentSlotType } from '@/store/printer/filaments/types'
import { SocketActions } from '@/api/socketActions'
import { consola } from 'consola'

@Component({
  components: {
    FilamentSlot,
    FilamentEditDialog
  }
})
export default class FilamentManager extends Vue {
  private refreshInterval: number | null = null
  editDialogOpen = false
  selectedSlot: FilamentSlotType | null = null

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
    // Query print_task_config data via WebSocket
    this.refreshFilamentData()

    // Set up auto-refresh every 10 seconds
    this.refreshInterval = window.setInterval(() => {
      this.refreshFilamentData()
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
    SocketActions.printerObjectsQuery({ print_task_config: null })
  }

  handleEditSlot (slot: FilamentSlotType) {
    this.selectedSlot = slot
    this.editDialogOpen = true
  }

  handleSaveFilament (config: FilamentConfig) {
    // Build G-code command
    const script = `SET_PRINT_FILAMENT_CONFIG CONFIG_EXTRUDER='${config.slotIndex}' FILAMENT_TYPE='${config.material}' FILAMENT_SUBTYPE='${config.subType}' SAVE='1' VENDOR='${config.vendor}' FILAMENT_COLOR_RGBA='${config.colorRgba}'`

    consola.info('Saving filament configuration:', config)
    SocketActions.printerGcodeScript(script)

    // Close dialog
    this.editDialogOpen = false

    // Refresh data after a short delay
    setTimeout(() => {
      this.refreshFilamentData()
    }, 500)
  }
}
</script>

<style
  lang="scss"
  scoped
>
  // Additional styles if needed
</style>
