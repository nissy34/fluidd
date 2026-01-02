<template>
  <collapsable-card
    :title="$t('app.u1_screen.title')"
    icon="$printer3d"
    draggable
    :lazy="false"
    layout-path="dashboard.u1-screen-card"
    @collapsed="handleCollapsed"
  >
    <u1-screen
      ref="u1Screen"
      :collapsed="collapsed"
    />
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Vue, Ref, Watch } from 'vue-property-decorator'
import U1Screen from './U1Screen.vue'
import type { LayoutConfig } from '@/store/layout/types'

@Component({
  name: 'u1-screen-card',
  components: {
    U1Screen
  }
})
export default class U1ScreenCard extends Vue {
  @Ref('u1Screen')
  readonly u1Screen!: U1Screen

  collapsed = false

  get layout (): LayoutConfig | undefined {
    return this.$typedGetters['layout/getConfig'](
      this.$typedGetters['layout/getSpecificLayoutName'],
      'u1-screen-card'
    )
  }

  mounted () {
    // Initialize collapsed state from layout
    if (this.layout) {
      this.collapsed = this.layout.collapsed
    }
  }

  @Watch('layout', { deep: true })
  onLayoutChange () {
    if (this.layout) {
      this.collapsed = this.layout.collapsed
    }
  }

  handleCollapsed (collapsed: boolean) {
    this.collapsed = collapsed
  }
}
</script>
