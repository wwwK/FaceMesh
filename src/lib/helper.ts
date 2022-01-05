import * as THREE from "three"
import { AnnotatedPrediction } from "@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh";
import { Coords3D } from "@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh/util";
import { Material, Object3D, TextureLoader, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";


export function getScale(coords: Coords3D, id0 = 0, id1 = 1) {
  const v1 = new Vector3(...coords[id0])
  const v2 = new Vector3(...coords[id1])
  return v1.distanceTo(v2)
}

export function getRotation(coords: Coords3D, top = 0, left = 1, right = 2) {
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

export interface Annotations {
  [key: string]: Coords3D
}

export interface ModelLoader {
  build(loader: GLTFLoader): Object3D
  track(object: Object3D, prediction: AnnotatedPrediction): void
}

export interface ModelData {
  name: string
  thumb?: string
  thumbBg?: string
  type: 'model' | 'texture'
  loader?: ModelLoader
  texture?: (textureLoader: TextureLoader) => Material
  path?: string
}
