import type { RefObject } from "react"
import type { DriverAttentionState } from "../../features/monitoring/behaviorAnalysis"
import type { MonitoringStatus } from "../../features/monitoring/useMonitoring"

type CameraViewProps = {
  attentionState: DriverAttentionState
  isExpanded: boolean
  onToggle: () => void
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
    return "Camera access needs HTTPS or a supported browser"
  }

  if (status === "error") {
    return "Monitoring model could not start"
  }

  if (attentionState === "attentive") {
    return "Monitoring active"
  }

  return "Attention warning"
}

function CameraView({
  attentionState,
  isExpanded,
  onToggle,
  status,
  videoRef
}: CameraViewProps) {
  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        top: "50%",
        transform: "translateY(-50%)",
        width: isExpanded ? "248px" : "72px",
        borderRadius: "24px",
        overflow: "hidden",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(241,245,249,0.96))",
        color: "#0f172a",
        boxShadow: "0 22px 42px rgba(15, 23, 42, 0.18)",
        zIndex: 5,
        border: "1px solid rgba(226, 232, 240, 0.95)",
        transition: "width 180ms ease"
      }}
    >
      <button
        type="button"
        aria-label={isExpanded ? "Hide camera preview" : "Show camera preview"}
        onClick={onToggle}
        style={{
          width: "100%",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          padding: isExpanded ? "14px 16px 12px" : "18px 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: isExpanded ? "space-between" : "center",
          gap: "10px"
        }}
      >
        <div
          style={{
            minWidth: 0,
            display: "flex",
            flexDirection: isExpanded ? "row" : "column",
            alignItems: "center",
            justifyContent: "center",
            gap: isExpanded ? "10px" : "8px"
          }}
        >
          <span
            style={{
              display: "grid",
              placeItems: "center",
              width: "34px",
              height: "34px",
              borderRadius: "999px",
              background:
                attentionState === "attentive"
                  ? "rgba(15,118,110,0.12)"
                  : "rgba(220,38,38,0.12)",
              color: attentionState === "attentive" ? "#0f766e" : "#dc2626",
              fontSize: "12px",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase"
            }}
          >
            Cam
          </span>
          {isExpanded ? (
            <div style={{ minWidth: 0, textAlign: "left" }}>
              <p
                style={{
                  margin: 0,
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#64748b"
                }}
              >
                Driver monitoring
              </p>
              <p
                style={{
                  marginTop: "6px",
                  marginBottom: 0,
                  lineHeight: 1.4,
                  color: "#0f172a"
                }}
              >
                {getStatusLabel(status, attentionState)}
              </p>
            </div>
          ) : null}
        </div>
        {isExpanded ? (
          <span
            style={{
              color: "#64748b",
              fontSize: "12px",
              fontWeight: 700,
              flexShrink: 0
            }}
          >
            Hide
          </span>
        ) : null}
      </button>
      <div
        style={{
          position: "relative",
          aspectRatio: "4 / 3",
          background: "#020617",
          maxHeight: isExpanded ? "220px" : 0,
          opacity: isExpanded ? 1 : 0,
          overflow: "hidden",
          transition: "max-height 180ms ease, opacity 180ms ease"
        }}
      >
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
    </div>
  )
}

export default CameraView
