<template>
  <div class="print-settings-panel">
    <h3 class="subtitle-1 mb-3">
      {{ $t('app.general.title.print_settings') }}
    </h3>

    <v-card outlined>
      <v-card-text>
        <v-row>
          <v-col
            cols="12"
            sm="4"
          >
            <v-switch
              :input-value="settings.autoBedLeveling"
              :label="$t('app.general.label.auto_bed_leveling')"
              hide-details
              @change="updateSetting('autoBedLeveling', $event)"
            />
          </v-col>

          <v-col
            cols="12"
            sm="4"
          >
            <v-switch
              :input-value="settings.flowCalibrate"
              :label="$t('app.general.label.flow_calibrate')"
              hide-details
              @change="updateSetting('flowCalibrate', $event)"
            />
          </v-col>

          <v-col
            cols="12"
            sm="4"
          >
            <v-switch
              :input-value="settings.timeLapseCamera"
              :label="$t('app.general.label.time_lapse_camera')"
              hide-details
              @change="updateSetting('timeLapseCamera', $event)"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import type { PrintJobSettings } from '@/store/printJob/types'

@Component({})
export default class PrintSettingsPanel extends Vue {
  @Prop({ type: Object, required: true })
  readonly settings!: PrintJobSettings

  updateSetting (key: keyof PrintJobSettings, value: boolean) {
    this.$emit('update', { [key]: value })
  }
}
</script>
