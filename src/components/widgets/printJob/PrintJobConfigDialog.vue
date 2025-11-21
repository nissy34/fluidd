<template>
  <v-dialog
    v-model="dialogOpen"
    max-width="900"
    scrollable
    persistent
  >
    <v-card>
      <v-card-title class="headline">
        <v-icon left>
          $cog
        </v-icon>
        {{ $t('app.general.title.configure_print_job') }}
      </v-card-title>

      <v-divider />

      <v-card-text style="max-height: 600px;">
        <v-alert
          v-if="!hasMetadata"
          type="warning"
          text
          dense
          class="mb-4"
        >
          {{ $t('app.general.msg.no_filament_metadata') }}
        </v-alert>

        <v-progress-linear
          v-if="isLoading"
          indeterminate
          color="primary"
          class="mb-4"
        />

        <div v-if="!isLoading && currentFile">
          <!-- Model Info Section -->
          <v-card
            outlined
            class="mb-4"
          >
            <v-card-subtitle class="pb-2">
              {{ $t('app.gcode.msg.model_info') }}
            </v-card-subtitle>
            <v-card-text>
              <v-row>
                <!-- Thumbnail -->
                <v-col
                  cols="auto"
                  class="d-flex align-center"
                >
                  <v-sheet
                    v-if="!thumbnail"
                    color="grey darken-3"
                    rounded
                    width="120"
                    height="120"
                    class="d-flex align-center justify-center"
                  >
                    <v-icon
                      size="64"
                      color="grey"
                    >
                      $file
                    </v-icon>
                  </v-sheet>
                  <v-img
                    v-else
                    :src="thumbnail"
                    width="120"
                    height="120"
                    contain
                    rounded
                  />
                </v-col>

                <!-- Metadata -->
                <v-col>
                  <div class="mb-2">
                    <span class="text-caption grey--text">{{ $t('app.general.label.file') }}:</span>
                    <div class="text-body-1">
                      {{ currentFile.filename.split('/').pop() }}
                    </div>
                  </div>

                  <div
                    v-if="hasFileMetadata && currentFile.estimated_time"
                    class="mb-2"
                  >
                    <span class="text-caption grey--text">{{ $t('app.general.label.estimated_time') }}:</span>
                    <div class="text-body-1">
                      {{ formatTime(currentFile.estimated_time) }}
                    </div>
                  </div>

                  <div
                    v-if="hasFileMetadata && currentFile.filament_weight_total"
                    class="mb-2"
                  >
                    <span class="text-caption grey--text">{{ $t('app.gcode.msg.filament_usage') }}:</span>
                    <div class="text-body-1">
                      {{ currentFile.filament_weight_total.toFixed(2) }} g
                    </div>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Filament Mapping Section -->
          <div class="mb-6">
            <h3 class="subtitle-1 mb-3">
              {{ $t('app.general.title.filament_mapping') }}
            </h3>

            <div class="filament-mapping-container">
              <filament-mapping-row
                v-for="mapping in mappings"
                :key="`${mapping.gcodeExtruderIndex}-${mapping.printerSlotIndex}`"
                :mapping="mapping"
                :gcode-extruder="getGcodeExtruder(mapping.gcodeExtruderIndex)"
                :printer-slots="printerSlots"
                @update="handleMappingUpdate"
              />
            </div>
          </div>

          <!-- Print Settings Section -->
          <print-settings-panel
            :settings="settings"
            @update="handleSettingsUpdate"
          />
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn
          text
          @click="handleCancel"
        >
          {{ $t('app.general.btn.cancel') }}
        </v-btn>
        <v-btn
          color="primary"
          :disabled="!canStartPrint"
          :loading="isLoading"
          @click="handleStartPrint"
        >
          <v-icon
            left
            small
          >
            $printer
          </v-icon>
          {{ $t('app.general.btn.start_print') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import FilamentMappingRow from './FilamentMappingRow.vue'
import PrintSettingsPanel from './PrintSettingsPanel.vue'
import type { ExtruderMetadata } from '@/util/parseFilamentMetadata'
import type { FilamentMapping } from '@/util/filamentMapper'
import type { FilamentSlot } from '@/store/printer/filaments/types'
import type { PrintJobSettings } from '@/store/printJob/types'

@Component({
  components: {
    FilamentMappingRow,
    PrintSettingsPanel
  }
})
export default class PrintJobConfigDialog extends Vue {
  get dialogOpen (): boolean {
    return this.$store.state.printJob?.dialogOpen ?? false
  }

  set dialogOpen (value: boolean) {
    if (!value) {
      this.$store.dispatch('printJob/closeDialog')
    }
  }

  get currentFile () {
    return this.$store.state.printJob?.currentFile
  }

  get hasFileMetadata (): boolean {
    const file = this.currentFile
    return !!(file && 'estimated_time' in file)
  }

  get isLoading (): boolean {
    return this.$store.state.printJob?.isLoading ?? false
  }

  get hasMetadata (): boolean {
    return this.$store.getters['printJob/hasMetadata']
  }

  get gcodeMetadata () {
    return this.$store.state.printJob?.gcodeMetadata
  }

  get mappings (): FilamentMapping[] {
    return this.$store.state.printJob?.mappings ?? []
  }

  get settings (): PrintJobSettings {
    return this.$store.state.printJob?.settings ?? {
      autoBedLeveling: false,
      flowCalibrate: false,
      timeLapseCamera: false
    }
  }

  get printerSlots (): FilamentSlot[] {
    return this.$store.state.printer?.filaments?.slots ?? []
  }

  get canStartPrint (): boolean {
    return this.$store.getters['printJob/canStartPrint']
  }

  get thumbnail (): string | null {
    const file = this.currentFile
    if (!file?.thumbnails || file.thumbnails.length === 0) {
      return null
    }

    // Find the largest thumbnail (preferably >= 120x120)
    const sorted = [...file.thumbnails].sort((a, b) =>
      (b.width * b.height) - (a.width * a.height)
    )

    // Use Moonraker's API endpoint for thumbnails
    const thumbnail = sorted[0]
    const apiUrl = this.$store.state.config?.apiUrl || ''
    return `${apiUrl}/server/files/gcodes/${thumbnail.relative_path}`
  }

  getGcodeExtruder (index: number): ExtruderMetadata | null {
    const metadata = this.$store.state.printJob?.gcodeMetadata
    return metadata?.extruders.find((e: ExtruderMetadata) => e.index === index) ?? null
  }

  handleMappingUpdate (payload: { gcodeExtruderIndex: number, printerSlotIndex: number | null }) {
    this.$store.dispatch('printJob/updateMapping', payload)
  }

  handleSettingsUpdate (settings: Partial<PrintJobSettings>) {
    this.$store.dispatch('printJob/updateSettings', settings)
  }

  handleCancel () {
    this.$store.dispatch('printJob/closeDialog')
  }

  handleStartPrint () {
    this.$store.dispatch('printJob/startPrint')
  }

  formatTime (seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }
}
</script>

<style scoped>
.filament-mapping-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
}
</style>
