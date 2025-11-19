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
    <!-- SVG Background -->
    <div class="extruder-svg-container">
      <img
        src="/img/filaments/extruderBackground.svg"
        alt="Extruder"
        class="extruder-svg"
      >
    </div>

    <!-- Content Overlay -->
    <v-card-text class="content-overlay pa-0 text-center d-flex flex-column">
      <!-- Slot Number Badge -->
      <div class="slot-number">
        <v-avatar
          size="42"
          :color="filamentSlot.exists ? `#${filamentSlot.colorRgba.slice(0, 6)}` : '#E0E0E0'"
        >
          <span
            class="text-body-1 font-weight-bold white--text"
          >
            {{ filamentSlot.index + 1 }}
          </span>
        </v-avatar>
      </div>

      <!-- Material Type Badge -->
      <div class="material-type">
        <div class="material-badge">
          {{ filamentSlot.exists ? (filamentSlot.type || 'N/A') : '/' }}
        </div>
      </div>

      <!-- Manufacturer Info -->
      <div
        v-if="filamentSlot.exists"
        class="manufacturer"
      >
        <div class="manufacturer-text">
          {{ formattedDisplay }}
        </div>
      </div>
      <div
        v-else
        class="manufacturer"
      >
        <div class="manufacturer-text empty">
          —
        </div>
      </div>

      <!-- Status Section (Edit Icon + Status Badge) -->
      <div class="status-section">
        <!-- Edit Icon (above status) -->
        <div
          v-if="filamentSlot.exists && filamentSlot.editable"
          class="edit-icon-container"
        >
          <v-icon
            small
            color="grey darken-1"
            @click="handleEdit"
          >
            $edit
          </v-icon>
        </div>

        <!-- Status Indicator -->
        <div class="status-indicator">
          <span
            class="status-badge"
            :class="`status-badge--${filamentState}`"
          >
            {{ statusLabel }}
          </span>
        </div>
      </div>
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
  min-height: 220px;
  width: 100px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  background: transparent;
  border-radius: 8px;
  align-items: center;

  &:hover:not(.filament-slot--empty) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
  }

  &--empty {
    opacity: 0.6;
  }

  ::v-deep .v-card__text {
    padding: 0;
  }
}

// SVG Container
.extruder-svg-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100px;
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 0;
}

.extruder-svg {
  width: 100px;
  height: 220px;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

// Content Overlay
.content-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  width: 100px;
  height: 220px;
  padding: 32px 10px 24px 10px !important;
  justify-content: flex-start;
  overflow: hidden;
  box-sizing: border-box;
}

// Slot Number Badge - upper third
.slot-number {
  display: flex;
  justify-content: center;
  margin-top: 6px;
  margin-bottom: 6px;
  flex-shrink: 0;
  width: 100%;
  max-width: 100%;
}

// Material Type Badge - middle
.material-type {
  display: flex;
  justify-content: center;
  margin-bottom: 6px;
  flex-shrink: 0;
  width: 100%;
  max-width: 100%;
}

.material-badge {
  background-color: #616161;
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  line-height: 1.2;
  max-width: 100%;
  box-sizing: border-box;
}

// Manufacturer Info
.manufacturer {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 24px;
  margin-bottom: 4px;
  padding: 0 2px;
  flex-shrink: 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.manufacturer-text {
  font-size: 0.75rem;
  font-weight: 500;
  color: white;
  line-height: 1.2;
  word-break: break-word;
  padding: 2px 4px;
  border-radius: 4px;
  max-width: 100%;
  box-sizing: border-box;
  overflow-wrap: break-word;

  &.empty {
    color: rgba(255, 255, 255, 0.5);
  }
}

// Status Section - always at bottom
.status-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  margin-top: auto;
  flex-shrink: 0;
  width: 100%;
  max-width: 100%;
}

// Edit Icon - above status badge
.edit-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
  cursor: pointer;
  z-index: 2;
  opacity: 0.7;
  transition: opacity 0.2s ease;
  flex-shrink: 0;
  width: 100%;
  max-width: 100%;

  &:hover {
    opacity: 1;
  }

  ::v-deep .v-icon {
    font-size: 16px;
  }
}

// Status Indicator
.status-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 0;
  padding-bottom: 0;
  flex-shrink: 0;
  width: 100%;
  max-width: 100%;
}

.status-badge {
  padding: 3px 8px;
  border-radius: 12px;
  font-weight: 500;
  font-size: 0.65rem;
  text-transform: capitalize;
  line-height: 1.2;
  max-width: 100%;
  box-sizing: border-box;

  &--empty {
    background-color: rgba(158, 158, 158, 0.4);
    color: white;
  }

  &--not-loaded {
    background-color: rgba(33, 150, 243, 0.4);
    color: white;
  }

  &--loaded {
    background-color: #4CAF50;
    color: white;
  }
}

// Mobile responsive adjustments
@media (max-width: 960px) {
  .filament-slot {
    width: 90px;
    min-height: 220px;
  }

  .extruder-svg-container {
    width: 90px;
    height: 220px;
  }

  .extruder-svg {
    width: 90px;
    height: 220px;
  }

  .content-overlay {
    width: 90px;
    height: 220px;
    padding: 32px 8px 24px 8px !important;
  }

  .slot-number {
    margin-top: 14px;
    margin-bottom: 6px;

    ::v-deep .v-avatar {
      width: 38px !important;
      height: 38px !important;
    }
  }

  .material-type {
    margin-bottom: 6px;
  }

  .manufacturer {
    margin-bottom: 4px;
    min-height: 24px;
  }

  .material-badge {
    font-size: 0.7rem;
    padding: 4px 8px;
  }

  .manufacturer-text {
    font-size: 0.75rem;
  }

  .status-badge {
    font-size: 0.7rem;
    padding: 4px 8px;
  }

  .edit-icon-container {
    margin-bottom: 4px;

    ::v-deep .v-icon {
      font-size: 16px;
    }
  }
}
</style>
