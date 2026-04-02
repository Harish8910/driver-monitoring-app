import type { SearchHistoryEntry } from "../../features/maps/searchHistory"

type MapSidebarProps = {
  history: SearchHistoryEntry[]
  isOpen: boolean
  onClearHistory: () => void
  onClose: () => void
  onLogout: () => void
  onSelectHistory: (entry: SearchHistoryEntry) => void
}

function formatHistoryTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Saved recently"
  }

  return date.toLocaleString([], {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short"
  })
}

function MapSidebar({
  history,
  isOpen,
  onClearHistory,
  onClose,
  onLogout,
  onSelectHistory
}: MapSidebarProps) {
  if (!isOpen) {
    return null
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close sidebar overlay"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          border: "none",
          background: "rgba(15, 23, 42, 0.26)",
          backdropFilter: "blur(4px)",
          zIndex: 7
        }}
      />
      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "min(340px, 88vw)",
          padding: "24px 20px",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)",
          color: "#0f172a",
          boxShadow: "24px 0 48px rgba(15, 23, 42, 0.16)",
          zIndex: 8,
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          borderRight: "1px solid rgba(226, 232, 240, 0.9)"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px"
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: "11px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#0f766e",
                fontWeight: 700
              }}
            >
              Driver Console
            </p>
            <h2
              style={{
                marginTop: "10px",
                marginBottom: 0,
                color: "#0f172a",
                fontSize: "28px",
                lineHeight: 1
              }}
            >
              Trip menu
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "14px",
              border: "1px solid rgba(203, 213, 225, 0.8)",
              background: "#ffffff",
              color: "#0f172a",
              cursor: "pointer",
              fontSize: "20px",
              fontWeight: 700,
              boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)"
            }}
          >
            x
          </button>
        </div>

        <div
          style={{
            padding: "16px",
            borderRadius: "20px",
            background: "linear-gradient(135deg, #f8fafc, #eff6ff)",
            border: "1px solid rgba(226, 232, 240, 0.95)"
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "11px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#0f766e",
              fontWeight: 700
            }}
          >
            Quick actions
          </p>
          <p
            style={{
              marginTop: "8px",
              marginBottom: 0,
              color: "#475569",
              lineHeight: 1.5
            }}
          >
            Reopen a recent destination, keep your trips organized, or sign out
            when you finish driving.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px"
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#334155"
            }}
          >
            Recent searches
          </p>
          {history.length ? (
            <button
              type="button"
              onClick={onClearHistory}
              style={{
                border: "none",
                background: "transparent",
                color: "#0f766e",
                cursor: "pointer",
                fontWeight: 700
              }}
            >
              Clear
            </button>
          ) : null}
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            paddingRight: "4px"
          }}
        >
          {history.length ? (
            history.map((entry) => (
              <button
                key={`${entry.id}-${entry.vehicleType}`}
                type="button"
                onClick={() => onSelectHistory(entry)}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: "18px",
                  border: "1px solid rgba(226, 232, 240, 0.95)",
                  background: "#ffffff",
                  textAlign: "left",
                  color: "#0f172a",
                  cursor: "pointer",
                  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)"
                }}
              >
                <strong
                  style={{
                    display: "block",
                    fontSize: "15px",
                    lineHeight: 1.3
                  }}
                >
                  {entry.name}
                </strong>
                <span
                  style={{
                    display: "block",
                    marginTop: "6px",
                    fontSize: "13px",
                    lineHeight: 1.5,
                    color: "#64748b"
                  }}
                >
                  {entry.fullName}
                </span>
                <span
                  style={{
                    display: "block",
                    marginTop: "10px",
                    fontSize: "11px",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#0f766e",
                    fontWeight: 700
                  }}
                >
                  {entry.vehicleType} route - {formatHistoryTime(entry.searchedAt)}
                </span>
              </button>
            ))
          ) : (
            <div
              style={{
                padding: "16px",
                borderRadius: "18px",
                background: "#ffffff",
                border: "1px dashed rgba(203, 213, 225, 0.9)"
              }}
            >
              <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6 }}>
                Your selected destinations will show up here so you can reopen
                them quickly.
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onLogout}
          style={{
            width: "100%",
            padding: "15px 18px",
            borderRadius: "18px",
            border: "1px solid rgba(226, 232, 240, 0.95)",
            background: "#ffffff",
            color: "#b91c1c",
            cursor: "pointer",
            fontSize: "15px",
            fontWeight: 700,
            boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)"
          }}
        >
          Logout
        </button>
      </aside>
    </>
  )
}

export default MapSidebar
