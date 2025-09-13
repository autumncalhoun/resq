"use client"

import { createContext, useContext, type ReactNode } from "react"

interface MockUser {
  id: string
  email: string
  user_metadata: {
    full_name: string
    phone: string
    user_type: string
  }
}

interface MockAuthContextType {
  user: MockUser | null
  profile: {
    id: string
    email: string
    full_name: string
    phone: string
    user_type: "rescue_admin" | "foster" | "adopter"
  } | null
}

const MockAuthContext = createContext<MockAuthContextType>({
  user: null,
  profile: null,
})

export function MockAuthProvider({ children }: { children: ReactNode }) {
  // Mock user as rescue admin for demo purposes
  const mockUser: MockUser = {
    id: "demo-user-123",
    email: "demo@rescue.com",
    user_metadata: {
      full_name: "Demo Rescue Admin",
      phone: "(555) 123-4567",
      user_type: "rescue_admin",
    },
  }

  const mockProfile = {
    id: "demo-user-123",
    email: "demo@rescue.com",
    full_name: "Demo Rescue Admin",
    phone: "(555) 123-4567",
    user_type: "rescue_admin" as const,
  }

  return (
    <MockAuthContext.Provider value={{ user: mockUser, profile: mockProfile }}>{children}</MockAuthContext.Provider>
  )
}

export function useMockAuth() {
  return useContext(MockAuthContext)
}
