import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface AdoptionForm {
  id: string
  title: string
  description: string
  is_active: boolean
  created_at: string
  organizations: {
    name: string
  }
  form_fields: Array<{
    id: string
    field_type: string
    label: string
  }>
}

export default async function ManageFormsPage() {
  const supabase = await createClient()

  const { data: user, error } = await supabase.auth.getUser()
  if (error || !user?.user) {
    redirect("/auth/login")
  }

  // Get user's forms
  const { data: forms } = await supabase
    .from("adoption_forms")
    .select(`
      *,
      organizations (name),
      form_fields (id, field_type, label)
    `)
    .in(
      "organization_id",
      supabase.from("organization_members").select("organization_id").eq("user_id", user.user.id).eq("role", "admin"),
    )
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-500 mr-4">
                ← Back to Dashboard
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Manage Forms</h1>
            </div>
            <Button asChild>
              <Link href="/forms/create">Create New Form</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {!forms || forms.length === 0 ? (
            <Card className="text-center py-12">
              <CardHeader>
                <CardTitle>No Forms Yet</CardTitle>
                <CardDescription>Create your first adoption application form</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/forms/create">Create Your First Form</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {forms.map((form: AdoptionForm) => (
                <Card key={form.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{form.title}</CardTitle>
                        <CardDescription className="mt-1">{form.organizations?.name}</CardDescription>
                      </div>
                      <Badge variant={form.is_active ? "default" : "secondary"}>
                        {form.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {form.description && <p className="text-sm text-gray-600 line-clamp-2">{form.description}</p>}

                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Fields:</span>
                        <span className="ml-2">{form.form_fields?.length || 0}</span>
                      </div>

                      <div className="text-sm text-gray-500">
                        Created {new Date(form.created_at).toLocaleDateString()}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                          <Link href={`/forms/${form.id}/edit`}>Edit</Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                          <Link href={`/forms/${form.id}/preview`}>Preview</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
