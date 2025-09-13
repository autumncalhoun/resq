"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"

interface Dog {
  id: string
  name: string
  breed: string
  photos: string
  organizations: {
    name: string
  }
}

export default function InquirePage() {
  const params = useParams()
  const router = useRouter()
  const dogId = params.id as string
  const [dog, setDog] = useState<Dog | null>(null)
  const [message, setMessage] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadDog()
  }, [dogId])

  const loadDog = async () => {
    const supabase = createClient()

    const { data } = await supabase
      .from("dogs")
      .select(`
        id,
        name,
        breed,
        photos,
        organizations (name)
      `)
      .eq("id", dogId)
      .single()

    if (data) {
      setDog(data)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) {
        router.push("/auth/login")
        return
      }

      const { error } = await supabase.from("inquiries").insert({
        dog_id: dogId,
        inquirer_id: user.user.id,
        message: message.trim(),
      })

      if (error) throw error

      router.push("/inquiries?success=true")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (!dog) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  const photos = dog.photos ? JSON.parse(dog.photos) : []
  const mainPhoto = photos[0] || "/cute-dog.png"

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-lg border-0 mb-6">
          <CardContent className="p-6">
            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 flex-shrink-0">
                <img
                  src={mainPhoto || "/placeholder.svg"}
                  alt={dog.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <div>
                <h1 className="text-xl font-semibold">{dog.name}</h1>
                <p className="text-gray-600">
                  {dog.breed} • {dog.organizations.name}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle>Send an Inquiry</CardTitle>
            <CardDescription>Ask questions about {dog.name} or express your interest in adoption</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="message">Your Message *</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`Hi! I'm interested in learning more about ${dog.name}. Could you tell me more about their personality and care needs?`}
                  required
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500">
                  Be specific about your questions or interest. The rescue will respond to your inquiry.
                </p>
              </div>

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>
              )}

              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !message.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? "Sending..." : "Send Inquiry"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
