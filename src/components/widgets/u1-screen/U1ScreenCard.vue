<template>
  <collapsable-card
    :title="$t('app.u1_screen.title')"
    icon="$printer3d"
    draggable
    layout-path="dashboard.u1-screen-card"
    @collapsed="handleCollapsed"
  >
    <u1-screen
      ref="u1Screen"
    />
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Vue, Ref } from 'vue-property-decorator'
import U1Screen from './U1Screen.vue'

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

  handleCollapsed (collapsed: boolean) {
    const wasCollapsed = this.collapsed
    this.collapsed = collapsed

    // If widget was collapsed and is now expanded, reload the iframe
    if (wasCollapsed && !collapsed && this.u1Screen) {
      this.$nextTick(() => {
        this.u1Screen.reload()
      })
    }
  }
}
</script>
