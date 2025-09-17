'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface Payment {
  id: string
  total_amount: number
  adoption_fee: number
  platform_fee: number
  transaction_id: string
  created_at: string
  adoption_applications: {
    dogs: {
      name: string
      breed: string
      photos: string
      organizations: {
        name: string
      }
    }
  }
}

export default function PaymentSuccessPage() {
  const params = useParams()
  const router = useRouter()
  const applicationId = params.id as string
  const [payment, setPayment] = useState<Payment | null>(null)

  useEffect(() => {
    loadPayment()
  }, [applicationId])

  const loadPayment = async () => {
    const supabase = createClient()

    const { data: paymentData } = await supabase
      .from('payments')
      .select(
        `
        *,
        adoption_applications (
          dogs (
            name,
            breed,
            photos,
            organizations (name)
          )
        )
      `
      )
      .eq('application_id', applicationId)
      .single()

    if (paymentData) {
      setPayment(paymentData)
    }
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading payment confirmation...</p>
      </div>
    )
  }

  const photos = payment.adoption_applications.dogs.photos
    ? JSON.parse(payment.adoption_applications.dogs.photos)
    : []
  const mainPhoto = photos[0] || '/placeholder.svg'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <Card className="text-center">
          <CardHeader className="pb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <CardTitle className="text-2xl text-green-600">
              Payment Successful!
            </CardTitle>
            <CardDescription className="text-lg">
              Congratulations! You&apos;ve successfully adopted{' '}
              {payment.adoption_applications.dogs.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-center gap-4">
              <img
                src={mainPhoto || '/placeholder.svg'}
                alt={payment.adoption_applications.dogs.name}
                className="w-20 h-20 object-cover rounded-full"
              />
              <div className="text-left">
                <h3 className="font-semibold text-xl">
                  {payment.adoption_applications.dogs.name}
                </h3>
                <p className="text-gray-600">
                  {payment.adoption_applications.dogs.breed}
                </p>
                <p className="text-sm text-gray-500">
                  {payment.adoption_applications.dogs.organizations.name}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold">Payment Details</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Transaction ID:</span>
                  <span className="font-mono">{payment.transaction_id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Adoption Fee:</span>
                  <span>${payment.adoption_fee}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee:</span>
                  <span>${payment.platform_fee}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-1">
                  <span>Total Paid:</span>
                  <span>${payment.total_amount}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Date:</span>
                  <span>
                    {new Date(payment.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 text-left">
              <h4 className="font-semibold text-blue-900 mb-2">What's Next?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  • The rescue organization will contact you within 24-48 hours
                </li>
                <li>• They&apos;ll coordinate pickup/delivery arrangements</li>
                <li>
                  • You&apos;ll receive adoption paperwork and medical records
                </li>
                <li>• Welcome to the wonderful world of dog parenthood! 🐕</li>
              </ul>
            </div>

            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline">
                Back to Dashboard
              </Button>
              <Button
                onClick={() => router.push('/browse')}
                className="bg-blue-600 hover:bg-blue-700">
                Browse More Dogs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
