import { useState } from "react"
import { signIn, signUp } from "../features/auth/authService"
import "../styles/Login.css"

function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")
    setIsLoading(true)

    try {
      if (isLogin) {
        const { error } = await signIn(email, password)
        if (error) throw error

        setMessage("Login successful ✅")
        // The success message shows briefly before redirect
        setTimeout(() => {
          window.location.href = "/home"
        }, 1000)
      } else {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match ❌")
        }

        const { error } = await signUp(email, password)

        if (error) throw error

        setMessage("Check your email to verify your account 📩")
        setIsLogin(true)
      }
    } catch (error: any) {
      setMessage(error.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <header className="login-header">
          <div className="login-logo">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3182ce" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <h2>{isLogin ? "Welcome back" : "Create account"}</h2>
          <p>{isLogin ? "Enter your credentials to access your dashboard" : "Join us to start monitoring your driving performance"}</p>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              required
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirm-password">Confirm Password</label>
              <input
                id="confirm-password"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="login-input"
                required
              />
            </div>
          )}

          {isLogin && (
            <div className="forgot-password">
              <a href="#">Forgot password?</a>
            </div>
          )}

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? "Processing..." : (isLogin ? "Login" : "Sign Up")}
          </button>
        </form>

        {message && (
          <div className={`message ${message.includes("❌") || message.toLowerCase().includes("error") ? "error" : "success"}`}>
            {message}
          </div>
        )}

        <footer className="login-footer">
          <p>
            {isLogin 
              ? <>Don't have an account? <span onClick={() => setIsLogin(false)}>Sign up</span></>
              : <>Already have an account? <span onClick={() => setIsLogin(true)}>Login</span></>
            }
          </p>
        </footer>
      </div>
    </main>
  )
}

export default Login