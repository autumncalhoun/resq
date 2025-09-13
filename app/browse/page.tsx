"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
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
  adoption_fee: number
  location_city: string
  location_state: string
  photos: string
  organizations: {
    id: string
    name: string
    city: string
    state: string
  }
}

export default function BrowsePage() {
  const [dogs, setDogs] = useState<Dog[]>([])
  const [filteredDogs, setFilteredDogs] = useState<Dog[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: "",
    breed: "",
    size: "",
    gender: "",
    location: "",
    minAge: "",
    maxAge: "",
  })

  useEffect(() => {
    loadDogs()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [dogs, filters])

  const loadDogs = async () => {
    const supabase = createClient()
    setLoading(true)

    const { data } = await supabase
      .from("dogs")
      .select(`
        *,
        organizations (id, name, city, state)
      `)
      .eq("status", "available")
      .order("created_at", { ascending: false })

    if (data) {
      setDogs(data)
    }
    setLoading(false)
  }

  const applyFilters = () => {
    let filtered = [...dogs]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(
        (dog) =>
          dog.name.toLowerCase().includes(searchLower) ||
          dog.breed?.toLowerCase().includes(searchLower) ||
          dog.description?.toLowerCase().includes(searchLower) ||
          dog.organizations.name.toLowerCase().includes(searchLower),
      )
    }

    // Breed filter
    if (filters.breed) {
      filtered = filtered.filter((dog) => dog.breed?.toLowerCase().includes(filters.breed.toLowerCase()))
    }

    // Size filter
    if (filters.size) {
      filtered = filtered.filter((dog) => dog.size === filters.size)
    }

    // Gender filter
    if (filters.gender) {
      filtered = filtered.filter((dog) => dog.gender === filters.gender)
    }

    // Location filter
    if (filters.location) {
      const locationLower = filters.location.toLowerCase()
      filtered = filtered.filter(
        (dog) =>
          dog.location_city?.toLowerCase().includes(locationLower) ||
          dog.location_state?.toLowerCase().includes(locationLower) ||
          dog.organizations.city?.toLowerCase().includes(locationLower) ||
          dog.organizations.state?.toLowerCase().includes(locationLower),
      )
    }

    // Age filters
    if (filters.minAge || filters.maxAge) {
      filtered = filtered.filter((dog) => {
        const totalMonths = (dog.age_years || 0) * 12 + (dog.age_months || 0)
        const minMonths = filters.minAge ? Number.parseInt(filters.minAge) * 12 : 0
        const maxMonths = filters.maxAge ? Number.parseInt(filters.maxAge) * 12 : Number.POSITIVE_INFINITY
        return totalMonths >= minMonths && totalMonths <= maxMonths
      })
    }

    setFilteredDogs(filtered)
  }

  const clearFilters = () => {
    setFilters({
      search: "",
      breed: "",
      size: "",
      gender: "",
      location: "",
      minAge: "",
      maxAge: "",
    })
  }

  const formatAge = (years: number, months: number) => {
    const parts = []
    if (years) parts.push(`${years}y`)
    if (months) parts.push(`${months}m`)
    return parts.join(" ") || "Unknown"
  }

  const getUniqueBreeds = () => {
    const breeds = dogs.map((dog) => dog.breed).filter(Boolean)
    return [...new Set(breeds)].sort()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-blue-600 hover:text-blue-500 mr-4">
                ← Home
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Browse Dogs</h1>
            </div>
            <div className="text-sm text-gray-600">
              {filteredDogs.length} of {dogs.length} dogs
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Search & Filter</CardTitle>
              <CardDescription>Find your perfect companion</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    placeholder="Name, breed, or description..."
                    value={filters.search}
                    onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="breed">Breed</Label>
                  <Select
                    value={filters.breed}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, breed: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any breed" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any breed</SelectItem>
                      {getUniqueBreeds().map((breed) => (
                        <SelectItem key={breed} value={breed}>
                          {breed}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size">Size</Label>
                  <Select
                    value={filters.size}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, size: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any size</SelectItem>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                      <SelectItem value="extra_large">Extra Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={filters.gender}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, gender: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any gender</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="City or state..."
                    value={filters.location}
                    onChange={(e) => setFilters((prev) => ({ ...prev, location: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minAge">Min Age (years)</Label>
                  <Input
                    id="minAge"
                    type="number"
                    min="0"
                    max="20"
                    placeholder="0"
                    value={filters.minAge}
                    onChange={(e) => setFilters((prev) => ({ ...prev, minAge: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxAge">Max Age (years)</Label>
                  <Input
                    id="maxAge"
                    type="number"
                    min="0"
                    max="20"
                    placeholder="20"
                    value={filters.maxAge}
                    onChange={(e) => setFilters((prev) => ({ ...prev, maxAge: e.target.value }))}
                  />
                </div>

                <div className="flex items-end">
                  <Button onClick={clearFilters} variant="outline" className="w-full bg-transparent">
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading dogs...</p>
            </div>
          ) : filteredDogs.length === 0 ? (
            <Card className="text-center py-12">
              <CardHeader>
                <CardTitle>No Dogs Found</CardTitle>
                <CardDescription>
                  {dogs.length === 0
                    ? "No dogs are currently available for adoption."
                    : "Try adjusting your filters to see more results."}
                </CardDescription>
              </CardHeader>
              <CardContent>{dogs.length > 0 && <Button onClick={clearFilters}>Clear All Filters</Button>}</CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredDogs.map((dog) => {
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
                      {dog.adoption_fee && (
                        <Badge className="absolute top-2 right-2 bg-blue-600 text-white">${dog.adoption_fee}</Badge>
                      )}
                    </div>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{dog.name}</CardTitle>
                          <CardDescription>
                            {dog.breed} • {formatAge(dog.age_years, dog.age_months)}
                          </CardDescription>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          {dog.size && <div className="capitalize">{dog.size}</div>}
                          {dog.gender && <div className="capitalize">{dog.gender}</div>}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 text-sm">
                        <div className="text-gray-600">
                          <span className="font-medium">Rescue:</span> {dog.organizations.name}
                        </div>
                        {(dog.location_city || dog.organizations.city) && (
                          <div className="text-gray-600">
                            <span className="font-medium">Location:</span> {dog.location_city || dog.organizations.city}
                            , {dog.location_state || dog.organizations.state}
                          </div>
                        )}
                        {dog.description && (
                          <p className="text-gray-700 line-clamp-2 text-xs leading-relaxed">{dog.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                          <Link href={`/dogs/${dog.id}`}>View Details</Link>
                        </Button>
                        <Button asChild size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                          <Link href={`/dogs/${dog.id}/apply`}>Apply</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
