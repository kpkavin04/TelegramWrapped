import { useState, useCallback } from "react"
import type { Chat, WrappedResult } from "@/lib/types"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000"

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useApi() {
  const [sessionId, setSessionId] = useState<string | null>(
    localStorage.getItem("session_id")
  )

  const request = useCallback(
    async <T>(
      endpoint: string,
      options?: RequestInit
    ): Promise<T> => {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      }

      if (sessionId) {
        (headers as Record<string, string>)["X-Session-Id"] = sessionId
      }

      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: "Request failed" }))
        throw new Error(error.detail || "Request failed")
      }

      return response.json()
    },
    [sessionId]
  )

  // Auth endpoints
  const sendCode = async (phone: string) => {
    const data = await request<{ session_id: string }>("/auth/send-code", {
      method: "POST",
      body: JSON.stringify({ phone }),
    })
    setSessionId(data.session_id)
    localStorage.setItem("session_id", data.session_id)
    return data
  }

  const verifyCode = async (code: string, password?: string) => {
    return request<{ success: boolean; needs_2fa?: boolean }>("/auth/verify", {
      method: "POST",
      body: JSON.stringify({ code, password }),
    })
  }

  // Chat endpoints
  const getChats = async (page = 1, limit = 20) => {
    return request<{ chats: Chat[]; total: number; pages: number }>(
      `/chats?page=${page}&limit=${limit}`
    )
  }

  // Wrapped endpoints
  const generateWrapped = async (chatIds: string[]) => {
    return request<{ task_id: string }>("/wrapped/generate", {
      method: "POST",
      body: JSON.stringify({ chat_ids: chatIds }),
    })
  }

  const getWrappedStatus = async (taskId: string) => {
    return request<{ status: string; progress?: number; result?: WrappedResult }>(
      `/wrapped/status/${taskId}`
    )
  }

  const getWrappedResult = async (taskId: string) => {
    return request<WrappedResult>(`/wrapped/result/${taskId}`)
  }

  const logout = () => {
    setSessionId(null)
    localStorage.removeItem("session_id")
  }

  return {
    sessionId,
    isAuthenticated: !!sessionId,
    sendCode,
    verifyCode,
    getChats,
    generateWrapped,
    getWrappedStatus,
    getWrappedResult,
    logout,
  }
}

// Simple state hook for async operations
export function useAsyncState<T>(initialData: T | null = null): [
  ApiState<T>,
  {
    setLoading: () => void
    setData: (data: T) => void
    setError: (error: string) => void
    reset: () => void
  }
] {
  const [state, setState] = useState<ApiState<T>>({
    data: initialData,
    loading: false,
    error: null,
  })

  return [
    state,
    {
      setLoading: () => setState({ data: null, loading: true, error: null }),
      setData: (data: T) => setState({ data, loading: false, error: null }),
      setError: (error: string) => setState({ data: null, loading: false, error }),
      reset: () => setState({ data: initialData, loading: false, error: null }),
    },
  ]
}
