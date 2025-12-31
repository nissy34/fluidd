<template>
  <div class="u1-screen-container">
    <iframe
      v-if="screenUrl"
      ref="screenIframe"
      :src="screenUrl"
      class="u1-screen-iframe"
      frameborder="0"
      scrolling="no"
      @load="handleLoad"
      @error="handleError"
    />
    <v-progress-circular
      v-if="loading"
      indeterminate
      color="primary"
      class="u1-screen-loading"
    />
    <v-alert
      v-if="error"
      type="error"
      class="u1-screen-error"
    >
      {{ error }}
    </v-alert>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Ref } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { consola } from 'consola'

@Component({})
export default class U1Screen extends Mixins(StateMixin) {
  @Ref('screenIframe')
  readonly screenIframe!: HTMLIFrameElement

  loading = true
  error: string | null = null
  screenUrl = ''

  get apiUrl (): string {
    return this.$typedState.config.apiUrl
  }

  buildScreenUrl (): string {
    try {
      // Extract host from API URL
      const apiUrlObj = new URL(this.apiUrl)
      const host = apiUrlObj.host
      const protocol = apiUrlObj.protocol

      // Use subpath /screen/ approach
      return `${protocol}//${host}/screen/`
    } catch (error) {
      consola.error('[U1Screen] Failed to build screen URL', error)
      return ''
    }
  }

  mounted () {
    this.screenUrl = this.buildScreenUrl()
    if (!this.screenUrl) {
      this.error = 'Failed to determine U1 screen server URL'
      this.loading = false
    }
  }

  handleLoad () {
    this.loading = false
    this.error = null
  }

  handleError () {
    this.loading = false
    this.error = 'Failed to load U1 screen. Make sure the U1 screen server is running.'
    consola.error('[U1Screen] Failed to load iframe')
  }

  reload () {
    if (!this.screenIframe || !this.screenUrl) {
      return
    }

    this.loading = true
    this.error = null

    try {
      // Try to reload the iframe content if same origin
      if (this.screenIframe.contentWindow) {
        this.screenIframe.contentWindow.location.reload()
      } else {
        throw new Error('Cross-origin iframe')
      }
    } catch {
      // Cross-origin error, reload by changing src with cache buster
      const baseUrl = this.buildScreenUrl()
      if (baseUrl) {
        const url = new URL(baseUrl)
        url.searchParams.set('_reload', Date.now().toString())
        // Force Vue to update by clearing and setting
        this.screenUrl = ''
        this.$nextTick(() => {
          this.screenUrl = url.toString()
        })
      }
      consola.debug('[U1Screen] Reloading iframe via src change')
    }
  }
}
</script>

<style lang="scss" scoped>
.u1-screen-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 400px;
  background: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
}

.u1-screen-iframe {
  width: 100%;
  height: 100%;
  min-height: 400px;
  border: none;
  background: #1a1a1a;
}

.u1-screen-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.u1-screen-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: 90%;
}
</style>
