import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowLeft, Lock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { OtpInput } from "@/components/auth/OtpInput"
import { useApi } from "@/hooks/useApi"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"

export function VerifyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { verifyCode, sendCode } = useApi()
  const phone = location.state?.phone

  const [otp, setOtp] = useState("")
  const [password, setPassword] = useState("")
  const [needs2fa, setNeeds2fa] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)

  useEffect(() => {
    if (!phone) {
      navigate("/")
    }
  }, [phone, navigate])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [countdown])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await verifyCode(otp, needs2fa ? password : undefined)
      if (result.needs_2fa) {
        setNeeds2fa(true)
      } else {
        navigate("/chats")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!canResend || !phone) return
    setCanResend(false)
    setCountdown(60)
    try {
      await sendCode(phone)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code")
    }
  }

  if (!phone) return null

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-4"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4"
            >
              <Lock className="w-8 h-8 text-primary" />
            </motion.div>

            <CardTitle className="text-2xl">
              {needs2fa ? "Two-Factor Auth" : "Enter Code"}
            </CardTitle>
            <CardDescription>
              {needs2fa
                ? "Enter your 2FA password"
                : `We sent a code to ${phone}`}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
              {!needs2fa ? (
                <OtpInput value={otp} onChange={setOtp} disabled={loading} />
              ) : (
                <Input
                  type="password"
                  placeholder="2FA Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              )}

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-error text-sm text-center"
                >
                  {error}
                </motion.p>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-[#0099e6]"
                disabled={loading || (!needs2fa && otp.length < 5) || (needs2fa && !password)}
              >
                {loading ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : null}
                {loading ? "Verifying..." : "Verify"}
              </Button>
            </form>

            {!needs2fa && (
              <div className="mt-4 text-center">
                {canResend ? (
                  <button
                    onClick={handleResend}
                    className="text-primary text-sm hover:underline"
                  >
                    Resend code
                  </button>
                ) : (
                  <p className="text-text-muted text-sm">
                    Resend code in {countdown}s
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
