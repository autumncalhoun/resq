"use client"

import type React from "react"

import { useMockAuth } from "@/lib/mock-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

interface Organization {
  id: string
  name: string
}

export default function AddDogPage() {
  const { user, profile } = useMockAuth()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [formData, setFormData] = useState({
    organization_id: "",
    name: "",
    breed: "",
    age_years: "",
    age_months: "",
    size: "",
    gender: "",
    description: "",
    medical_notes: "",
    behavioral_notes: "",
    adoption_fee: "",
    location_city: "",
    location_state: "",
  })
  const [photos, setPhotos] = useState<string[]>([])
  const [newPhotoUrl, setNewPhotoUrl] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadUserOrganizations()
  }, [])

  const loadUserOrganizations = async () => {
    const mockOrgs = [
      { id: "1", name: "Demo Rescue Organization" },
      { id: "2", name: "Happy Tails Rescue" },
    ]
    setOrganizations(mockOrgs)
    setFormData((prev) => ({ ...prev, organization_id: mockOrgs[0].id }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Mock dog submission:", {
        ...formData,
        age_years: formData.age_years ? Number.parseInt(formData.age_years) : null,
        age_months: formData.age_months ? Number.parseInt(formData.age_months) : null,
        adoption_fee: formData.adoption_fee ? Number.parseFloat(formData.adoption_fee) : null,
        photos: JSON.stringify(photos),
        created_by: user?.id,
      })

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      router.push("/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const addPhoto = () => {
    if (newPhotoUrl.trim()) {
      setPhotos((prev) => [...prev, newPhotoUrl.trim()])
      setNewPhotoUrl("")
    }
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  if (organizations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Loading Organizations...</CardTitle>
            <CardDescription>Please wait while we load your organizations.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-2xl">Add New Dog</CardTitle>
            <CardDescription>Create a profile for a dog available for adoption</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="organization_id">Organization *</Label>
                <Select
                  value={formData.organization_id}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, organization_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Dog Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Buddy"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="breed">Breed</Label>
                  <Input
                    id="breed"
                    name="breed"
                    value={formData.breed}
                    onChange={handleChange}
                    placeholder="Golden Retriever"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age_years">Age (Years)</Label>
                  <Input
                    id="age_years"
                    name="age_years"
                    type="number"
                    min="0"
                    max="20"
                    value={formData.age_years}
                    onChange={handleChange}
                    placeholder="2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age_months">Age (Months)</Label>
                  <Input
                    id="age_months"
                    name="age_months"
                    type="number"
                    min="0"
                    max="11"
                    value={formData.age_months}
                    onChange={handleChange}
                    placeholder="6"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">Size</Label>
                  <Select
                    value={formData.size}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, size: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
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
                    value={formData.gender}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, gender: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Tell potential adopters about this dog's personality, likes, and needs..."
                  rows={4}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="medical_notes">Medical Notes</Label>
                  <Textarea
                    id="medical_notes"
                    name="medical_notes"
                    value={formData.medical_notes}
                    onChange={handleChange}
                    placeholder="Any medical conditions, medications, or special needs..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="behavioral_notes">Behavioral Notes</Label>
                  <Textarea
                    id="behavioral_notes"
                    name="behavioral_notes"
                    value={formData.behavioral_notes}
                    onChange={handleChange}
                    placeholder="Behavior with kids, other pets, training notes..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adoption_fee">Adoption Fee ($)</Label>
                  <Input
                    id="adoption_fee"
                    name="adoption_fee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.adoption_fee}
                    onChange={handleChange}
                    placeholder="250.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location_city">City</Label>
                  <Input
                    id="location_city"
                    name="location_city"
                    value={formData.location_city}
                    onChange={handleChange}
                    placeholder="San Francisco"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location_state">State</Label>
                  <Input
                    id="location_state"
                    name="location_state"
                    value={formData.location_state}
                    onChange={handleChange}
                    placeholder="CA"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Photos</Label>
                <div className="flex gap-2">
                  <Input
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    placeholder="Enter photo URL"
                    className="flex-1"
                  />
                  <Button type="button" onClick={addPhoto} variant="outline">
                    Add Photo
                  </Button>
                </div>
                {photos.length > 0 && (
                  <div className="space-y-2">
                    {photos.map((photo, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <img
                          src={photo || "/placeholder.svg"}
                          alt={`Photo ${index + 1}`}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <span className="flex-1 text-sm truncate">{photo}</span>
                        <Button type="button" onClick={() => removePhoto(index)} variant="outline" size="sm">
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
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
                  disabled={isLoading || !formData.organization_id}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? "Adding..." : "Add Dog"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
