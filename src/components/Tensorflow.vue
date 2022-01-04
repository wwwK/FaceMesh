<template>
  <span style="position: absolute; z-index: 10; left: 0; top: 0;">face {{ faceOn ? 'on' : 'off' }}</span>
  <video id="video" width="1" height="1"></video>
  <canvas id="canvas"></canvas>
  <canvas id="coords"></canvas>
</template>
<script lang="ts">
import { defineComponent, onMounted, onUnmounted, ref } from 'vue'
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection'
import { initCamera } from './camera'
import * as tf from '@tensorflow/tfjs-core'
// import '@tensorflow/tfjs-backend-webgl'
import { setWasmPaths, getThreadsCount, setThreadsCount } from '@tensorflow/tfjs-backend-wasm'
import { MediaPipeFaceMesh } from '@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh'
import { init3D } from './three'
import { drawCoords, initCanvas } from './coords'
import { Coords3D } from '@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh/util'

setWasmPaths('/node_modules/@tensorflow/tfjs-backend-wasm/dist/')
setThreadsCount(2)
export default defineComponent({
  setup() {
    const faceOn = ref(false)

    async function main() {
      const canvas = document.getElementById('canvas') as HTMLCanvasElement
      const video = document.getElementById('video') as HTMLVideoElement

      const coords = document.getElementById('coords') as HTMLCanvasElement
      const coordsCtx = coords.getContext('2d')!
      initCanvas(coords)
      
      // await tf.setBackend('webgl')
      await tf.setBackend('wasm')
      console.log('getThreadsCount', getThreadsCount())
      await initCamera(video)
      
      const model = await faceLandmarksDetection.load(
        faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
        {
          shouldLoadIrisModel: false,
          maxFaces: 1
        }
      )
      
      const [render3D, resize] = init3D(canvas, video)

      async function render(model: MediaPipeFaceMesh) {
        const predictions = await model.estimateFaces({
          input: video,
          predictIrises: false,
          // flipHorizontal: true
        })
        
        if (predictions.length > 0) {
          // console.log(predictions[0])
          const coords = (predictions[0] as any).scaledMesh
          // const annotations = (predictions[0] as any).annotations
          // const coords = [...annotations.midwayBetweenEyes, ...annotations.leftCheek, ...annotations.rightCheek]
          // const coords = annotations.midwayBetweenEyes
          
          // drawCoords(coordsCtx, coords, video.videoWidth, video.videoHeight)
        }
        faceOn.value = predictions.length > 0

        render3D(predictions[0])

        requestAnimationFrame(() => {
          render(model)
        })
      }

      resize()
      render(model)

      window.onresize = resize
    }

    onMounted(main)
    
    onUnmounted(() => {
      window.onresize = null
    })

    return {
      faceOn
    }
  }
})
</script>
<style scoped>
#canvas, #coords {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  /* transform: scaleX(-1); */
}
#video {
  z-index: 0;
  display: none;
  /* object-fit: fill; */
}
</style>