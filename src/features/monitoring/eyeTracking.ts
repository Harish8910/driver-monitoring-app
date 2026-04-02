import type { DetectedFace } from "./faceDetection"

const EYE_LANDMARK_NAMES = ["leftEye", "rightEye", "eye"]

export function hasVisibleEyes(face: DetectedFace | null) {
  if (!face?.landmarks?.length) {
    return false
  }

  return face.landmarks.some((landmark) =>
    EYE_LANDMARK_NAMES.includes(landmark.type ?? "")
  )
}
