"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"

interface Dog {
  id: string
  name: string
  breed: string
  age_years: number
  age_months: number
  size: string
  gender: string
  description: string
  medical_notes: string
  behavioral_notes: string
  adoption_fee: number
  status: string
  location_city: string
  location_state: string
  photos: string
  created_at: string
  organizations: {
    id: string
    name: string
    description: string
    city: string
    state: string
    phone: string
    email: string
    website: string
  }
}

export default function DogDetailPage() {
  const params = useParams()
  const router = useRouter()
  const dogId = params.id as string
  const [dog, setDog] = useState<Dog | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  useEffect(() => {
    loadDog()
  }, [dogId])

  const loadDog = async () => {
    const supabase = createClient()
    setLoading(true)

    const { data } = await supabase
      .from("dogs")
      .select(`
        *,
        organizations (*)
      `)
      .eq("id", dogId)
      .single()

    if (data) {
      setDog(data)
    }
    setLoading(false)
  }

  const formatAge = (years: number, months: number) => {
    const parts = []
    if (years) parts.push(`${years} year${years > 1 ? "s" : ""}`)
    if (months) parts.push(`${months} month${months > 1 ? "s" : ""}`)
    return parts.join(" and ") || "Age unknown"
  }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading dog details...</p>
      </div>
    )
  }

  if (!dog) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle>Dog Not Found</CardTitle>
            <CardDescription>The dog you're looking for doesn't exist or has been removed.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/browse")}>Browse Other Dogs</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const photos = dog.photos ? JSON.parse(dog.photos) : []
  const hasPhotos = photos.length > 0

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/browse" className="text-blue-600 hover:text-blue-500 mr-4">
                ← Back to Browse
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">{dog.name}</h1>
            </div>
            <Badge className={getStatusColor(dog.status)}>{dog.status}</Badge>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Photos */}
            <div className="space-y-4">
              <Card className="overflow-hidden">
                <div className="aspect-video relative">
                  <img
                    src={hasPhotos ? photos[currentPhotoIndex] : "/placeholder.svg?height=400&width=600&query=cute dog"}
                    alt={dog.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </Card>

              {hasPhotos && photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {photos.map((photo: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPhotoIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                        index === currentPhotoIndex ? "border-blue-500" : "border-gray-200"
                      }`}
                    >
                      <img
                        src={photo || "/placeholder.svg"}
                        alt={`${dog.name} photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dog Details */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">{dog.name}</CardTitle>
                      <CardDescription className="text-lg mt-1">
                        {dog.breed} • {formatAge(dog.age_years, dog.age_months)}
                      </CardDescription>
                    </div>
                    {dog.adoption_fee && (
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">${dog.adoption_fee}</div>
                        <div className="text-sm text-gray-600">Adoption Fee</div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {dog.size && (
                      <div>
                        <span className="font-medium text-gray-700">Size:</span>
                        <span className="ml-2 capitalize">{dog.size}</span>
                      </div>
                    )}
                    {dog.gender && (
                      <div>
                        <span className="font-medium text-gray-700">Gender:</span>
                        <span className="ml-2 capitalize">{dog.gender}</span>
                      </div>
                    )}
                    {(dog.location_city || dog.organizations.city) && (
                      <div className="col-span-2">
                        <span className="font-medium text-gray-700">Location:</span>
                        <span className="ml-2">
                          {dog.location_city || dog.organizations.city}, {dog.location_state || dog.organizations.state}
                        </span>
                      </div>
                    )}
                  </div>

                  {dog.status === "available" && (
                    <div className="flex gap-3 mt-6">
                      <Button asChild className="flex-1 bg-blue-600 hover:bg-blue-700">
                        <Link href={`/dogs/${dog.id}/apply`}>Apply for Adoption</Link>
                      </Button>
                      <Button asChild variant="outline" className="flex-1 bg-transparent">
                        <Link href={`/dogs/${dog.id}/inquire`}>Send Inquiry</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {dog.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">About {dog.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">{dog.description}</p>
                  </CardContent>
                </Card>
              )}

              {(dog.medical_notes || dog.behavioral_notes) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Additional Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {dog.medical_notes && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Medical Notes</h4>
                        <p className="text-gray-700 text-sm leading-relaxed">{dog.medical_notes}</p>
                      </div>
                    )}
                    {dog.behavioral_notes && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Behavioral Notes</h4>
                        <p className="text-gray-700 text-sm leading-relaxed">{dog.behavioral_notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Organization Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Rescue Organization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{dog.organizations.name}</h4>
                      {dog.organizations.description && (
                        <p className="text-gray-600 text-sm mt-1">{dog.organizations.description}</p>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-2 text-sm">
                      {dog.organizations.email && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700">Email:</span>
                          <a href={`mailto:${dog.organizations.email}`} className="text-blue-600 hover:text-blue-500">
                            {dog.organizations.email}
                          </a>
                        </div>
                      )}
                      {dog.organizations.phone && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700">Phone:</span>
                          <a href={`tel:${dog.organizations.phone}`} className="text-blue-600 hover:text-blue-500">
                            {dog.organizations.phone}
                          </a>
                        </div>
                      )}
                      {dog.organizations.website && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700">Website:</span>
                          <a
                            href={dog.organizations.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-500"
                          >
                            Visit Website
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
