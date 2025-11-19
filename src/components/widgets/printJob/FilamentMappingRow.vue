<template>
  <v-card
    outlined
    class="mb-3"
  >
    <v-card-text>
      <v-row align="center">
        <!-- G-code Extruder Info -->
        <v-col
          cols="12"
          md="5"
        >
          <div class="d-flex align-center">
            <div
              v-if="gcodeExtruder && gcodeExtruder.color"
              class="color-chip mr-3"
              :style="{ backgroundColor: gcodeExtruder.color }"
            />
            <div
              v-else
              class="color-chip-empty mr-3"
            />
            <div>
              <div class="subtitle-2">
                {{ $t('app.general.label.gcode_extruder') }} {{ mapping.gcodeExtruderIndex }}
              </div>
              <div class="caption text--secondary">
                <span v-if="gcodeExtruder && gcodeExtruder.type">
                  {{ gcodeExtruder.type }}
                </span>
                <span v-else>
                  {{ $t('app.general.label.unknown_material') }}
                </span>
              </div>
            </div>
          </div>
        </v-col>

        <!-- Arrow -->
        <v-col
          cols="12"
          md="1"
          class="text-center"
        >
          <v-icon>$right</v-icon>
        </v-col>

        <!-- Printer Slot Selector -->
        <v-col
          cols="12"
          md="6"
        >
          <v-select
            :value="mapping.printerSlotIndex"
            :items="slotItems"
            :label="$t('app.general.label.printer_slot')"
            outlined
            dense
            hide-details
            @change="handleChange"
          >
            <template #selection="{ item }">
              <div class="d-flex align-center">
                <div
                  v-if="item.color"
                  class="color-chip-small mr-2"
                  :style="{ backgroundColor: item.color }"
                />
                <span>{{ item.text }}</span>
              </div>
            </template>
            <template #item="{ item }">
              <div class="d-flex align-center py-1">
                <div
                  v-if="item.color"
                  class="color-chip-small mr-3"
                  :style="{ backgroundColor: item.color }"
                />
                <div>
                  <div>{{ item.text }}</div>
                  <div
                    v-if="item.details"
                    class="caption text--secondary"
                  >
                    {{ item.details }}
                  </div>
                </div>
              </div>
            </template>
          </v-select>
        </v-col>
      </v-row>

      <!-- Confidence Badge -->
      <v-row
        v-if="mapping.confidence !== 'none'"
        class="mt-2"
      >
        <v-col>
          <v-chip
            x-small
            :color="confidenceColor"
            text-color="white"
          >
            {{ confidenceText }}
          </v-chip>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import type { ExtruderMetadata } from '@/util/parseFilamentMetadata'
import type { FilamentMapping } from '@/util/filamentMapper'
import type { FilamentSlot } from '@/store/printer/filaments/types'
import { rgbaToHex } from '@/util/parseFilamentMetadata'

interface SlotItem {
  value: number | null
  text: string
  color: string | null
  details: string | null
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

    // Add available printer slots (1-based display)
    for (let i = 0; i < this.printerSlots.length; i++) {
      const slot = this.printerSlots[i]
      if (slot.exists) {
        items.push({
          value: i,
          text: `${this.$t('app.general.label.slot')} ${i + 1}`,
          color: slot.colorRgba ? rgbaToHex(slot.colorRgba) : null,
          details: slot.vendor && slot.type ? `${slot.vendor} ${slot.type}` : slot.type
        })
      }
    }

    return items
  }

  get confidenceColor (): string {
    switch (this.mapping.confidence) {
      case 'high': return 'success'
      case 'medium': return 'warning'
      case 'low': return 'error'
      default: return 'grey'
    }
  }

  get confidenceText (): string {
    switch (this.mapping.confidence) {
      case 'high': return this.$t('app.general.label.high_confidence') as string
      case 'medium': return this.$t('app.general.label.medium_confidence') as string
      case 'low': return this.$t('app.general.label.low_confidence') as string
      default: return ''
    }
  }

  handleChange (value: number | null) {
    this.$emit('update', {
      gcodeExtruderIndex: this.mapping.gcodeExtruderIndex,
      printerSlotIndex: value
    })
  }
}
</script>

<style scoped>
.color-chip {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.color-chip-empty {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px dashed rgba(0, 0, 0, 0.2);
  background: transparent;
  flex-shrink: 0;
}

.color-chip-small {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}
</style>
