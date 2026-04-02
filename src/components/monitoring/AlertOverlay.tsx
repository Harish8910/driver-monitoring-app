type AlertOverlayProps = {
  message: string | null
}

function AlertOverlay({ message }: AlertOverlayProps) {
  if (!message) {
    return null
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        left: "50%",
        transform: "translateX(-50%)",
        padding: "14px 18px",
        borderRadius: "18px",
        background: "rgba(220, 38, 38, 0.92)",
        color: "#ffffff",
        boxShadow: "0 20px 40px rgba(127, 29, 29, 0.28)",
        zIndex: 9,
        minWidth: "260px",
        textAlign: "center"
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "11px",
          fontWeight: 800,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          opacity: 0.8
        }}
      >
        Monitoring alert
      </p>
      <p style={{ margin: "8px 0 0", fontSize: "16px", fontWeight: 700 }}>
        {message}
      </p>
    </div>
  )
}

export default AlertOverlay
