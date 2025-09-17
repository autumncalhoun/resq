import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

interface Application {
  id: string
  status: string
  created_at: string
  dogs: {
    id: string
    name: string
    breed: string
    photos: string
    organizations: {
      name: string
    }
  }
  adoption_forms: {
    title: string
  }
}

export default async function ApplicationsPage() {
  const supabase = await createClient()

  const { data: user, error } = await supabase.auth.getUser()
  if (error || !user?.user) {
    redirect('/auth/login')
  }

  // Get user's applications
  const { data: applications } = await supabase
    .from('adoption_applications')
    .select(
      `
      *,
      dogs (
        id,
        name,
        breed,
        photos,
        organizations (name)
      ),
      adoption_forms (title)
    `
    )
    .eq('applicant_id', user.user.id)
    .order('created_at', { ascending: false })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'under_review':
        return 'bg-blue-100 text-blue-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link
                href="/dashboard"
                className="text-blue-600 hover:text-blue-500 mr-4">
                ← Back to Dashboard
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">
                My Applications
              </h1>
            </div>
            <Button asChild>
              <Link href="/browse">Browse Dogs</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {!applications || applications.length === 0 ? (
            <Card className="text-center py-12">
              <CardHeader>
                <CardTitle>No Applications Yet</CardTitle>
                <CardDescription>
                  Start by browsing available dogs and submitting an application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/browse">Browse Available Dogs</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {applications.map((application: Application) => {
                const photos = application.dogs.photos
                  ? JSON.parse(application.dogs.photos)
                  : []
                const mainPhoto = photos[0] || '/placeholder.svg'

                return (
                  <Card
                    key={application.id}
                    className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex gap-6">
                        <div className="w-24 h-24 flex-shrink-0">
                          <img
                            src={mainPhoto || '/placeholder.svg'}
                            alt={application.dogs.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>

                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="text-lg font-semibold">
                                {application.dogs.name}
                              </h3>
                              <p className="text-gray-600">
                                {application.dogs.breed} •{' '}
                                {application.dogs.organizations.name}
                              </p>
                            </div>
                            <Badge
                              className={getStatusColor(application.status)}>
                              {application.status.replace('_', ' ')}
                            </Badge>
                          </div>

                          <div className="space-y-1 text-sm text-gray-600">
                            <p>Form: {application.adoption_forms.title}</p>
                            <p>
                              Submitted:{' '}
                              {new Date(
                                application.created_at
                              ).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="flex gap-2 mt-4">
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/dogs/${application.dogs.id}`}>
                                View Dog
                              </Link>
                            </Button>
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/applications/${application.id}`}>
                                View Application
                              </Link>
                            </Button>
                          </div>
                        </div>
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
