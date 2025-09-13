"use client"

import type React from "react"
import Link from "next/link"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useParams, useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  profiles: {
    full_name: string
    user_type: string
  }
}

interface Application {
  id: string
  status: string
  form_data: string
  created_at: string
  applicant_id: string
  dogs: {
    id: string
    name: string
    breed: string
    photos: string
    organizations: {
      name: string
    }
  }
  adoption_forms: {
    title: string
  }
}

export default function ApplicationMessagesPage() {
  const params = useParams()
  const router = useRouter()
  const applicationId = params.id as string
  const [application, setApplication] = useState<Application | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadApplicationAndMessages()
    getCurrentUser()
  }, [applicationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const getCurrentUser = async () => {
    const supabase = createClient()
    const { data: user } = await supabase.auth.getUser()
    if (user.user) {
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.user.id).single()
      setCurrentUser({ ...user.user, profile })
    }
  }

  const loadApplicationAndMessages = async () => {
    const supabase = createClient()

    // Load application details
    const { data: applicationData } = await supabase
      .from("adoption_applications")
      .select(`
        *,
        dogs (
          id,
          name,
          breed,
          photos,
          organizations (name)
        ),
        adoption_forms (title)
      `)
      .eq("id", applicationId)
      .single()

    if (applicationData) {
      setApplication(applicationData)

      // Load messages for this application
      const { data: messagesData } = await supabase
        .from("messages")
        .select(`
          *,
          profiles (full_name, user_type)
        `)
        .eq("thread_type", "application")
        .eq("thread_id", applicationId)
        .order("created_at", { ascending: true })

      if (messagesData) {
        setMessages(messagesData)
      }
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !currentUser) return

    const supabase = createClient()
    setIsLoading(true)

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          thread_type: "application",
          thread_id: applicationId,
          sender_id: currentUser.id,
          content: newMessage.trim(),
        })
        .select(`
          *,
          profiles (full_name, user_type)
        `)
        .single()

      if (error) throw error

      setMessages((prev) => [...prev, data])
      setNewMessage("")

      // Update application status to under_review if it's from rescue
      if (currentUser.profile?.user_type === "rescue_admin" || currentUser.profile?.user_type === "foster") {
        if (application?.status === "pending") {
          await supabase.from("adoption_applications").update({ status: "under_review" }).eq("id", applicationId)
        }
      }
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "under_review":
        return "bg-blue-100 text-blue-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (!application || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading conversation...</p>
      </div>
    )
  }

  const photos = application.dogs.photos ? JSON.parse(application.dogs.photos) : []
  const mainPhoto = photos[0] || "/placeholder.svg"

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="mr-4 p-0 h-auto text-blue-600 hover:text-blue-500"
              >
                ← Back
              </Button>
              <div className="flex items-center gap-3">
                <img
                  src={mainPhoto || "/placeholder.svg"}
                  alt={application.dogs.name}
                  className="w-8 h-8 object-cover rounded-full"
                />
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">{application.dogs.name}</h1>
                  <p className="text-sm text-gray-600">{application.dogs.organizations.name}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={getStatusColor(application.status)}>{application.status.replace("_", " ")}</Badge>
              {application.status === "approved" && application.applicant_id === currentUser.id && (
                <Button asChild className="bg-green-600 hover:bg-green-700">
                  <Link href={`/applications/${applicationId}/payment`}>Complete Payment</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card className="h-[600px] flex flex-col">
            {/* Application Info */}
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Adoption Application</CardTitle>
              <CardDescription>
                {application.adoption_forms.title} • Submitted {new Date(application.created_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>

            <Separator />

            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">
                    No messages yet. Start the conversation by sending a message below.
                  </p>
                </div>
              ) : (
                messages.map((message) => {
                  const isCurrentUser = message.sender_id === currentUser.id

                  return (
                    <div
                      key={message.id}
                      className={`flex items-start gap-3 ${isCurrentUser ? "flex-row-reverse" : ""}`}
                    >
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-gray-600">
                          {message.profiles?.full_name?.charAt(0) || "U"}
                        </span>
                      </div>
                      <div className={`flex-1 max-w-xs ${isCurrentUser ? "text-right" : ""}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {isCurrentUser ? "You" : message.profiles?.full_name || "User"}
                          </span>
                          <span className="text-xs text-gray-500">{formatTime(message.created_at)}</span>
                        </div>
                        <div
                          className={`p-3 rounded-lg text-sm ${
                            isCurrentUser ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </CardContent>

            <Separator />

            {/* Message Input */}
            <div className="p-4">
              <form onSubmit={sendMessage} className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={isLoading || !newMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? "Sending..." : "Send"}
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
