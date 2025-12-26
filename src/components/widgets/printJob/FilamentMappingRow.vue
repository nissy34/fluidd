<template>
  <v-menu
    offset-y
    :close-on-content-click="true"
  >
    <template #activator="{ on, attrs }">
      <v-card
        v-bind="attrs"
        outlined
        class="filament-card"
        :class="{ 'filament-card-hover': true }"
        v-on="on"
      >
        <!-- Colored Bar with Material Type -->
        <div
          class="filament-bar"
          :style="{ backgroundColor: barColor }"
        >
          <span class="filament-type-text">
            {{ materialType }}
          </span>
        </div>

        <!-- Material Weight -->
        <div
          v-if="materialWeight"
          class="filament-weight"
        >
          {{ materialWeight }}
        </div>

        <!-- Slot Number Circle -->
        <div class="filament-content">
          <div
            class="slot-circle"
            :class="{ 'slot-circle-error': hasNoCompatibleFilament }"
            :style="{ backgroundColor: hasNoCompatibleFilament ? '#f44336' : circleColor }"
          >
            <v-icon
              v-if="hasNoCompatibleFilament"
              color="white"
              size="32"
            >
              $warning
            </v-icon>
            <span
              v-else
              class="slot-number"
            >
              {{ slotNumber }}
            </span>
          </div>
        </div>

        <!-- Chevron Icon -->
        <div class="filament-chevron">
          <v-icon
            small
            color="grey"
          >
            $chevronDown
          </v-icon>
        </div>
      </v-card>
    </template>

    <v-list>
      <v-list-item
        v-for="item in slotItems"
        :key="item.value"
        :disabled="!item.isCompatible"
        :class="{ 'incompatible-item': !item.isCompatible }"
        @click="handleChange(item.value, item.isCompatible)"
      >
        <v-list-item-icon>
          <div
            v-if="item.color"
            class="color-chip-small"
            :style="{ backgroundColor: item.color }"
          />
          <div
            v-else
            class="color-chip-small-empty"
          />
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>{{ item.text }}</v-list-item-title>
          <v-list-item-subtitle
            v-if="item.details"
          >
            {{ item.details }}
          </v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-action>
          <v-icon
            v-if="mapping.printerSlotIndex === item.value"
            color="primary"
          >
            $check
          </v-icon>
          <v-icon
            v-else-if="!item.isCompatible"
            color="warning"
            small
          >
            $warning
          </v-icon>
        </v-list-item-action>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import type { ExtruderMetadata } from '@/util/parseFilamentMetadata'
import type { FilamentMapping } from '@/util/filamentMapper'
import type { FilamentSlot } from '@/store/printer/filaments/types'
import { rgbaToHex } from '@/util/parseFilamentMetadata'
import { materialsMatch } from '@/util/filamentMapper'

interface SlotItem {
  value: number | null
  text: string
  color: string | null
  details: string | null
  isCompatible: boolean
}

@Component({})
export default class FilamentMappingRow extends Vue {
  @Prop({ type: Object, required: true })
  readonly mapping!: FilamentMapping

  @Prop({ type: Object, default: null })
  readonly gcodeExtruder!: ExtruderMetadata | null

  @Prop({ type: Array, required: true })
  readonly printerSlots!: FilamentSlot[]

  get slotItems (): SlotItem[] {
    const items: SlotItem[] = []
    const gcodeMaterial = this.gcodeExtruder?.type || null
    const hasGcodeMaterial = !!gcodeMaterial

    // Add available printer slots (1-based display)
    for (let i = 0; i < this.printerSlots.length; i++) {
      const slot = this.printerSlots[i]
      if (slot.exists) {
        // Only check compatibility if G-code material is known
        // If unknown, allow all slots (treat as compatible)
        const isCompatible = hasGcodeMaterial ? materialsMatch(slot.type, gcodeMaterial) : true
        items.push({
          value: i,
          text: `${this.$t('app.general.label.slot')} ${i + 1}`,
          color: slot.colorRgba ? rgbaToHex(slot.colorRgba) : null,
          details: slot.vendor && slot.type
            ? `${slot.vendor} ${slot.type}${slot.subType && slot.subType.trim() ? ` ${slot.subType}` : ''}`
            : slot.type,
          isCompatible
        })
      }
    }

    return items
  }

  get hasNoCompatibleFilament (): boolean {
    if (!this.gcodeExtruder?.type) return false
    return !this.slotItems.some(item => item.isCompatible)
  }

  get materialType (): string {
    if (this.gcodeExtruder && this.gcodeExtruder.type) {
      return this.gcodeExtruder.type
    }
    return this.$t('app.general.label.unknown_material') as string
  }

  get selectedSlot (): FilamentSlot | null {
    const slotIndex = this.mapping.printerSlotIndex
    if (slotIndex !== null && slotIndex !== undefined && slotIndex >= 0) {
      const slot = this.printerSlots[slotIndex]
      if (slot && slot.exists) {
        return slot
      }
    }
    return null
  }

  get barColor (): string {
    // Top bar uses gcode extruder color (from the model)
    return this.gcodeExtruder?.color || '#FFC107'
  }

  get circleColor (): string {
    // Circle uses selected printer slot color
    const slot = this.selectedSlot
    if (slot?.colorRgba) {
      return rgbaToHex(slot.colorRgba)
    }
    return this.gcodeExtruder?.color || '#FFC107'
  }

  get slotNumber (): string {
    if (this.mapping.printerSlotIndex !== null && this.mapping.printerSlotIndex !== undefined) {
      return String(this.mapping.printerSlotIndex + 1) // Convert to 1-based
    }
    return '?'
  }

  get materialWeight (): string | null {
    if (this.gcodeExtruder && this.gcodeExtruder.usageGrams !== null && this.gcodeExtruder.usageGrams !== undefined) {
      return `${this.gcodeExtruder.usageGrams.toFixed(2)}g`
    }
    return null
  }

  handleChange (value: number | null, isCompatible: boolean = true) {
    // Prevent selecting incompatible materials
    if (!isCompatible) {
      return
    }
    this.$emit('update', {
      gcodeExtruderIndex: this.mapping.gcodeExtruderIndex,
      printerSlotIndex: value
    })
  }
}
</script>

<style scoped>
.filament-card {
  width: 120px;
  min-height: 120px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.filament-card-hover:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.filament-bar {
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
}

.filament-type-text {
  color: white;
  font-weight: 700;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5), 0 1px 2px rgba(0, 0, 0, 0.7);
}

.filament-weight {
  padding: 6px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.filament-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
}

.slot-circle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.slot-circle-error {
  background-color: #f44336 !important;
}

.slot-number {
  color: white;
  font-size: 24px;
  font-weight: 700;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6), 0 1px 3px rgba(0, 0, 0, 0.8);
}

.filament-chevron {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.color-chip-small {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.color-chip-small-empty {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px dashed rgba(0, 0, 0, 0.2);
  background: transparent;
  flex-shrink: 0;
}

.incompatible-item {
  color: #ff9800 !important;
}

.incompatible-item .v-list-item__title,
.incompatible-item .v-list-item__subtitle {
  color: #ff9800 !important;
}
</style>
