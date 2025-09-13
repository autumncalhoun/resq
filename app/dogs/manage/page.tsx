import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface Dog {
  id: string
  name: string
  breed: string
  age_years: number
  age_months: number
  size: string
  gender: string
  status: string
  adoption_fee: number
  location_city: string
  location_state: string
  photos: string
  organizations: {
    name: string
  }
}

export default async function ManageDogsPage() {
  const supabase = await createClient()

  const { data: user, error } = await supabase.auth.getUser()
  if (error || !user?.user) {
    redirect("/auth/login")
  }

  // Get user's organizations and dogs
  const { data: dogs } = await supabase
    .from("dogs")
    .select(`
      *,
      organizations (name)
    `)
    .in("organization_id", supabase.from("organization_members").select("organization_id").eq("user_id", user.user.id))
    .order("created_at", { ascending: false })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "adopted":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatAge = (years: number, months: number) => {
    const parts = []
    if (years) parts.push(`${years}y`)
    if (months) parts.push(`${months}m`)
    return parts.join(" ") || "Unknown"
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
              <h1 className="text-xl font-semibold text-gray-900">Manage Dogs</h1>
            </div>
            <Button asChild>
              <Link href="/dogs/add">Add New Dog</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {!dogs || dogs.length === 0 ? (
            <Card className="text-center py-12">
              <CardHeader>
                <CardTitle>No Dogs Yet</CardTitle>
                <CardDescription>Start by adding your first dog profile</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/dogs/add">Add Your First Dog</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {dogs.map((dog: Dog) => {
                const photos = dog.photos ? JSON.parse(dog.photos) : []
                const mainPhoto = photos[0] || "/cute-dog.png"

                return (
                  <Card key={dog.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video relative">
                      <img
                        src={mainPhoto || "/placeholder.svg"}
                        alt={dog.name}
                        className="w-full h-full object-cover"
                      />
                      <Badge className={`absolute top-2 right-2 ${getStatusColor(dog.status)}`}>{dog.status}</Badge>
                    </div>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{dog.name}</CardTitle>
                          <CardDescription>
                            {dog.breed} • {formatAge(dog.age_years, dog.age_months)}
                          </CardDescription>
                        </div>
                        <div className="text-right text-sm text-gray-600">
                          {dog.size && <div className="capitalize">{dog.size}</div>}
                          {dog.gender && <div className="capitalize">{dog.gender}</div>}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Organization:</span>
                          <span>{dog.organizations?.name}</span>
                        </div>
                        {dog.location_city && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Location:</span>
                            <span>
                              {dog.location_city}, {dog.location_state}
                            </span>
                          </div>
                        )}
                        {dog.adoption_fee && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Adoption Fee:</span>
                            <span className="font-medium">${dog.adoption_fee}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                          <Link href={`/dogs/${dog.id}/edit`}>Edit</Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                          <Link href={`/dogs/${dog.id}`}>View</Link>
                        </Button>
                      </div>
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
