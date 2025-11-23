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
      <!-- Tube Fill - shows filament when loaded -->
      <div
        v-if="filamentState === 'loaded' && filamentSlot.exists"
        class="tube-fill"
        :style="getTubeFillStyle()"
      >
        <div class="tube-fill__filament" />
        <div class="tube-fill__highlight" />
      </div>
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

      <!-- Edit Icon -->
      <div
        v-if="filamentSlot.exists && filamentSlot.editable"
        class="edit-icon-container"
      >
        <v-icon
          color="grey darken-1"
          @click="handleEdit"
        >
          $edit
        </v-icon>
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

  getTubeFillStyle () {
    if (!this.filamentSlot.exists || !this.filamentSlot.colorRgba) {
      return {}
    }
    const color = `#${this.filamentSlot.colorRgba.slice(0, 6)}`
    // Create a darker shade for the gradient base
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    const darkerR = Math.max(0, r - 30)
    const darkerG = Math.max(0, g - 30)
    const darkerB = Math.max(0, b - 30)
    const darkerColor = `rgb(${darkerR}, ${darkerG}, ${darkerB})`

    return {
      '--filament-color': color,
      '--filament-color-dark': darkerColor
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

// Tube Fill - positioned at top of SVG to show filament inside tube, extending below extruder
.tube-fill {
  position: absolute;
  top: 0; // Start at top of container (tube location)
  left: 50%; // Center horizontally (tube is at x=32 in 64-unit viewBox = 50%)
  transform: translateX(-50%); // Center the element itself
  width: 18px; // Filament width (closer to tube width of 18.75px)
  height: 180px; // Long filament extending well below extruder
  border: 0.5px solid rgba(129, 129, 129, 0.6); // Tube border (only visible at top)
  // border-radius: 2px;
  background: rgba(255, 255, 255, 0.05); // Slight glass-like background
  box-shadow:
    inset 0 0 2px rgba(0, 0, 0, 0.2),
    0 0 1px rgba(129, 129, 129, 0.3);
  overflow: visible; // Allow filament to extend beyond container
  box-sizing: border-box;
  z-index: -1; // Behind the extruder (extruder is z-index: 2)

  // Filament strand - starts at tube top, extends down below extruder
  &__filament {
    position: absolute;
    top: 0.5px;
    left: 4px; // Narrower: inset from sides
    right: 4px; // Narrower: inset from sides
    bottom: 0; // Extends to bottom of container
    border-radius: 1.5px;
    // Base filament color with gradient for cylindrical effect and vertical fade
    background: linear-gradient(
        to right,
        var(--filament-color-dark) 0%,
        var(--filament-color) 30%,
        var(--filament-color) 70%,
        var(--filament-color-dark) 100%
      ),
      linear-gradient(
        to bottom,
        var(--filament-color) 0%,
        var(--filament-color) 50%,
        var(--filament-color) 70%,
        transparent 100%
      );
    // Add depth with shadows for cylindrical look
    box-shadow:
      inset -0.5px 0 1px rgba(0, 0, 0, 0.4),
      inset 0.5px 0 1px rgba(255, 255, 255, 0.25),
      inset 0 1px 1px rgba(255, 255, 255, 0.1);
    z-index: -2;
  }

  // Highlight on top for 3D effect (only in tube area)
  &__highlight {
    position: absolute;
    top: 0.5px;
    left: 0.5px;
    right: 0.5px;
    height: 15px; // Only highlight the tube area at the top
    border-radius: 1.5px 1.5px 0 0;
    background: linear-gradient(
      to bottom,
      rgba(255, 255, 255, 0.3) 0%,
      rgba(255, 255, 255, 0) 100%
    );
    pointer-events: none;
    z-index: -1;
  }
}

// Edit Icon - positioned between material badge and manufacturer info
.edit-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
  margin-top: 2px;
  cursor: pointer;
  width: 100%;
  opacity: 0.7;
  transition: opacity 0.2s ease;
  flex-shrink: 0;

  &:hover {
    opacity: 1;
  }

  ::v-deep .v-icon {
    font-size: 22px;
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
</style>
