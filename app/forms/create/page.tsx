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
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

interface Organization {
  id: string
  name: string
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

const FIELD_TYPES = [
  { value: "text", label: "Text Input" },
  { value: "textarea", label: "Text Area" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "number", label: "Number" },
  { value: "select", label: "Dropdown" },
  { value: "radio", label: "Radio Buttons" },
  { value: "checkbox", label: "Checkboxes" },
]

export default function CreateFormPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [formData, setFormData] = useState({
    organization_id: "",
    title: "Adoption Application",
    description: "",
  })
  const [fields, setFields] = useState<FormField[]>([])
  const [newField, setNewField] = useState({
    field_type: "",
    label: "",
    placeholder: "",
    required: false,
    options: [""],
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadUserOrganizations()
  }, [])

  const loadUserOrganizations = async () => {
    const supabase = createClient()
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return

    const { data } = await supabase
      .from("organization_members")
      .select(`
        organization_id,
        organizations (id, name)
      `)
      .eq("user_id", user.user.id)
      .eq("role", "admin")

    if (data) {
      const orgs = data.map((item) => item.organizations).filter(Boolean) as Organization[]
      setOrganizations(orgs)
      if (orgs.length === 1) {
        setFormData((prev) => ({ ...prev, organization_id: orgs[0].id }))
      }
    }
  }

  const addField = () => {
    if (!newField.field_type || !newField.label) return

    const field: FormField = {
      id: Date.now().toString(),
      field_type: newField.field_type,
      label: newField.label,
      placeholder: newField.placeholder,
      required: newField.required,
      options:
        newField.field_type === "select" || newField.field_type === "radio" || newField.field_type === "checkbox"
          ? newField.options.filter((opt) => opt.trim())
          : [],
      order_index: fields.length,
    }

    setFields((prev) => [...prev, field])
    setNewField({
      field_type: "",
      label: "",
      placeholder: "",
      required: false,
      options: [""],
    })
  }

  const removeField = (id: string) => {
    setFields((prev) =>
      prev
        .filter((field) => field.id !== id)
        .map((field, index) => ({
          ...field,
          order_index: index,
        })),
    )
  }

  const moveField = (id: string, direction: "up" | "down") => {
    const currentIndex = fields.findIndex((field) => field.id === id)
    if (currentIndex === -1) return

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= fields.length) return

    const newFields = [...fields]
    ;[newFields[currentIndex], newFields[newIndex]] = [newFields[newIndex], newFields[currentIndex]]

    setFields(
      newFields.map((field, index) => ({
        ...field,
        order_index: index,
      })),
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error("Not authenticated")

      // Create the form
      const { data: form, error: formError } = await supabase
        .from("adoption_forms")
        .insert({
          ...formData,
          created_by: user.user.id,
        })
        .select()
        .single()

      if (formError) throw formError

      // Create the form fields
      if (fields.length > 0) {
        const fieldsToInsert = fields.map((field) => ({
          form_id: form.id,
          field_type: field.field_type,
          label: field.label,
          placeholder: field.placeholder,
          required: field.required,
          options: field.options.length > 0 ? JSON.stringify(field.options) : null,
          order_index: field.order_index,
        }))

        const { error: fieldsError } = await supabase.from("form_fields").insert(fieldsToInsert)

        if (fieldsError) throw fieldsError
      }

      router.push("/forms/manage")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const updateNewFieldOption = (index: number, value: string) => {
    const newOptions = [...newField.options]
    newOptions[index] = value
    setNewField((prev) => ({ ...prev, options: newOptions }))
  }

  const addNewFieldOption = () => {
    setNewField((prev) => ({ ...prev, options: [...prev.options, ""] }))
  }

  const removeNewFieldOption = (index: number) => {
    setNewField((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }))
  }

  if (organizations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>You need to be an admin of an organization to create forms.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/dashboard")} className="w-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create Adoption Application Form</h1>
          <p className="text-gray-600">Build a custom form for potential adopters to fill out</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form Builder */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle>Form Settings</CardTitle>
              <CardDescription>Configure your adoption application form</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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

              <div className="space-y-2">
                <Label htmlFor="title">Form Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Adoption Application"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Please fill out this form to apply for adoption..."
                  rows={3}
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Add Form Field</h3>

                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Field Type *</Label>
                      <Select
                        value={newField.field_type}
                        onValueChange={(value) => setNewField((prev) => ({ ...prev, field_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select field type" />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Field Label *</Label>
                      <Input
                        value={newField.label}
                        onChange={(e) => setNewField((prev) => ({ ...prev, label: e.target.value }))}
                        placeholder="Full Name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Placeholder Text</Label>
                    <Input
                      value={newField.placeholder}
                      onChange={(e) => setNewField((prev) => ({ ...prev, placeholder: e.target.value }))}
                      placeholder="Enter your full name"
                    />
                  </div>

                  {(newField.field_type === "select" ||
                    newField.field_type === "radio" ||
                    newField.field_type === "checkbox") && (
                    <div className="space-y-2">
                      <Label>Options</Label>
                      {newField.options.map((option, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={option}
                            onChange={(e) => updateNewFieldOption(index, e.target.value)}
                            placeholder={`Option ${index + 1}`}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            onClick={() => removeNewFieldOption(index)}
                            variant="outline"
                            size="sm"
                            disabled={newField.options.length === 1}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      <Button type="button" onClick={addNewFieldOption} variant="outline" size="sm">
                        Add Option
                      </Button>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="required"
                      checked={newField.required}
                      onCheckedChange={(checked) => setNewField((prev) => ({ ...prev, required: !!checked }))}
                    />
                    <Label htmlFor="required">Required field</Label>
                  </div>

                  <Button
                    type="button"
                    onClick={addField}
                    disabled={!newField.field_type || !newField.label}
                    className="w-full"
                  >
                    Add Field
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Preview */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle>Form Preview</CardTitle>
              <CardDescription>How your form will look to adopters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">{formData.title}</h3>
                  {formData.description && <p className="text-gray-600 text-sm mt-1">{formData.description}</p>}
                </div>

                {fields.length === 0 ? (
                  <p className="text-gray-500 italic">No fields added yet</p>
                ) : (
                  <div className="space-y-4">
                    {fields.map((field) => (
                      <div key={field.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <Label className="text-sm font-medium">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              onClick={() => moveField(field.id, "up")}
                              variant="outline"
                              size="sm"
                              disabled={field.order_index === 0}
                            >
                              ↑
                            </Button>
                            <Button
                              type="button"
                              onClick={() => moveField(field.id, "down")}
                              variant="outline"
                              size="sm"
                              disabled={field.order_index === fields.length - 1}
                            >
                              ↓
                            </Button>
                            <Button type="button" onClick={() => removeField(field.id)} variant="outline" size="sm">
                              ✕
                            </Button>
                          </div>
                        </div>

                        {field.field_type === "text" && <Input placeholder={field.placeholder} disabled />}
                        {field.field_type === "textarea" && (
                          <Textarea placeholder={field.placeholder} disabled rows={3} />
                        )}
                        {field.field_type === "email" && (
                          <Input type="email" placeholder={field.placeholder} disabled />
                        )}
                        {field.field_type === "phone" && <Input type="tel" placeholder={field.placeholder} disabled />}
                        {field.field_type === "number" && (
                          <Input type="number" placeholder={field.placeholder} disabled />
                        )}
                        {field.field_type === "select" && (
                          <Select disabled>
                            <SelectTrigger>
                              <SelectValue placeholder={field.placeholder || "Select an option"} />
                            </SelectTrigger>
                          </Select>
                        )}
                        {field.field_type === "radio" && (
                          <div className="space-y-2">
                            {field.options.map((option, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <input type="radio" disabled />
                                <Label className="text-sm">{option}</Label>
                              </div>
                            ))}
                          </div>
                        )}
                        {field.field_type === "checkbox" && (
                          <div className="space-y-2">
                            {field.options.map((option, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <Checkbox disabled />
                                <Label className="text-sm">{option}</Label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>
                )}

                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading || !formData.organization_id || fields.length === 0}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? "Creating..." : "Create Form"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
