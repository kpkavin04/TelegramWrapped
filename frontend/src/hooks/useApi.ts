import { useState, useCallback } from "react"
import type { Chat, WrappedResult } from "@/lib/types"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000"

export function useApi() {
  const [sessionId, setSessionId] = useState<string | null>(
    localStorage.getItem("session_id")
  )
  const [userId, setUserId] = useState<string | null>(
    localStorage.getItem("user_id")
  )
  const [phone, setPhone] = useState<string | null>(
    localStorage.getItem("phone")
  )
  const [code, setCode] = useState<string | null>(
    localStorage.getItem("code")
  )
  const [password, setPassword] = useState<string | null>(
    localStorage.getItem("password")
  )

  const request = useCallback(
    async <T>(
      endpoint: string,
      options?: RequestInit
    ): Promise<T> => {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options?.headers || {}),
        },
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: "Request failed" }))
        throw new Error(error.detail || "Request failed")
      }

      return response.json()
    },
    []
  )

  // POST /auth/send-otp
  const sendCode = async (phoneNumber: string) => {
    const data = await request<{ session_id: string }>("/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ phone: phoneNumber }),
    })
    setSessionId(data.session_id)
    setPhone(phoneNumber)
    localStorage.setItem("session_id", data.session_id)
    localStorage.setItem("phone", phoneNumber)
    return data
  }

  // POST /auth/verify-otp
  const verifyCode = async (otpCode: string, pwd?: string) => {
    if (!sessionId) throw new Error("No session")

    const body: { session_id: string; code: string; password?: string } = {
      session_id: sessionId,
      code: otpCode,
    }
    if (pwd) {
      body.password = pwd
    }

    const data = await request<{ status: string; user_id: number; first_name: string }>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify(body),
    })

    setUserId(String(data.user_id))
    setCode(otpCode)
    localStorage.setItem("user_id", String(data.user_id))
    localStorage.setItem("code", otpCode)

    // Store password if provided (for 2FA users)
    if (pwd) {
      setPassword(pwd)
      localStorage.setItem("password", pwd)
    }

    return {
      success: data.status === "authenticated",
      needs_2fa: false,
      user_id: data.user_id,
      first_name: data.first_name
    }
  }

  // GET /chats/top
  const getChats = async () => {
    if (!sessionId) throw new Error("No session")

    const data = await request<{ top_chats: Array<{ chat_id: number; name: string; unread_count: number }> }>(
      `/chats/top?session_id=${encodeURIComponent(sessionId)}`
    )

    // Transform to frontend Chat format
    const chats: Chat[] = data.top_chats.map(c => ({
      id: String(c.chat_id),
      name: c.name || "Unknown",
      messageCount: c.unread_count || 0,
      type: "private" as const
    }))

    return { chats, total: chats.length, pages: 1 }
  }

  // POST /chats/messages - returns wrapped result directly (no async task)
  const generateWrapped = async (chatIds: string[]): Promise<WrappedResult> => {
    if (!sessionId) throw new Error("No session")
    if (!phone) throw new Error("No phone - please re-authenticate")
    if (!code) throw new Error("No code - please re-authenticate")

    const body: Record<string, unknown> = {
      session_id: sessionId,
      chat_ids: chatIds.map(id => parseInt(id, 10)),
      phone,
      code,
    }

    // Include password if available (for 2FA users)
    if (password) {
      body.password = password
    }

    const data = await request<WrappedResult>("/chats/messages", {
      method: "POST",
      body: JSON.stringify(body),
    })

    return data
  }

  const logout = () => {
    setSessionId(null)
    setUserId(null)
    setPhone(null)
    setCode(null)
    setPassword(null)
    localStorage.removeItem("session_id")
    localStorage.removeItem("user_id")
    localStorage.removeItem("phone")
    localStorage.removeItem("code")
    localStorage.removeItem("password")
  }

  return {
    sessionId,
    userId,
    phone,
    code,
    isAuthenticated: !!sessionId,
    sendCode,
    verifyCode,
    getChats,
    generateWrapped,
    logout,
  }
}
