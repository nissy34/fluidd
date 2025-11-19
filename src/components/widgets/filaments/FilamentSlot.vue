<template>
  <v-card
    class="filament-slot"
    :class="{
      'filament-slot--empty': filamentState === 'empty',
      'filament-slot--not-loaded': filamentState === 'not-loaded',
      'filament-slot--loaded': filamentState === 'loaded'
    }"
    elevation="2"
  >
    <v-card-text class="pa-4 text-center">
      <!-- Slot Number Badge -->
      <div class="slot-number mb-3">
        <v-avatar
          size="60"
          color="transparent"
          :style="filamentSlot.exists ? { border: `3px solid #${filamentSlot.colorRgba.slice(0, 6)}` } : { border: '3px solid #E0E0E0' }"
        >
          <v-avatar
            size="52"
            :color="filamentSlot.exists ? `#${filamentSlot.colorRgba.slice(0, 6)}` : 'transparent'"
            :style="!filamentSlot.exists ? { border: '2px solid #E0E0E0' } : {}"
          >
            <span
              class="text-h6 font-weight-bold"
              :class="filamentSlot.exists ? 'white--text' : 'grey--text'"
            >
              {{ filamentSlot.index + 1 }}
            </span>
          </v-avatar>
        </v-avatar>
      </div>

      <!-- Material Type Badge -->
      <div class="material-type mb-2">
        <v-chip
          small
          :color="filamentSlot.exists ? 'grey darken-2' : 'grey lighten-1'"
          :text-color="filamentSlot.exists ? 'white' : 'grey darken-1'"
        >
          {{ filamentSlot.exists ? (filamentSlot.type || 'N/A') : '/' }}
        </v-chip>
      </div>

      <!-- Manufacturer Info (only when loaded) -->
      <div
        v-if="filamentSlot.exists"
        class="manufacturer mb-1"
      >
        <div class="text-body-2 font-weight-medium">
          {{ formattedDisplay }}
        </div>
      </div>
      <div
        v-else
        class="manufacturer mb-1"
      >
        <div class="text-body-2 grey--text text--lighten-1">
          —
        </div>
      </div>

      <!-- Status Indicator -->
      <div class="status-indicator mt-2">
        <v-icon
          small
          :color="statusColor"
        >
          {{ statusIcon }}
        </v-icon>
        <span
          class="text-caption ml-1 status-badge"
          :class="`status-badge--${filamentState}`"
        >
          {{ statusLabel }}
        </span>
      </div>

      <!-- Edit Button -->
      <v-btn
        v-if="filamentSlot.exists && filamentSlot.editable"
        x-small
        text
        class="mt-2"
        @click="handleEdit"
      >
        <v-icon
          x-small
          left
        >
          $edit
        </v-icon>
        {{ $t('app.general.btn.edit') }}
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import type { FilamentSlot as FilamentSlotType } from '@/store/printer/filaments/types'
import type { RunoutSensor } from '@/store/printer/types'
import { formatFilamentSlot } from '@/constants/filamentDatabase'

type FilamentState = 'empty' | 'not-loaded' | 'loaded'

@Component({})
export default class FilamentSlot extends Vue {
  @Prop({ type: Object, required: true })
  readonly filamentSlot!: FilamentSlotType

  get formattedDisplay (): string {
    return formatFilamentSlot(
      this.filamentSlot.vendor,
      this.filamentSlot.subType,
      this.filamentSlot.type
    )
  }

  get runoutSensor (): RunoutSensor | undefined {
    const sensors = this.$typedGetters['printer/getRunoutSensors'] as RunoutSensor[]
    const sensorName = `e${this.filamentSlot.index}_filament`
    const found = sensors.find(sensor => sensor.name === sensorName)

    // Debug: log if sensor not found
    if (!found && this.filamentSlot.exists) {
      console.debug(`FilamentSlot ${this.filamentSlot.index}: Sensor '${sensorName}' not found. Available sensors:`, sensors.map(s => s.name))
    }

    return found
  }

  get filamentState (): FilamentState {
    if (!this.filamentSlot.exists) {
      return 'empty'
    }

    const sensor = this.runoutSensor
    // Check if sensor exists and filament is detected
    if (sensor) {
      // Explicitly check for true - undefined/null/false all mean not loaded
      if (sensor.filament_detected === true) {
        return 'loaded'
      }
      // Sensor exists but doesn't detect filament (false, null, or undefined)
      return 'not-loaded'
    }

    // If sensor not found but filament exists, assume not loaded
    // (filament is in feeder but not detected by sensor)
    return 'not-loaded'
  }

  get statusLabel (): string {
    switch (this.filamentState) {
      case 'empty':
        return this.$t('app.general.label.empty') as string
      case 'not-loaded':
        return this.$t('app.general.label.not_loaded') as string
      case 'loaded':
        return this.$t('app.general.label.loaded') as string
      default:
        return this.$t('app.general.label.empty') as string
    }
  }

  get statusIcon (): string {
    switch (this.filamentState) {
      case 'empty':
        return 'mdi-circle-outline'
      case 'not-loaded':
        return 'mdi-alert-circle'
      case 'loaded':
        return 'mdi-check-circle'
      default:
        return 'mdi-circle-outline'
    }
  }

  get statusColor (): string {
    switch (this.filamentState) {
      case 'empty':
        return 'grey'
      case 'not-loaded':
        return 'info'
      case 'loaded':
        return 'success'
      default:
        return 'grey'
    }
  }

  handleEdit () {
    this.$emit('edit', this.filamentSlot)
  }
}
</script>

<style lang="scss" scoped>
.filament-slot {
  transition: all 0.3s ease;
  min-height: 240px;
  display: flex;
  flex-direction: column;

  &:hover:not(.filament-slot--empty) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  }

  &--empty {
    opacity: 0.6;
    border: 2px dashed rgba(0, 0, 0, 0.12);
  }

}

.slot-number {
  position: relative;
}

.material-type {
  display: flex;
  justify-content: center;
}

.manufacturer {
  min-height: 48px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.status-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 500;

  &--empty {
    background-color: rgba(158, 158, 158, 0.2);
    color: rgba(158, 158, 158, 0.9);
  }

  &--not-loaded {
    background-color: rgba(33, 150, 243, 0.2);
    color: rgba(33, 150, 243, 0.9);
  }

  &--loaded {
    background-color: rgba(76, 175, 80, 0.2);
    color: rgba(76, 175, 80, 0.9);
  }
}
</style>
