import type { DetectedFace } from "./faceDetection"

const EYE_BLINK_THRESHOLD = 0.55
const EYE_ASPECT_RATIO_THRESHOLD = 0.16

export function hasVisibleEyes(face: DetectedFace | null) {
  if (!face) {
    return false
  }

  const {
    leftAspectRatio,
    rightAspectRatio,
    leftClosedScore,
    rightClosedScore
  } = face.eyeMetrics

  if (leftClosedScore !== null && rightClosedScore !== null) {
    return leftClosedScore < EYE_BLINK_THRESHOLD && rightClosedScore < EYE_BLINK_THRESHOLD
  }

  if (leftAspectRatio !== null && rightAspectRatio !== null) {
    return (
      leftAspectRatio > EYE_ASPECT_RATIO_THRESHOLD &&
      rightAspectRatio > EYE_ASPECT_RATIO_THRESHOLD
    )
  }

  return false
}
