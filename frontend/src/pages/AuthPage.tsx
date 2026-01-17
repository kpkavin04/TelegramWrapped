import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Send } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PhoneInput } from "@/components/auth/PhoneInput"
import { useApi } from "@/hooks/useApi"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"

export function AuthPage() {
  const navigate = useNavigate()
  const { sendCode } = useApi()
  const [phone, setPhone] = useState("+1")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await sendCode(phone)
      navigate("/verify", { state: { phone } })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4"
            >
              <Send className="w-8 h-8 text-primary" />
            </motion.div>
            <CardTitle className="text-2xl">
              <span className="bg-gradient-to-r from-primary to-[#00c6ff] bg-clip-text text-transparent">
                Telegram Wrapped
              </span>
            </CardTitle>
            <CardDescription>
              Enter your phone number to see your year in review
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <PhoneInput
                value={phone}
                onChange={setPhone}
                disabled={loading}
              />

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
                disabled={loading || phone.length < 8}
              >
                {loading ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : null}
                {loading ? "Sending..." : "Continue"}
              </Button>
            </form>

            <p className="mt-4 text-xs text-text-muted text-center">
              We'll send a code to verify your Telegram account
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
