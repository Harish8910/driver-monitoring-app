import {
  FaceLandmarker,
  FilesetResolver,
  type Category,
  type NormalizedLandmark
} from "@mediapipe/tasks-vision"

type FacePoint = {
  x: number
  y: number
}

type BoundingBox = {
  x: number
  y: number
  width: number
  height: number
}

type EyeMetrics = {
  leftAspectRatio: number | null
  rightAspectRatio: number | null
  leftClosedScore: number | null
  rightClosedScore: number | null
}

export type DetectedFace = {
  boundingBox: BoundingBox
  eyeMetrics: EyeMetrics
  landmarks: NormalizedLandmark[]
}

const MEDIAPIPE_WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm"
const FACE_LANDMARKER_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"

const LEFT_EYE_OUTER_INDEX = 33
const LEFT_EYE_INNER_INDEX = 133
const LEFT_EYE_UPPER_INDEX = 159
const LEFT_EYE_LOWER_INDEX = 145
const RIGHT_EYE_OUTER_INDEX = 263
const RIGHT_EYE_INNER_INDEX = 362
const RIGHT_EYE_UPPER_INDEX = 386
const RIGHT_EYE_LOWER_INDEX = 374

let faceLandmarkerPromise: Promise<FaceLandmarker> | null = null

function getPointDistance(pointA: FacePoint, pointB: FacePoint) {
  return Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y)
}

function getEyeAspectRatio(
  landmarks: NormalizedLandmark[],
  upperIndex: number,
  lowerIndex: number,
  outerIndex: number,
  innerIndex: number
) {
  const upper = landmarks[upperIndex]
  const lower = landmarks[lowerIndex]
  const outer = landmarks[outerIndex]
  const inner = landmarks[innerIndex]

  if (!upper || !lower || !outer || !inner) {
    return null
  }

  const verticalDistance = getPointDistance(upper, lower)
  const horizontalDistance = getPointDistance(outer, inner)

  if (horizontalDistance <= 0.00001) {
    return null
  }

  return verticalDistance / horizontalDistance
}

function getBlendshapeScore(categories: Category[], categoryName: string) {
  return categories.find((category) => category.categoryName === categoryName)?.score ?? null
}

function getEyeMetrics(landmarks: NormalizedLandmark[], categories: Category[]): EyeMetrics {
  return {
    leftAspectRatio: getEyeAspectRatio(
      landmarks,
      LEFT_EYE_UPPER_INDEX,
      LEFT_EYE_LOWER_INDEX,
      LEFT_EYE_OUTER_INDEX,
      LEFT_EYE_INNER_INDEX
    ),
    rightAspectRatio: getEyeAspectRatio(
      landmarks,
      RIGHT_EYE_UPPER_INDEX,
      RIGHT_EYE_LOWER_INDEX,
      RIGHT_EYE_OUTER_INDEX,
      RIGHT_EYE_INNER_INDEX
    ),
    leftClosedScore: getBlendshapeScore(categories, "eyeBlinkLeft"),
    rightClosedScore: getBlendshapeScore(categories, "eyeBlinkRight")
  }
}

function getBoundingBox(
  landmarks: NormalizedLandmark[],
  videoWidth: number,
  videoHeight: number
): BoundingBox {
  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  for (const landmark of landmarks) {
    minX = Math.min(minX, landmark.x)
    minY = Math.min(minY, landmark.y)
    maxX = Math.max(maxX, landmark.x)
    maxY = Math.max(maxY, landmark.y)
  }

  return {
    x: minX * videoWidth,
    y: minY * videoHeight,
    width: (maxX - minX) * videoWidth,
    height: (maxY - minY) * videoHeight
  }
}

export function isFaceDetectionSupported() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false
  }

  if (!window.isSecureContext) {
    return false
  }

  return Boolean(navigator.mediaDevices?.getUserMedia)
}

async function getFaceLandmarker() {
  if (!faceLandmarkerPromise) {
    faceLandmarkerPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL)

      return FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: FACE_LANDMARKER_MODEL_URL
        },
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        numFaces: 1,
        outputFaceBlendshapes: true,
        runningMode: "VIDEO"
      })
    })().catch((error) => {
      faceLandmarkerPromise = null
      throw error
    })
  }

  return faceLandmarkerPromise
}

export async function detectPrimaryFace(video: HTMLVideoElement) {
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    return null
  }

  const faceLandmarker = await getFaceLandmarker()
  const result = faceLandmarker.detectForVideo(video, performance.now())
  const landmarks = result.faceLandmarks[0]

  if (!landmarks?.length) {
    return null
  }

  const categories = result.faceBlendshapes[0]?.categories ?? []

  return {
    boundingBox: getBoundingBox(landmarks, video.videoWidth, video.videoHeight),
    eyeMetrics: getEyeMetrics(landmarks, categories),
    landmarks
  }
}
