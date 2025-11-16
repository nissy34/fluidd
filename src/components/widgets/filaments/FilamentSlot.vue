<template>
  <v-card
    class="filament-slot"
    :class="{ 'filament-slot--empty': !filamentSlot.exists }"
    elevation="2"
  >
    <v-card-text class="pa-4 text-center">
      <!-- Slot Number Badge -->
      <div class="slot-number mb-3">
        <v-avatar
          size="60"
          :color="filamentSlot.exists ? 'transparent' : 'grey lighten-2'"
          :style="filamentSlot.exists ? { border: `3px solid #${filamentSlot.colorRgba.slice(0, 6)}` } : {}"
        >
          <v-avatar
            size="52"
            :color="filamentSlot.exists ? `#${filamentSlot.colorRgba.slice(0, 6)}` : 'grey lighten-3'"
          >
            <span class="text-h6 font-weight-bold white--text">
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
          {{ filamentSlot.type || 'N/A' }}
        </v-chip>
      </div>

      <!-- Manufacturer Info -->
      <div class="manufacturer mb-1">
        <div class="text-body-2 font-weight-medium">
          {{ filamentSlot.vendor || 'Unknown' }}
        </div>
        <div
          v-if="filamentSlot.subType"
          class="text-caption grey--text"
        >
          {{ filamentSlot.subType }}
        </div>
      </div>

      <!-- Status Indicator -->
      <div class="status-indicator mt-2">
        <v-icon
          small
          :color="filamentSlot.exists ? 'success' : 'grey'"
        >
          {{ filamentSlot.exists ? 'mdi-check-circle' : 'mdi-circle-outline' }}
        </v-icon>
        <span class="text-caption ml-1">
          {{ filamentSlot.exists ? $t('app.general.label.loaded') : $t('app.general.label.empty') }}
        </span>
      </div>

      <!-- Edit Button (Disabled for now) -->
      <v-btn
        v-if="filamentSlot.exists"
        x-small
        text
        disabled
        class="mt-2"
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

@Component({})
export default class FilamentSlot extends Vue {
  @Prop({ type: Object, required: true })
  readonly filamentSlot!: FilamentSlotType
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
</style>
