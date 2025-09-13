import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface MessageThread {
  id: string
  thread_type: string
  thread_id: string
  latest_message: string
  latest_message_time: string
  unread_count: number
  dog_name: string
  dog_photos: string
  organization_name: string
  status: string
}

export default async function MessagesPage() {
  const supabase = await createClient()

  const { data: user, error } = await supabase.auth.getUser()
  if (error || !user?.user) {
    redirect("/auth/login")
  }

  // Get user profile to determine role
  const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", user.user.id).single()

  // Get message threads for this user
  const threads: MessageThread[] = []

  if (profile?.user_type === "adopter") {
    // For adopters, get their inquiries and applications with latest messages
    const { data: inquiryThreads } = await supabase
      .from("inquiries")
      .select(`
        id,
        status,
        dogs (name, photos, organizations (name))
      `)
      .eq("inquirer_id", user.user.id)

    const { data: applicationThreads } = await supabase
      .from("adoption_applications")
      .select(`
        id,
        status,
        dogs (name, photos, organizations (name))
      `)
      .eq("applicant_id", user.user.id)

    // Combine and format threads
    if (inquiryThreads) {
      for (const inquiry of inquiryThreads) {
        const { data: latestMessage } = await supabase
          .from("messages")
          .select("content, created_at")
          .eq("thread_type", "inquiry")
          .eq("thread_id", inquiry.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        threads.push({
          id: `inquiry-${inquiry.id}`,
          thread_type: "inquiry",
          thread_id: inquiry.id,
          latest_message: latestMessage?.content || "No messages yet",
          latest_message_time: latestMessage?.created_at || inquiry.created_at,
          unread_count: 0,
          dog_name: inquiry.dogs.name,
          dog_photos: inquiry.dogs.photos,
          organization_name: inquiry.dogs.organizations.name,
          status: inquiry.status,
        })
      }
    }

    if (applicationThreads) {
      for (const application of applicationThreads) {
        const { data: latestMessage } = await supabase
          .from("messages")
          .select("content, created_at")
          .eq("thread_type", "application")
          .eq("thread_id", application.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        threads.push({
          id: `application-${application.id}`,
          thread_type: "application",
          thread_id: application.id,
          latest_message: latestMessage?.content || "No messages yet",
          latest_message_time: latestMessage?.created_at || application.created_at,
          unread_count: 0,
          dog_name: application.dogs.name,
          dog_photos: application.dogs.photos,
          organization_name: application.dogs.organizations.name,
          status: application.status,
        })
      }
    }
  } else {
    // For rescue staff, get inquiries and applications for their organization's dogs
    const { data: orgMemberships } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.user.id)

    if (orgMemberships && orgMemberships.length > 0) {
      const orgIds = orgMemberships.map((m) => m.organization_id)

      // Get inquiries for organization's dogs
      const { data: inquiryThreads } = await supabase
        .from("inquiries")
        .select(`
          id,
          status,
          dogs!inner (
            name,
            photos,
            organization_id,
            organizations (name)
          )
        `)
        .in("dogs.organization_id", orgIds)

      // Get applications for organization's dogs
      const { data: applicationThreads } = await supabase
        .from("adoption_applications")
        .select(`
          id,
          status,
          dogs!inner (
            name,
            photos,
            organization_id,
            organizations (name)
          )
        `)
        .in("dogs.organization_id", orgIds)

      // Format inquiry threads
      if (inquiryThreads) {
        for (const inquiry of inquiryThreads) {
          const { data: latestMessage } = await supabase
            .from("messages")
            .select("content, created_at")
            .eq("thread_type", "inquiry")
            .eq("thread_id", inquiry.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single()

          threads.push({
            id: `inquiry-${inquiry.id}`,
            thread_type: "inquiry",
            thread_id: inquiry.id,
            latest_message: latestMessage?.content || "New inquiry",
            latest_message_time: latestMessage?.created_at || inquiry.created_at,
            unread_count: 0,
            dog_name: inquiry.dogs.name,
            dog_photos: inquiry.dogs.photos,
            organization_name: inquiry.dogs.organizations.name,
            status: inquiry.status,
          })
        }
      }

      // Format application threads
      if (applicationThreads) {
        for (const application of applicationThreads) {
          const { data: latestMessage } = await supabase
            .from("messages")
            .select("content, created_at")
            .eq("thread_type", "application")
            .eq("thread_id", application.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single()

          threads.push({
            id: `application-${application.id}`,
            thread_type: "application",
            thread_id: application.id,
            latest_message: latestMessage?.content || "New application",
            latest_message_time: latestMessage?.created_at || application.created_at,
            unread_count: 0,
            dog_name: application.dogs.name,
            dog_photos: application.dogs.photos,
            organization_name: application.dogs.organizations.name,
            status: application.status,
          })
        }
      }
    }
  }

  // Sort threads by latest message time
  threads.sort((a, b) => new Date(b.latest_message_time).getTime() - new Date(a.latest_message_time).getTime())

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "responded":
      case "under_review":
        return "bg-blue-100 text-blue-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
      case "closed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-500 mr-4">
                ← Back to Dashboard
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
            </div>
            <div className="text-sm text-gray-600">
              {threads.length} conversation{threads.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {threads.length === 0 ? (
            <Card className="text-center py-12">
              <CardHeader>
                <CardTitle>No Messages Yet</CardTitle>
                <CardDescription>
                  {profile?.user_type === "adopter"
                    ? "Start by browsing dogs and sending inquiries or applications"
                    : "Messages from potential adopters will appear here"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profile?.user_type === "adopter" && (
                  <Button asChild>
                    <Link href="/browse">Browse Available Dogs</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {threads.map((thread) => {
                const photos = thread.dog_photos ? JSON.parse(thread.dog_photos) : []
                const mainPhoto = photos[0] || "/placeholder.svg"
                const linkPath =
                  thread.thread_type === "inquiry"
                    ? `/inquiries/${thread.thread_id}`
                    : `/applications/${thread.thread_id}`

                return (
                  <Card key={thread.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <Link href={linkPath} className="block">
                        <div className="flex gap-4">
                          <div className="w-12 h-12 flex-shrink-0">
                            <img
                              src={mainPhoto || "/placeholder.svg"}
                              alt={thread.dog_name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <div>
                                <h3 className="font-semibold text-gray-900 truncate">{thread.dog_name}</h3>
                                <p className="text-sm text-gray-600 truncate">{thread.organization_name}</p>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <Badge className={getStatusColor(thread.status)} variant="secondary">
                                  {thread.status.replace("_", " ")}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {thread.thread_type}
                                </Badge>
                              </div>
                            </div>

                            <p className="text-sm text-gray-700 truncate mb-2">{thread.latest_message}</p>

                            <div className="flex justify-between items-center text-xs text-gray-500">
                              <span>
                                {new Date(thread.latest_message_time).toLocaleDateString([], {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              {thread.unread_count > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {thread.unread_count} new
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
