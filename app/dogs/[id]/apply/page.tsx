"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useRouter, useParams } from "next/navigation"
import { useState, useEffect } from "react"

interface Dog {
  id: string
  name: string
  breed: string
  organization_id: string
  organizations: {
    name: string
  }
}

interface FormField {
  id: string
  field_type: string
  label: string
  placeholder: string
  required: boolean
  options: string[]
  order_index: number
}

interface AdoptionForm {
  id: string
  title: string
  description: string
  form_fields: FormField[]
}

export default function ApplyPage() {
  const params = useParams()
  const dogId = params.id as string
  const [dog, setDog] = useState<Dog | null>(null)
  const [form, setForm] = useState<AdoptionForm | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadDogAndForm()
  }, [dogId])

  const loadDogAndForm = async () => {
    const supabase = createClient()

    // Load dog details
    const { data: dogData } = await supabase
      .from("dogs")
      .select(`
        *,
        organizations (name)
      `)
      .eq("id", dogId)
      .single()

    if (dogData) {
      setDog(dogData)

      // Load active adoption form for this organization
      const { data: formData } = await supabase
        .from("adoption_forms")
        .select(`
          *,
          form_fields (*)
        `)
        .eq("organization_id", dogData.organization_id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (formData) {
        // Parse options for fields that have them
        const fieldsWithParsedOptions = formData.form_fields.map((field: any) => ({
          ...field,
          options: field.options ? JSON.parse(field.options) : [],
        }))

        setForm({
          ...formData,
          form_fields: fieldsWithParsedOptions.sort((a: any, b: any) => a.order_index - b.order_index),
        })
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error("Please sign in to submit an application")

      // Validate required fields
      const requiredFields = form?.form_fields.filter((field) => field.required) || []
      for (const field of requiredFields) {
        if (!formData[field.id] || (Array.isArray(formData[field.id]) && formData[field.id].length === 0)) {
          throw new Error(`${field.label} is required`)
        }
      }

      const { error } = await supabase.from("adoption_applications").insert({
        dog_id: dogId,
        form_id: form!.id,
        applicant_id: user.user.id,
        form_data: JSON.stringify(formData),
      })

      if (error) throw error

      router.push("/applications?success=true")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }))
  }

  const handleCheckboxChange = (fieldId: string, option: string, checked: boolean) => {
    setFormData((prev) => {
      const currentValues = prev[fieldId] || []
      if (checked) {
        return {
          ...prev,
          [fieldId]: [...currentValues, option],
        }
      } else {
        return {
          ...prev,
          [fieldId]: currentValues.filter((val: string) => val !== option),
        }
      }
    })
  }

  if (!dog || !form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
            <CardDescription>{!dog ? "Loading dog information..." : "Loading application form..."}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-lg border-0 mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">Apply to Adopt {dog.name}</CardTitle>
            <CardDescription>
              {dog.breed} • {dog.organizations.name}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle>{form.title}</CardTitle>
            {form.description && <CardDescription>{form.description}</CardDescription>}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {form.form_fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label className="text-sm font-medium">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>

                  {field.field_type === "text" && (
                    <Input
                      value={formData[field.id] || ""}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  )}

                  {field.field_type === "textarea" && (
                    <Textarea
                      value={formData[field.id] || ""}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      required={field.required}
                      rows={4}
                    />
                  )}

                  {field.field_type === "email" && (
                    <Input
                      type="email"
                      value={formData[field.id] || ""}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  )}

                  {field.field_type === "phone" && (
                    <Input
                      type="tel"
                      value={formData[field.id] || ""}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  )}

                  {field.field_type === "number" && (
                    <Input
                      type="number"
                      value={formData[field.id] || ""}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  )}

                  {field.field_type === "select" && (
                    <Select
                      value={formData[field.id] || ""}
                      onValueChange={(value) => handleFieldChange(field.id, value)}
                      required={field.required}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={field.placeholder || "Select an option"} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {field.field_type === "radio" && (
                    <RadioGroup
                      value={formData[field.id] || ""}
                      onValueChange={(value) => handleFieldChange(field.id, value)}
                      required={field.required}
                    >
                      {field.options.map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                          <Label htmlFor={`${field.id}-${option}`} className="text-sm">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {field.field_type === "checkbox" && (
                    <div className="space-y-2">
                      {field.options.map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${field.id}-${option}`}
                            checked={(formData[field.id] || []).includes(option)}
                            onCheckedChange={(checked) => handleCheckboxChange(field.id, option, !!checked)}
                          />
                          <Label htmlFor={`${field.id}-${option}`} className="text-sm">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>
              )}

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {isLoading ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
