import { useState } from "react"

type ThemeMode = "light" | "dark" | "auto"

type MapSidebarProps = {
  isOpen: boolean
  onClose: () => void
  onLogout: () => void
  onThemeModeChange: (themeMode: ThemeMode) => void
  resolvedTheme: "light" | "dark"
  themeMode: ThemeMode
}

function MapSidebar({
  isOpen,
  onClose,
  onLogout,
  onThemeModeChange,
  resolvedTheme,
  themeMode
}: MapSidebarProps) {
  const [isThemePopupOpen, setIsThemePopupOpen] = useState(false)
  const [isLogoutHovered, setIsLogoutHovered] = useState(false)
  const isDarkTheme = resolvedTheme === "dark"
  const themeOptions: Array<{
    description: string
    label: string
    value: ThemeMode
  }> = [
    {
      label: "Light",
      value: "light",
      description: "Keep the usual bright map and app theme."
    },
    {
      label: "Dark",
      value: "dark",
      description: "Use a darker map and darker controls."
    },
    {
      label: "Auto",
      value: "auto",
      description: "Switch to dark after 6:00 PM and light after 6:00 AM."
    }
  ]

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
          background: isDarkTheme ? "rgba(2, 6, 23, 0.48)" : "rgba(15, 23, 42, 0.26)",
          backdropFilter: "blur(4px)",
          zIndex: 7,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 360ms cubic-bezier(0.22, 1, 0.36, 1)"
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
          background: isDarkTheme
            ? "linear-gradient(180deg, rgba(2,6,23,0.98) 0%, rgba(15,23,42,0.98) 100%)"
            : "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)",
          color: isDarkTheme ? "#f8fafc" : "#0f172a",
          boxShadow: isDarkTheme
            ? "24px 0 56px rgba(2, 6, 23, 0.46)"
            : "24px 0 48px rgba(15, 23, 42, 0.16)",
          zIndex: 8,
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          borderRight: isDarkTheme
            ? "1px solid rgba(51, 65, 85, 0.92)"
            : "1px solid rgba(226, 232, 240, 0.9)",
          transform: isOpen ? "translateX(0)" : "translateX(-108%)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition:
            "transform 420ms cubic-bezier(0.22, 1, 0.36, 1), opacity 320ms ease"
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
                color: isDarkTheme ? "#f8fafc" : "#0f172a",
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
              border: isDarkTheme
                ? "1px solid rgba(71, 85, 105, 0.82)"
                : "1px solid rgba(203, 213, 225, 0.8)",
              background: isDarkTheme ? "rgba(15,23,42,0.88)" : "#ffffff",
              color: isDarkTheme ? "#f8fafc" : "#0f172a",
              cursor: "pointer",
              fontSize: "20px",
              fontWeight: 700,
              boxShadow: isDarkTheme
                ? "0 10px 24px rgba(2, 6, 23, 0.28)"
                : "0 10px 24px rgba(15, 23, 42, 0.08)"
            }}
          >
            x
          </button>
        </div>

        <div
          style={{
            padding: "16px",
            borderRadius: "20px",
            background: isDarkTheme
              ? "linear-gradient(135deg, rgba(15,23,42,0.94), rgba(30,41,59,0.94))"
              : "linear-gradient(135deg, #f8fafc, #eff6ff)",
            border: isDarkTheme
              ? "1px solid rgba(71, 85, 105, 0.7)"
              : "1px solid rgba(226, 232, 240, 0.95)"
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
              color: isDarkTheme ? "#cbd5e1" : "#475569",
              lineHeight: 1.5
            }}
          >
            Open the navigation controls, manage your trip, or sign out when
            you finish driving.
          </p>
        </div>

        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setIsThemePopupOpen((current) => !current)}
            style={{
              width: "100%",
              padding: "15px 18px",
              borderRadius: "18px",
              border: isDarkTheme
                ? "1px solid rgba(71, 85, 105, 0.74)"
                : "1px solid rgba(226, 232, 240, 0.95)",
              background: isDarkTheme ? "rgba(15,23,42,0.88)" : "#ffffff",
              color: isDarkTheme ? "#f8fafc" : "#0f172a",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: 700,
              boxShadow: isDarkTheme
                ? "0 12px 28px rgba(2, 6, 23, 0.24)"
                : "0 12px 28px rgba(15, 23, 42, 0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px"
            }}
          >
            <span>Change theme</span>
            <span
              style={{
                fontSize: "12px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#0f766e"
              }}
            >
              {themeMode}
            </span>
          </button>

          {isThemePopupOpen ? (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 12px)",
                left: 0,
                right: 0,
                padding: "16px",
                borderRadius: "22px",
                background: isDarkTheme
                  ? "linear-gradient(180deg, rgba(15,23,42,0.98), rgba(30,41,59,0.96))"
                  : "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))",
                border: isDarkTheme
                  ? "1px solid rgba(71, 85, 105, 0.74)"
                  : "1px solid rgba(226, 232, 240, 0.95)",
                boxShadow: isDarkTheme
                  ? "0 22px 42px rgba(2, 6, 23, 0.44)"
                  : "0 22px 42px rgba(15, 23, 42, 0.12)",
                zIndex: 1
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  fontWeight: 800,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#0f766e"
                }}
              >
                Select theme
              </p>
              <div
                style={{
                  display: "grid",
                  gap: "10px",
                  marginTop: "14px"
                }}
              >
                {themeOptions.map((option) => {
                  const isSelected = themeMode === option.value

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onThemeModeChange(option.value)
                        setIsThemePopupOpen(false)
                      }}
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        borderRadius: "18px",
                        border: isSelected
                          ? "1px solid rgba(15, 118, 110, 0.9)"
                          : isDarkTheme
                            ? "1px solid rgba(71, 85, 105, 0.64)"
                            : "1px solid rgba(226, 232, 240, 0.95)",
                        background: isSelected
                          ? isDarkTheme
                            ? "linear-gradient(135deg, rgba(15,118,110,0.22), rgba(15,23,42,0.92))"
                            : "linear-gradient(135deg, rgba(15,118,110,0.12), rgba(255,255,255,0.98))"
                          : isDarkTheme
                            ? "rgba(15,23,42,0.76)"
                            : "#ffffff",
                        color: isDarkTheme ? "#f8fafc" : "#0f172a",
                        cursor: "pointer",
                        textAlign: "left"
                      }}
                    >
                      <strong
                        style={{
                          display: "block",
                          fontSize: "15px",
                          lineHeight: 1.3
                        }}
                      >
                        {option.label}
                      </strong>
                      <span
                        style={{
                          display: "block",
                          marginTop: "6px",
                          color: isDarkTheme ? "#cbd5e1" : "#64748b",
                          fontSize: "13px",
                          lineHeight: 1.5
                        }}
                      >
                        {option.description}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>

        <div style={{ flex: 1 }} />

        <button
          type="button"
          onClick={onLogout}
          onMouseEnter={() => setIsLogoutHovered(true)}
          onMouseLeave={() => setIsLogoutHovered(false)}
          style={{
            width: "100%",
            padding: "15px 18px",
            borderRadius: "18px",
            border: isLogoutHovered
              ? "1px solid rgba(220, 38, 38, 0.92)"
              : isDarkTheme
                ? "1px solid rgba(71, 85, 105, 0.74)"
                : "1px solid rgba(226, 232, 240, 0.95)",
            background: isLogoutHovered
              ? "#dc2626"
              : isDarkTheme
                ? "rgba(15,23,42,0.88)"
                : "#ffffff",
            color: isLogoutHovered ? "#ffffff" : "#b91c1c",
            cursor: "pointer",
            fontSize: "15px",
            fontWeight: 700,
            boxShadow: isLogoutHovered
              ? "0 16px 30px rgba(220, 38, 38, 0.24)"
              : isDarkTheme
                ? "0 12px 28px rgba(2, 6, 23, 0.24)"
                : "0 12px 28px rgba(15, 23, 42, 0.06)",
            transition:
              "background 320ms cubic-bezier(0.22, 1, 0.36, 1), color 320ms cubic-bezier(0.22, 1, 0.36, 1), border-color 320ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 320ms cubic-bezier(0.22, 1, 0.36, 1)"
          }}
        >
          Logout
        </button>
      </aside>
    </>
  )
}

export default MapSidebar
