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

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type React from 'react'
import { createClient } from '@/lib/supabase/client'

interface Application {
  id: string
  status: string
  applicant_id: string
  dogs: {
    id: string
    name: string
    breed: string
    photos: string
    adoption_fee: number
    organizations: {
      name: string
    }
  }
}

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const applicationId = params.id as string
  const [application, setApplication] = useState<Application | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  })

  useEffect(() => {
    loadApplication()
    getCurrentUser()
  }, [applicationId])

  const getCurrentUser = async () => {
    const supabase = createClient()
    const { data: user } = await supabase.auth.getUser()
    if (user.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.user.id)
        .single()
      setCurrentUser({ ...user.user, profile })
    }
  }

  const loadApplication = async () => {
    const supabase = createClient()

    const { data: applicationData } = await supabase
      .from('adoption_applications')
      .select(
        `
        *,
        dogs (
          id,
          name,
          breed,
          photos,
          adoption_fee,
          organizations (name)
        )
      `
      )
      .eq('id', applicationId)
      .single()

    if (applicationData) {
      setApplication(applicationData)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setPaymentData((prev) => ({ ...prev, [field]: value }))
  }

  const processPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!application || !currentUser) return

    setIsProcessing(true)

    try {
      const supabase = createClient()
      const adoptionFee = application.dogs.adoption_fee || 0
      const platformFee = Math.round(adoptionFee * 0.1) // 10% platform fee
      const totalAmount = adoptionFee + platformFee

      // Simulate payment processing (in real app, this would integrate with Stripe/PayPal)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Record payment in database
      const { error: paymentError } = await supabase.from('payments').insert({
        application_id: applicationId,
        adopter_id: currentUser.id,
        adoption_fee: adoptionFee,
        platform_fee: platformFee,
        total_amount: totalAmount,
        payment_method: 'card',
        payment_status: 'completed',
        transaction_id: `txn_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
      })

      if (paymentError) throw paymentError

      // Update application status to paid
      const { error: updateError } = await supabase
        .from('adoption_applications')
        .update({ status: 'paid' })
        .eq('id', applicationId)

      if (updateError) throw updateError

      // Update dog status to adopted
      const { error: dogError } = await supabase
        .from('dogs')
        .update({ status: 'adopted' })
        .eq('id', application.dogs.id)

      if (dogError) throw dogError

      // Redirect to success page
      router.push(`/applications/${applicationId}/payment-success`)
    } catch (error) {
      console.error('Payment processing error:', error)
      alert('Payment failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (!application || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading payment details...</p>
      </div>
    )
  }

  // Check if user is authorized to make payment
  if (application.applicant_id !== currentUser.id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
            <CardDescription>
              You are not authorized to make this payment.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Check if application is approved
  if (application.status !== 'approved') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Payment Not Available</CardTitle>
            <CardDescription>
              This application must be approved before payment can be processed.
              Current status:{' '}
              <Badge className="ml-1">{application.status}</Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push(`/applications/${applicationId}`)}
              className="w-full">
              Back to Application
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const photos = application.dogs.photos
    ? JSON.parse(application.dogs.photos)
    : []
  const mainPhoto = photos[0] || '/placeholder.svg'
  const adoptionFee = application.dogs.adoption_fee || 0
  const platformFee = Math.round(adoptionFee * 0.1)
  const totalAmount = adoptionFee + platformFee

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="mr-4 p-0 h-auto text-blue-600 hover:text-blue-500">
                ← Back
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                Complete Adoption Payment
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Dog Details */}
            <Card>
              <CardHeader>
                <CardTitle>Adoption Details</CardTitle>
                <CardDescription>
                  You&apos;re adopting this wonderful companion
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <img
                    src={mainPhoto || '/placeholder.svg'}
                    alt={application.dogs.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div>
                    <h3 className="font-semibold text-lg">
                      {application.dogs.name}
                    </h3>
                    <p className="text-gray-600">{application.dogs.breed}</p>
                    <p className="text-sm text-gray-500">
                      {application.dogs.organizations.name}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between">
                    <span>Adoption Fee</span>
                    <span>${adoptionFee}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Platform Fee (10%)</span>
                    <span>${platformFee}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Total Amount</span>
                    <span>${totalAmount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Form */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
                <CardDescription>
                  Enter your payment details to complete the adoption
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={processPayment} className="space-y-4">
                  <div>
                    <Label htmlFor="cardholderName">Cardholder Name</Label>
                    <Input
                      id="cardholderName"
                      value={paymentData.cardholderName}
                      onChange={(e) =>
                        handleInputChange('cardholderName', e.target.value)
                      }
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      value={paymentData.cardNumber}
                      onChange={(e) =>
                        handleInputChange('cardNumber', e.target.value)
                      }
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiryDate">Expiry Date</Label>
                      <Input
                        id="expiryDate"
                        value={paymentData.expiryDate}
                        onChange={(e) =>
                          handleInputChange('expiryDate', e.target.value)
                        }
                        placeholder="MM/YY"
                        maxLength={5}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        value={paymentData.cvv}
                        onChange={(e) =>
                          handleInputChange('cvv', e.target.value)
                        }
                        placeholder="123"
                        maxLength={4}
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={isProcessing}>
                      {isProcessing
                        ? 'Processing Payment...'
                        : `Pay $${totalAmount}`}
                    </Button>
                  </div>

                  <p className="text-xs text-gray-500 text-center">
                    Your payment is secure and encrypted. This is a demo payment
                    system.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
