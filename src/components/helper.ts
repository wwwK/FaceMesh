import { FACEMESH_FACE_OVAL, NormalizedLandmarkList } from "@mediapipe/face_mesh";

export function readFaceOval(landmarks: NormalizedLandmarkList) {
  return FACEMESH_FACE_OVAL.map(item => landmarks[item[0]])
}
