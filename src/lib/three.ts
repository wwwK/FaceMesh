import { AnnotatedPrediction } from '@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh';
import { Coord3D, Coords3D } from '@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh/util';
import * as THREE from 'three'
import { ColorRepresentation, Object3D, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { uvs } from './frontProjectionUVMap';
import glassesModel from './models/glasses';
import { positionBufferData } from './positionBufferData';
import { TRIANGULATION } from './triangulation';
import { Annotations, ModelData } from './helper';
import { loadTexture } from './textures/loadTexture';
import zeldaModel from './models/zelda';

export function init3D(canvas: HTMLCanvasElement, video: HTMLVideoElement) {
  let w = window.innerWidth
  let h = window.innerHeight
  const vw = video.videoWidth
  const vh = video.videoHeight
  const scene = new THREE.Scene()
  const noneScene = new THREE.Scene()
  // scene.background = background
  // noneScene.background = background

  const backgroundTexture = new THREE.VideoTexture(video)
  const background = new THREE.Mesh(
    new THREE.PlaneGeometry(vw, vh),
    new THREE.MeshBasicMaterial({
      map: backgroundTexture
    })
  )
  background.position.set(0, 0, -1000)
  scene.add(background)

  const backgroundCopy = background.clone()
  noneScene.add(backgroundCopy)
  
  // const camera = new THREE.PerspectiveCamera( 60, w / h, .01, 1e3 );
  // camera.position.set( 0, 0, 5 );
  // camera.lookAt( 0, 0, 0 );

  // const camera = new THREE.OrthographicCamera(1, 1, 1, 1, -1000, 1000);
  // camera.left = - w / 2
  // camera.right = w / 2
  // camera.top = h / 2
  // camera.bottom = - h / 2
  // camera.updateProjectionMatrix()

  const camera = new THREE.OrthographicCamera(
    w / -2,
    w / 2,
    h / 2,
    h / -2,
    0.1,
    1100
  )
  camera.position.set(0, 0, 100)
  camera.lookAt(scene.position)

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(w, h)

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.2)
  scene.add(hemiLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
  directionalLight.position.set(w / 2, h / 4, -1000).normalize()
	scene.add(directionalLight)
  const reverseDirectionalLight = directionalLight.clone()
  reverseDirectionalLight.position.z = 1000
  scene.add(reverseDirectionalLight)

  const geometry = new THREE.BufferGeometry()
  geometry.setIndex(TRIANGULATION)
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positionBufferData, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs.map((item, index) => index % 2 ? item : 1 - item), 2))
  geometry.computeVertexNormals()

  const textureLoader = new THREE.TextureLoader()
  const loader = new GLTFLoader()
  let currentModelData: ModelData | null = null
  let currentModel: Object3D | null = null

  function updateGeometry(prediction: AnnotatedPrediction) {
    const faceMesh = resolveMesh(prediction.scaledMesh as Coords3D, vw, vh)
    const positionBuffer = faceMesh.reduce((acc, pos) => acc.concat(pos), [] as number[])
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positionBuffer, 3))
    geometry.attributes.position.needsUpdate = true
  }

  function render3D(prediction: AnnotatedPrediction | undefined) {
    if (prediction) {
      // const faceMesh = prediction.scaledMesh as Coords3D
      const annotations: Annotations = (prediction as any).annotations
      Object.keys(annotations).forEach(key => {
        annotations[key] = resolveMesh(annotations[key], vw, vh)
      })
      
      currentModelData?.type === 'model' && currentModelData.loader?.track(currentModel!, prediction)
      currentModelData?.type === 'texture' && updateGeometry(prediction)

      renderer.render(scene, camera)
    } else {
      renderer.render(noneScene, camera)
    }
  }

  function resize() {
    w = window.innerWidth
    h = window.innerHeight
    const windowRatio = w / h
    const videRatio = vw / vh
    const scale = windowRatio > videRatio ? w / vw : h / vh
    
    scene.scale.set(-scale, scale, 1)
    noneScene.scale.set(-scale, scale, 1)

    camera.top = h / 2
    camera.bottom = h / -2
    camera.left = w / -2
    camera.right = w / 2
    camera.updateProjectionMatrix()

    // mesh.position.set(windowWidth / -2, windowHeight / -2, 0)

    renderer.setSize(w, h)
  }

  function addModel(model: ModelData) {
    currentModel && scene.remove(currentModel)
    currentModelData = model
    if (model.type === 'model') {
      currentModel = model.loader!.build(loader)
    } else if (model.type === 'texture') {
      const material = model.texture ? model.texture(textureLoader) : loadTexture(textureLoader, model.path!)
      currentModel = new THREE.Mesh(geometry, material)
    }
    scene.add(currentModel!)
    ;(window as any).model = currentModel
  }

  return [render3D, resize, addModel] as const
}

function resolveMesh(faceMesh: Coords3D, vw: number, vh: number): Coords3D {
  return faceMesh.map(p => [p[0] - vw / 2, vh / 2 - p[1], -p[2]])
}
