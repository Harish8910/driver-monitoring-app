import { useEffect, useRef, useState } from "react"
import { playAlertBeep, stopAlertBeep } from "../alerts/beep"
import { speakNavigationAlert, stopVoiceAlerts } from "../alerts/voiceAlert"
import {
  getAttentionMessage,
  getAttentionStateFromFace,
  type DriverAttentionState
} from "./behaviorAnalysis"
import { detectPrimaryFace, isFaceDetectionSupported } from "./faceDetection"
import { hasVisibleEyes } from "./eyeTracking"

type UseMonitoringOptions = {
  enabled: boolean
}

export type MonitoringStatus =
  | "idle"
  | "requesting-camera"
  | "active"
  | "unsupported"
  | "camera-denied"
  | "error"

export type MonitoringAlert = {
  label: string
  state: DriverAttentionState
  timestamp: number
}

const ATTENTION_ALERT_DELAY_MS = 1800
const EYE_CLOSED_ALERT_DELAY_MS = 2500
const FACE_MISSING_ALERT_DELAY_MS = 3000
const ALERT_COOLDOWN_MS = 7000
const ANALYSIS_INTERVAL_MS = 900

export function useMonitoring({ enabled }: UseMonitoringOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<number | null>(null)
  const isAnalyzingRef = useRef(false)
  const activeStateSinceRef = useRef<{
    startedAt: number
    state: DriverAttentionState
  } | null>(null)
  const lastAlertRef = useRef<{
    state: DriverAttentionState
    timestamp: number
  } | null>(null)

  const [status, setStatus] = useState<MonitoringStatus>("idle")
  const [isSupported, setIsSupported] = useState(true)
  const [currentState, setCurrentState] = useState<DriverAttentionState>("attentive")
  const [lastAlert, setLastAlert] = useState<MonitoringAlert | null>(null)

  useEffect(() => {
    const stopMonitoringSession = () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null
      }

      streamRef.current?.getTracks().forEach((track) => {
        track.stop()
      })
      streamRef.current = null
      isAnalyzingRef.current = false
      activeStateSinceRef.current = null
      lastAlertRef.current = null
      stopAlertBeep()
      stopVoiceAlerts()
      setCurrentState("attentive")
      setLastAlert(null)
      setStatus("idle")
    }

    if (!enabled) {
      setIsSupported(isFaceDetectionSupported())
      stopMonitoringSession()
      return
    }

    if (!isFaceDetectionSupported()) {
      setIsSupported(false)
      setStatus("unsupported")
      return
    }

    let isCancelled = false

    const analyze = async () => {
      if (isAnalyzingRef.current) {
        return
      }

      const video = videoRef.current

      if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        return
      }

      isAnalyzingRef.current = true

      try {
        const detectedFace = await detectPrimaryFace(video)
        const attentionState = getAttentionStateFromFace(
          detectedFace,
          video.videoWidth,
          video.videoHeight
        )
        const now = Date.now()
        const eyesVisible = hasVisibleEyes(detectedFace)
        const supportsEyeProxy = Boolean(detectedFace)
        let nextState = attentionState
        let threshold = ATTENTION_ALERT_DELAY_MS

        if (attentionState === "face-not-visible") {
          threshold = FACE_MISSING_ALERT_DELAY_MS
        } else if (supportsEyeProxy && !eyesVisible) {
          nextState = "eyes-closed"
          threshold = EYE_CLOSED_ALERT_DELAY_MS
        }

        setCurrentState(nextState)

        if (nextState === "attentive") {
          activeStateSinceRef.current = null
          return
        }

        if (activeStateSinceRef.current?.state !== nextState) {
          activeStateSinceRef.current = {
            state: nextState,
            startedAt: now
          }
          return
        }

        const activeDuration = now - activeStateSinceRef.current.startedAt
        const lastAlert = lastAlertRef.current
        const canAlert =
          !lastAlert ||
          lastAlert.state !== nextState ||
          now - lastAlert.timestamp > ALERT_COOLDOWN_MS

        if (activeDuration < threshold || !canAlert) {
          return
        }

        const label = getAttentionMessage(nextState)
        lastAlertRef.current = {
          state: nextState,
          timestamp: now
        }
        setLastAlert({
          label,
          state: nextState,
          timestamp: now
        })
        playAlertBeep()
        speakNavigationAlert(label)
      } catch {
        setStatus("error")
      } finally {
        isAnalyzingRef.current = false
      }
    }

    const startMonitoringSession = async () => {
      setStatus("requesting-camera")

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        })

        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        setIsSupported(true)
        setStatus("active")
        intervalRef.current = window.setInterval(() => {
          void analyze()
        }, ANALYSIS_INTERVAL_MS)
      } catch (error) {
        if (isCancelled) {
          return
        }

        if (error instanceof DOMException && error.name === "NotAllowedError") {
          setStatus("camera-denied")
        } else {
          setStatus("error")
        }
      }
    }

    void startMonitoringSession()

    return () => {
      isCancelled = true
      stopMonitoringSession()
    }
  }, [enabled])

  return {
    currentState,
    isSupported,
    lastAlert,
    status,
    videoRef
  }
}
