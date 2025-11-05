import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { CartContext } from '../context/CartContext'
import LocationPicker from '../components/LocationPicker'
import Navbar from './Navbar'
import Footer from './Footer'
import { useAuth } from '../context/AuthContext'
import LoginModal from './auth/LoginModal'

interface FormValues {
  name: string
  phone: string
  address: string
  email: string
  city: string
  region: string
  zip: string
}

interface Delivery {
  cartId: number
  customer_name: string
  phone_number: string
  email: string
  address: string
  city: string
  state: string
  zip_code: string
  latitude: number
  longitude: number
}

const DeliveryDetails: React.FC = () => {
  const navigate = useNavigate()
  const cartContext = useContext(CartContext)
  if (!cartContext) throw new Error('Must be inside CartProvider')
  const { state: cartState, createCartOnBackend } = cartContext
  const { isAuthenticated } = useAuth()

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: { name: '', phone: '', address: '', city: '', region: '', zip: '' }
  })

  const [latLng, setLatLng] = useState<{ lat: number; lng: number }>({ lat: 27.7172, lng: 85.3240 })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [storedFormData, setStoredFormData] = useState<FormValues | null>(null)

  const processDelivery = async (data: FormValues) => {
    if (!latLng) {
      setError('Please select a location on the map.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      let cartId = cartState.cartId
      if (!cartId) {
        cartId = await createCartOnBackend()
      }

      // Prepare delivery data for the new order flow
      const delivery: Delivery = {
        cartId: cartId,
        customer_name: data.name,
        phone_number: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        state: data.region,
        zip_code: data.zip,
        latitude: latLng.lat,
        longitude: latLng.lng,
      }

      // Skip the old createDelivery API call and go directly to payment
      // The delivery info will be used in the order creation API
      navigate('/payment', { state: { delivery } })
    } catch (err) {
      console.error(err)
      setError('Failed to process delivery. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: FormValues) => {
    if (!isAuthenticated) {
      setError('Please log in to continue to checkout.')
      setStoredFormData(data)
      setShowLoginModal(true)
      return
    }
    await processDelivery(data)
  }

  return (
    <>
      <Navbar />
      <div className="bg-neutral-50 py-6">
        <div className="w-4/5 mx-auto card-elevated bg-white">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
            {error && (
              <div className="card-soft bg-accent-error-50 border border-accent-error-200 text-accent-error-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h2 className="text-h3 font-semibold text-neutral-700 uppercase tracking-wide">
                  Personal Information
                </h2>
                
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: 'Full name is required' }}
                  render={({ field }) => (
                    <div>
                      <label className="block text-body font-medium text-neutral-700 mb-1">
                        Full Name
                      </label>
                      <input 
                        {...field} 
                        className="input-field w-full focus-ring"
                        placeholder="Enter your full name"
                      />
                      {errors.name && (
                        <p className="text-accent-error-500 text-caption mt-1">{errors.name.message}</p>
                      )}
                    </div>
                  )}
                />

                <Controller
                  name="phone"
                  control={control}
                  rules={{
                    required: 'Phone number is required',
                    minLength: { value: 10, message: 'Phone number must be at least 10 digits' }
                  }}
                  render={({ field }) => (
                    <div>
                      <label className="block text-body font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input 
                        {...field} 
                        type="tel" 
                        className="input-field w-full focus:ring-primary-200 focus:border-primary-500"
                        placeholder="Your phone number"
                      />
                      {errors.phone && (
                        <p className="text-accent-error-500 text-caption mt-1">{errors.phone.message}</p>
                      )}
                    </div>
                  )}
                />

                <Controller
                  name="email"
                  control={control}
                  rules={{
                    required: 'Email is required',
                  }}
                  render={({ field }) => (
                    <div>
                      <label className="block text-body font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input 
                        {...field} 
                        type="email" 
                        className="input-field w-full focus:ring-primary-200 focus:border-primary-500"
                        placeholder="Your email address"
                      />
                      {errors.email  && (
                        <p className="text-accent-error-500 text-caption mt-1">{errors.email.message}</p>
                      )}
                    </div>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h2 className="text-h3 font-semibold text-gray-700 uppercase tracking-wide">
                  Address Information
                </h2>

                <Controller
                  name="address"
                  control={control}
                  rules={{ required: 'Address is required' }}
                  render={({ field }) => (
                    <div>
                      <label className="block text-body font-medium text-gray-700 mb-1">
                        Street Address
                      </label>
                      <textarea 
                        {...field} 
                        rows={2} 
                        className="input-field w-full focus-ring resize-none"
                        placeholder="Enter your street address"
                      />
                      {errors.address && (
                        <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>
                      )}
                    </div>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <Controller
                    name="city"
                    control={control}
                    rules={{ required: 'City is required' }}
                    render={({ field }) => (
                      <div>
                        <label className="block text-caption font-medium text-neutral-700 mb-1">
                          City
                        </label>
                        <input 
                          {...field} 
                          className="input-field w-full focus-ring"
                          placeholder="City"
                        />
                        {errors.city && (
                          <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>
                        )}
                      </div>
                    )}
                  />

                  <Controller
                    name="region"
                    control={control}
                    rules={{ required: 'State is required' }}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State
                        </label>
                        <input 
                          {...field} 
                          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                          placeholder="State"
                        />
                        {errors.region && (
                          <p className="text-red-500 text-xs mt-1">{errors.region.message}</p>
                        )}
                      </div>
                    )}
                  />
                </div>

                <Controller
                  name="zip"
                  control={control}
                  rules={{
                    required: 'ZIP code is required',
                    minLength: { value: 5, message: 'ZIP code must be at least 5 digits' }
                  }}
                  render={({ field }) => (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ZIP Code
                      </label>
                      <input 
                        {...field} 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        placeholder="ZIP code"
                      />
                      {errors.zip && (
                        <p className="text-red-500 text-xs mt-1">{errors.zip.message}</p>
                      )}
                    </div>
                  )}
                />
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Delivery Location
              </h2>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="h-72 w-full">
                  <LocationPicker
                    initialCenter={latLng}
                    zoom={13}
                    onSelect={(lat, lng) => {
                      setLatLng({ lat, lng })
                    }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Latitude
                  </label>
                  <input
                    readOnly
                    value={latLng?.lat.toFixed(6) || ''}
                    className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs bg-gray-50 text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Longitude
                  </label>
                  <input
                    readOnly
                    value={latLng?.lng.toFixed(6) || ''}
                    className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs bg-gray-50 text-gray-600"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3 rounded-lg transition-colors duration-200 shadow-sm"
              >
                {loading ? 'Processing...' : 'Continue to Checkout'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={async () => {
          setShowLoginModal(false)
          if (storedFormData) {
            await processDelivery(storedFormData)
            setStoredFormData(null)
          }
        }}
      />
    </>
  )
}

export default DeliveryDetails
