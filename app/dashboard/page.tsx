import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: user, error } = await supabase.auth.getUser()
  if (error || !user?.user) {
    redirect('/auth/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.user.id)
    .single()

  // Get user's organizations
  const { data: organizations } = await supabase
    .from('organization_members')
    .select(
      `
      organizations (
        id,
        name
      )
    `
    )
    .eq('user_id', user.user.id)

  const userOrgs = organizations?.map((member) => member.organizations) || []

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                Dog Rescue Platform
              </h1>
            </div>
            <div className="text-sm text-gray-600">{user.user?.email}</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Welcome Back!</CardTitle>
                <CardDescription>
                  {profile?.full_name || user.user?.email}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Role:</span>{' '}
                    {profile?.user_type?.replace('_', ' ') || 'User'}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span> {profile?.email}
                  </p>
                  {profile?.phone && (
                    <p>
                      <span className="font-medium">Phone:</span>{' '}
                      {profile.phone}
                    </p>
                  )}
                  <p>
                    <span className="font-medium">Organizations:</span>{' '}
                    {userOrgs.length}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Messages</CardTitle>
                <CardDescription>
                  View your conversations and communications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/messages">View Messages</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Manage Dogs</CardTitle>
                <CardDescription>
                  View and manage all your dog profiles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/dogs/manage">Manage Dogs</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add New Dog</CardTitle>
                <CardDescription>
                  Upload a new dog profile for adoption
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/dogs/add">Add New Dog</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Manage Forms</CardTitle>
                <CardDescription>
                  Create and edit adoption application forms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/forms/manage">Manage Forms</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Browse Dogs</CardTitle>
                <CardDescription>
                  See the adopter view of available dogs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  asChild
                  className="w-full bg-transparent"
                  variant="outline">
                  <Link href="/browse">Browse Dogs</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
