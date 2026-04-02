type BrowserFaceDetectorOptions = {
  fastMode?: boolean
  maxDetectedFaces?: number
}

type FacePoint = {
  x: number
  y: number
}

export type FaceLandmark = {
  locations?: FacePoint[]
  type?: string
}

export type DetectedFace = {
  boundingBox: DOMRectReadOnly
  landmarks?: FaceLandmark[]
}

type BrowserFaceDetector = {
  detect: (input: ImageBitmapSource) => Promise<DetectedFace[]>
}

declare global {
  interface Window {
    FaceDetector?: new (options?: BrowserFaceDetectorOptions) => BrowserFaceDetector
  }
}

let detectorInstance: BrowserFaceDetector | null | undefined

function getFaceDetector() {
  if (detectorInstance !== undefined) {
    return detectorInstance
  }

  if (typeof window === "undefined" || !window.FaceDetector) {
    detectorInstance = null
    return detectorInstance
  }

  detectorInstance = new window.FaceDetector({
    fastMode: true,
    maxDetectedFaces: 1
  })

  return detectorInstance
}

export function isFaceDetectionSupported() {
  return Boolean(getFaceDetector())
}

export async function detectPrimaryFace(video: HTMLVideoElement) {
  const detector = getFaceDetector()

  if (!detector || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    return null
  }

  const faces = await detector.detect(video)
  return faces[0] ?? null
}
