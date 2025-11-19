<template>
  <v-dialog
    :value="open"
    max-width="700"
    persistent
    @input="$emit('update:open', $event)"
  >
    <v-card>
      <v-card-title>
        <v-icon left>
          $edit
        </v-icon>
        {{ $t('app.general.title.edit_filament') }}
        <v-spacer />
        <span class="text-h6 primary--text">
          {{ $t('app.general.label.slot') }} {{ filamentSlot ? filamentSlot.index + 1 : '' }}
        </span>
      </v-card-title>

      <v-divider />

      <v-card-text class="pt-4">
        <!-- Vendor Selection -->
        <v-select
          v-model="selectedVendor"
          :items="vendors"
          :label="$t('app.general.label.vendor')"
          outlined
          dense
          @change="handleVendorChange"
        />

        <!-- Material Type Selection -->
        <v-select
          v-model="selectedMaterial"
          :items="materials"
          :label="$t('app.general.label.material_type')"
          outlined
          dense
          :disabled="!selectedVendor"
          @change="handleMaterialChange"
        />

        <!-- Sub Type/Series Selection -->
        <v-select
          v-model="selectedSubType"
          :items="seriesItems"
          :label="$t('app.general.label.series')"
          outlined
          dense
          clearable
          :disabled="!selectedMaterial"
        />

        <!-- Display Preview -->
        <v-alert
          v-if="displayName"
          type="info"
          text
          dense
          class="mb-4"
        >
          <strong>{{ $t('app.general.label.preview') }}:</strong> {{ displayName }}
        </v-alert>

        <!-- Color Selection -->
        <div class="mt-4">
          <div class="text-subtitle-2 mb-3">
            {{ $t('app.general.label.color') }}
          </div>

          <!-- Preset Colors Grid -->
          <div class="preset-colors-grid mb-4">
            <v-tooltip
              v-for="color in presetColors"
              :key="color.hex"
              top
            >
              <template #activator="{ on, attrs }">
                <v-btn
                  :color="`#${color.hex}`"
                  fab
                  x-small
                  depressed
                  class="ma-1"
                  v-bind="attrs"
                  v-on="on"
                  @click="selectedColor = color.hex"
                >
                  <v-icon
                    v-if="selectedColor.toUpperCase() === color.hex.toUpperCase()"
                    small
                    :color="isColorDark(color.hex) ? 'white' : 'black'"
                  >
                    $check
                  </v-icon>
                </v-btn>
              </template>
              <span>{{ color.name }}</span>
            </v-tooltip>
          </div>

          <!-- Custom Color Picker -->
          <v-color-picker
            v-model="customColor"
            hide-inputs
            show-swatches
            class="ma-0"
            @update:color="handleColorChange"
          />

          <!-- Color Preview -->
          <div class="d-flex align-center mt-3">
            <div class="text-caption mr-3">
              {{ $t('app.general.label.preview') }}:
            </div>
            <v-avatar
              size="48"
              :color="`#${selectedColor}`"
              class="mr-2"
            >
              <span
                :class="isColorDark(selectedColor) ? 'white--text' : 'black--text'"
                class="text-caption font-weight-bold"
              >
                #{{ selectedColor.toUpperCase() }}
              </span>
            </v-avatar>
          </div>
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
          :disabled="!isValid"
          @click="handleSave"
        >
          {{ $t('app.general.btn.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import type { FilamentSlot } from '@/store/printer/filaments/types'
import {
  getVendors,
  getMaterialsForVendor,
  getSeriesForVendorMaterial,
  getPresetColors,
  getFilamentDisplayName,
  type FilamentColor
} from '@/constants/filamentDatabase'

export interface FilamentConfig {
  slotIndex: number
  vendor: string
  material: string
  subType: string
  colorRgba: string
}

@Component({})
export default class FilamentEditDialog extends Vue {
  @Prop({ type: Boolean, default: false })
  readonly open!: boolean

  @Prop({ type: Object, default: null })
  readonly filamentSlot!: FilamentSlot | null

  selectedVendor = ''
  selectedMaterial = ''
  selectedSubType = ''
  selectedColor = 'FFFFFF'
  customColor = '#FFFFFF'

  @Watch('open')
  onOpenChange (val: boolean) {
    if (val && this.filamentSlot) {
      // Initialize with current values
      this.selectedVendor = this.filamentSlot.vendor || ''
      this.selectedMaterial = this.filamentSlot.type || ''
      this.selectedSubType = this.filamentSlot.subType || ''
      this.selectedColor = this.filamentSlot.colorRgba?.slice(0, 6) || 'FFFFFF'
      this.customColor = `#${this.selectedColor}`
    }
  }

  get vendors (): string[] {
    return getVendors()
  }

  get materials (): string[] {
    if (!this.selectedVendor) return []
    return getMaterialsForVendor(this.selectedVendor)
  }

  get series (): string[] {
    if (!this.selectedVendor || !this.selectedMaterial) return []
    return getSeriesForVendorMaterial(this.selectedVendor, this.selectedMaterial)
  }

  get seriesItems (): Array<{ text: string, value: string }> {
    return this.series.map(s => ({
      text: s || '(default)',
      value: s
    }))
  }

  get presetColors (): FilamentColor[] {
    return getPresetColors()
  }

  get displayName (): string {
    if (!this.selectedVendor || !this.selectedMaterial) return ''
    return getFilamentDisplayName(this.selectedVendor, this.selectedSubType, this.selectedMaterial)
  }

  get isValid (): boolean {
    return !!(this.selectedVendor && this.selectedMaterial && this.selectedColor)
  }

  handleVendorChange () {
    this.selectedMaterial = ''
    this.selectedSubType = ''
  }

  handleMaterialChange () {
    this.selectedSubType = ''
  }

  handleColorChange (color: any) {
    // color-picker returns hex with #
    const hex = color.hex?.replace('#', '') || color.replace('#', '')
    this.selectedColor = hex.toUpperCase()
  }

  isColorDark (hex: string): boolean {
    const rgb = parseInt(hex, 16)
    const r = (rgb >> 16) & 0xff
    const g = (rgb >> 8) & 0xff
    const b = (rgb >> 0) & 0xff
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
    return luma < 128
  }

  handleSave () {
    if (!this.filamentSlot || !this.isValid) return

    const config: FilamentConfig = {
      slotIndex: this.filamentSlot.index,
      vendor: this.selectedVendor,
      material: this.selectedMaterial,
      subType: this.selectedSubType || '',
      colorRgba: `${this.selectedColor}FF` // Add FF for full opacity
    }

    this.$emit('save', config)
  }

  handleCancel () {
    this.$emit('update:open', false)
  }
}
</script>

<style scoped>
.preset-colors-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.v-btn--fab.v-size--x-small {
  width: 36px;
  height: 36px;
}
</style>
