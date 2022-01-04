import { AnnotatedPrediction } from '@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh';
import { Coord3D, Coords3D } from '@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh/util';
import * as THREE from 'three'
import { ColorRepresentation, Object3D, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { uvs } from '../lib/frontProjectionUVMap';
import { positionBufferData } from '../lib/positionBufferData';
import { TRIANGULATION } from '../lib/triangulation';

interface Annotations {
  [key: string]: Coords3D
}

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
  const texture = textureLoader.load('/facepaint.png')
  // set the "color space" of the texture
  texture.encoding = THREE.sRGBEncoding;

  // reduce blurring at glancing angles
  texture.anisotropy = 16;
  const alpha = 0.4;
  const beta = 0.5;
	const material = new THREE.MeshPhongMaterial({
    map: texture,
    transparent: true,
    color: new THREE.Color(0xffffff),
    specular: new THREE.Color(beta * 0.2, beta * 0.2, beta * 0.2),
    reflectivity: beta,
    shininess: Math.pow(2, alpha * 10),
  });

  const mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)

  const loader = new GLTFLoader()
  const glasses = buildGlasses(loader)
  scene.add(glasses)

  // const x = makeLine()
  // const y = makeLine()
  // const z = makeLine()
  // scene.add(x, y, z)
  // ;(window as any).lines = {x, y, z}

  ;(window as any).glasses = glasses
  ;(window as any).camera = camera
  ;(window as any).background = background
  ;(window as any).scene = scene
  ;(window as any).noneScene = noneScene
  ;(window as any).renderer = renderer
  ;(window as any).mesh = mesh
  
  function render3D(prediction: AnnotatedPrediction | undefined) {
    if (prediction) {
      // const faceMesh = prediction.scaledMesh as Coords3D
      const faceMesh = resolveMesh(prediction.scaledMesh as Coords3D, vw, vh)
      const annotations: Annotations = (prediction as any).annotations
      Object.keys(annotations).forEach(key => {
        annotations[key] = resolveMesh(annotations[key], vw, vh)
      })
      
      trackGlasses(glasses, prediction)

      const positionBuffer = faceMesh.reduce((acc, pos) => acc.concat(pos), [] as number[])
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positionBuffer, 3))
      geometry.attributes.position.needsUpdate = true
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

  return [render3D, resize, renderer] as const
}

function buildGlasses(loader: GLTFLoader) {
  const glasses = new THREE.Object3D()
  glasses.position.set( 0, 0, 0 )

  // add frame glb.
  loader.load('/stereo-glasses.glb', (glassesObj) => {
    glassesObj.scene.scale.set(1.1, 1.1, -1.1)
    glassesObj.scene.position.set(0, 0, 0)
    glasses.add(glassesObj.scene)
  })

  // add left lens.
  const leftLens = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.25, 32),
    new THREE.MeshStandardMaterial({
      color: 0xFFC828,
      // side: THREE.BackSide,
      transparent: true,
      opacity: 0.5,
      roughness: 0.25,
    })
  )
  leftLens.position.copy(new Vector3(-0.3, -0.01, 0))
  glasses.add(leftLens)
  // add right lens.
  const rightLens = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.25, 32),
    new THREE.MeshStandardMaterial({
      color: 0xAD50FF,
      // side: THREE.BackSide,
      transparent: true,
      opacity: 0.5,
      roughness: 0.25,
    })
  )
  rightLens.position.copy(new Vector3(0.3, -0.01, 0))
  glasses.add(rightLens)

  return glasses
}

function resolveMesh(faceMesh: Coords3D, vw: number, vh: number): Coords3D {
  return faceMesh.map(p => [p[0] - vw / 2, vh / 2 - p[1], -p[2]])
}

function trackGlasses(glasses: Object3D, prediction: AnnotatedPrediction) {
  const annotations: Annotations = (prediction as any).annotations
  const position = annotations.midwayBetweenEyes[0]
  const scale = getScale(prediction.scaledMesh as Coords3D, 234, 454)
  const rotation = getRotation(prediction.scaledMesh as Coords3D, 10, 50, 280)
  glasses.position.set(...position)
  glasses.scale.setScalar(scale)
  glasses.rotation.setFromRotationMatrix(rotation)
  glasses.rotation.y = -glasses.rotation.y
  glasses.rotateZ(Math.PI)
  glasses.rotateX(- Math.PI * 0.05)
}

function getScale(coords: Coords3D, id0 = 0, id1 = 1) {
  return Math.abs(coords[id0][0] - coords[id1][0])
}

function getRotation(coords: Coords3D, top = 0, left = 1, right = 2) {
  const p0 = new THREE.Vector3(...coords[top])
  const p1 = new THREE.Vector3(...coords[left])
  const p2 = new THREE.Vector3(...coords[right])
  const matrix = new THREE.Matrix4()
  const x = p1.clone().sub(p2).normalize()
  const y = p1.clone().add(p2).multiplyScalar(0.5).sub(p0).multiplyScalar(-1).normalize()
  const z = new THREE.Vector3().crossVectors(x, y).normalize()
  matrix.makeBasis(x, y, z)
  return matrix.invert()
}

// function scaleBG(workCam: THREE.PerspectiveCamera, scaleObj: THREE.Mesh) {
//   const camZOffset = 600
//   const camXOffset = window.innerWidth / 2
//   const aspectRatio = window.innerWidth / window.innerHeight;

//   const alpha = ((workCam.fov / 2.0) * Math.PI / 180);
//   const beta = (90.0 * Math.PI / 180.0); 
//   const gamma = ((180.0 - alpha - beta) * Math.PI / 180.0);

//   const c = workCam.far - camZOffset - 1.0;
//   const a = c * Math.sin(alpha) / Math.sin(gamma);
//   const b = c * Math.sin(beta) / Math.sin(gamma);
//   const width = a * 2 / (window.innerWidth / 14);

//   scaleObj.scale.set(-width, width / aspectRatio, 1);
//   scaleObj.position.set(camXOffset,0,-c);
// }

function makeLine(color: ColorRepresentation = 0x0000ff) {
  const material = new THREE.LineBasicMaterial( { color } );
  const geometry = new THREE.BufferGeometry()
  const line = new THREE.Line( geometry, material );
  return line
}