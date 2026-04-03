import type { DetectedFace } from "./faceDetection"

export type DriverAttentionState =
  | "attentive"
  | "looking-left"
  | "looking-right"
  | "looking-up"
  | "looking-down"
  | "face-not-visible"
  | "eyes-closed"

export function getAttentionMessage(attentionState: DriverAttentionState) {
  switch (attentionState) {
    case "looking-left":
      return "Looking left side"
    case "looking-right":
      return "Looking right side"
    case "looking-up":
      return "Looking upward"
    case "looking-down":
      return "Looking downward"
    case "face-not-visible":
      return "Driver face not detected"
    case "eyes-closed":
      return "Eyes closed for too long"
    default:
      return "Looking straight"
  }
}

export function getAttentionStateFromFace(
  face: DetectedFace | null,
  videoWidth: number,
  videoHeight: number
): DriverAttentionState {
  if (!face || !videoWidth || !videoHeight) {
    return "face-not-visible"
  }

  const nose = face.landmarks[1]
  const leftEyeOuter = face.landmarks[33]
  const rightEyeOuter = face.landmarks[263]
  const mouthLeft = face.landmarks[61]
  const mouthRight = face.landmarks[291]

  if (nose && leftEyeOuter && rightEyeOuter && mouthLeft && mouthRight) {
    const eyeMidX = (leftEyeOuter.x + rightEyeOuter.x) / 2
    const eyeMidY = (leftEyeOuter.y + rightEyeOuter.y) / 2
    const mouthMidY = (mouthLeft.y + mouthRight.y) / 2
    const eyeDistance = Math.max(Math.abs(rightEyeOuter.x - leftEyeOuter.x), 0.001)
    const faceHeight = Math.max(mouthMidY - eyeMidY, 0.001)
    const horizontalOffset = (nose.x - eyeMidX) / eyeDistance
    const verticalOffset = (nose.y - eyeMidY) / faceHeight

    if (horizontalOffset > 0.16) {
      return "looking-left"
    }

    if (horizontalOffset < -0.16) {
      return "looking-right"
    }

    if (verticalOffset < 0.48) {
      return "looking-up"
    }

    if (verticalOffset > 0.92) {
      return "looking-down"
    }

    return "attentive"
  }

  const centerX = face.boundingBox.x + face.boundingBox.width / 2
  const centerY = face.boundingBox.y + face.boundingBox.height / 2
  const normalizedX = centerX / videoWidth
  const normalizedY = centerY / videoHeight

  if (normalizedX < 0.36) {
    return "looking-left"
  }

  if (normalizedX > 0.64) {
    return "looking-right"
  }

  if (normalizedY < 0.3) {
    return "looking-up"
  }

  if (normalizedY > 0.7) {
    return "looking-down"
  }

  return "attentive"
}
