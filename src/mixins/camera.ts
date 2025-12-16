import Vue from 'vue'
import { Component, Emit, Prop, Ref, Watch } from 'vue-property-decorator'
import { consola } from 'consola'
import type { CameraConnectionStatus, CameraNameMenuItem } from '@/types'
import { SocketActions } from '@/api/socketActions'

@Component
export default class CameraMixin extends Vue {
  @Prop({ type: Object, required: true })
  readonly camera!: Moonraker.Webcam.Entry

  @Prop({ type: String })
  readonly crossorigin?: 'anonymous' | 'use-credentials' | ''

  @Ref('streamingElement')
  readonly streamingElement!: HTMLImageElement | HTMLIFrameElement | HTMLVideoElement

  cameraTransformStyle = ''
  animating = false
  status: CameraConnectionStatus = 'disconnected'
  cameraName = ''
  cameraNameMenuItems: CameraNameMenuItem[] = []
  framesPerSecond = -1
  rawCameraUrl = ''
  retryTimeoutId: number | null = null

  @Watch('camera')
  onCamera () {
    this.stopPlayback()
    this.checkPlayback()
  }

  get apiUrl (): string {
    return this.$typedState.config.apiUrl
  }

  get cameraStyle () {
    return {
      transform: this.cameraTransformStyle || undefined
    }
  }

  get autoRaiseFrameEvent () {
    return true
  }

  createTransform (): string {
    const element = this.streamingElement
    const { rotation, flip_horizontal, flip_vertical } = this.camera
    const transformsArray: string[] = []

    const { clientWidth, clientHeight } = element

    const scale = (
      rotation === 0 ||
      rotation === 180 ||
      clientHeight === 0 ||
      clientWidth === 0
    )
      ? 1
      : clientHeight < clientWidth
        ? clientHeight / clientWidth
        : clientWidth / clientHeight

    if (scale !== 1 || flip_horizontal) {
      transformsArray.push(`scaleX(${flip_horizontal ? -scale : scale})`)
    }

    if (scale !== 1 || flip_vertical) {
      transformsArray.push(`scaleY(${flip_vertical ? -scale : scale})`)
    }

    if (rotation !== 0) {
      transformsArray.push(`rotate(${rotation}deg`)
    }

    return transformsArray.join(' ')
  }

  updateCameraTransformStyle () {
    requestAnimationFrame(() => {
      if (!this.animating) {
        return
      }

      if (this.streamingElement) {
        this.cameraTransformStyle = this.createTransform()

        if (this.autoRaiseFrameEvent) {
          this.$emit('frame', this.streamingElement)
        }
      }

      this.updateCameraTransformStyle()
    })
  }

  created () {
    this.animating = true
    this.updateCameraTransformStyle()
  }

  mounted () {
    document.addEventListener('visibilitychange', this.checkPlayback, false)
    this.checkPlayback()
  }

  beforeDestroy () {
    this.animating = false
    document.removeEventListener('visibilitychange', this.checkPlayback)
    this.stopPlayback()
    SocketActions.cameraStopMonitor()
  }

  checkPlayback () {
    if (!document.hidden) {
      SocketActions.cameraStartMonitor()
      this.startPlayback()
    } else {
      this.stopPlayback()
      SocketActions.cameraStopMonitor()
    }
  }

  buildAbsoluteUrl (url: string) {
    const { origin } = new URL(document.URL)

    return new URL(url, origin)
  }

  @Emit('update:status')
  updateStatus (status: CameraConnectionStatus) {
    const previousStatus = this.status
    this.status = status

    if (status === 'error' && (previousStatus === 'connecting' || previousStatus === 'connected')) {
      if (this.retryTimeoutId !== null) {
        clearTimeout(this.retryTimeoutId)
      }

      this.retryTimeoutId = window.setTimeout(() => {
        this.retryTimeoutId = null
        if (!document.hidden) {
          this.startPlayback()
        }
      }, 10)
    }
  }

  @Emit('update:camera-name')
  updateCameraName (cameraName: string) {
    this.cameraName = cameraName
  }

  @Emit('update:camera-name-menu-items')
  updateCameraNameMenuItems (cameraNameMenuItems: CameraNameMenuItem[]) {
    this.cameraNameMenuItems = cameraNameMenuItems
  }

  @Emit('update:frames-per-second')
  updateFramesPerSecond (framesPerSecond: number) {
    this.framesPerSecond = framesPerSecond
  }

  @Emit('update:raw-camera-url')
  updateRawCameraUrl (rawCameraUrl: string) {
    this.rawCameraUrl = rawCameraUrl
  }

  startPlayback () {
    // noop
  }

  stopPlayback () {
    if (this.retryTimeoutId !== null) {
      clearTimeout(this.retryTimeoutId)
      this.retryTimeoutId = null
    }
  }

  menuItemClick (item: CameraNameMenuItem) {
    consola.debug('Menu item click', item)
  }
}
