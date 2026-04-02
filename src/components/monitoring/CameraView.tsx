import type { RefObject } from "react"
import type { DriverAttentionState } from "../../features/monitoring/behaviorAnalysis"
import type { MonitoringStatus } from "../../features/monitoring/useMonitoring"

type CameraViewProps = {
  attentionState: DriverAttentionState
  status: MonitoringStatus
  videoRef: RefObject<HTMLVideoElement | null>
}

function getStatusLabel(status: MonitoringStatus, attentionState: DriverAttentionState) {
  if (status === "requesting-camera") {
    return "Starting camera..."
  }

  if (status === "camera-denied") {
    return "Camera permission denied"
  }

  if (status === "unsupported") {
    return "Face detection unsupported"
  }

  if (status === "error") {
    return "Monitoring unavailable"
  }

  if (attentionState === "attentive") {
    return "Monitoring active"
  }

  return "Attention warning"
}

function CameraView({ attentionState, status, videoRef }: CameraViewProps) {
  return (
    <div
      style={{
        position: "fixed",
        right: 20,
        bottom: 20,
        width: "220px",
        borderRadius: "22px",
        overflow: "hidden",
        background: "rgba(15, 23, 42, 0.88)",
        color: "#f8fafc",
        boxShadow: "0 22px 42px rgba(15, 23, 42, 0.28)",
        zIndex: 5
      }}
    >
      <div style={{ position: "relative", aspectRatio: "4 / 3", background: "#020617" }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: "scaleX(-1)"
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            padding: "6px 10px",
            borderRadius: "999px",
            background:
              attentionState === "attentive"
                ? "rgba(15,118,110,0.88)"
                : "rgba(220,38,38,0.9)",
            color: "#ffffff",
            fontSize: "11px",
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase"
          }}
        >
          {status === "active" ? "Camera live" : "Camera"}
        </div>
      </div>
      <div style={{ padding: "12px 14px" }}>
        <p
          style={{
            margin: 0,
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(226,232,240,0.7)"
          }}
        >
          Driver monitoring
        </p>
        <p style={{ marginTop: "8px", marginBottom: 0, lineHeight: 1.5 }}>
          {getStatusLabel(status, attentionState)}
        </p>
      </div>
    </div>
  )
}

export default CameraView
