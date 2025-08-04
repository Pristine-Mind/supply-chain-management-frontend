import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { CartContext } from '../context/CartContext'
import LocationPicker from '../components/LocationPicker'
import type { LatLng } from 'leaflet'
import Navbar from './Navbar'
import Footer from './Footer'

interface FormValues {
  name: string
  phone: string
  address: string
  city: string
  region: string
  zip: string
}

interface Delivery {
  cart: number
  customer_name: string
  phone_number: string
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
  const { state: cartState, createCartOnBackend, updateCustomerLatLng, createDelivery } = cartContext

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: { name: '', phone: '', address: '', city: '', region: '', zip: '' }
  })

  const [latLng, setLatLng] = useState<LatLng>({ lat: 27.7172, lng: 85.3240 })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data: FormValues) => {
    if (!latLng) {
      setError('Please select a location on the map.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      if (!cartState.cartId) {
        await createCartOnBackend()
        if (!cartState.cartId) throw new Error('Failed to create cart')
      }

      if (!cartState.cartId) {
        throw new Error('Cart ID is missing')
      }

      const delivery: Delivery = {
        cart: cartState.cartId,
        customer_name: data.name,
        phone_number: data.phone,
        address: data.address,
        city: data.city,
        state: data.region,
        zip_code: data.zip,
        latitude: latLng.lat,
        longitude: latLng.lng,
      }
      await createDelivery(delivery)
      navigate('/checkout', { state: { delivery } })
    } catch (err) {
      console.error(err)
      setError('Failed to process delivery. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto bg-white shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4 ">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Personal Information
            </h2>
            
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Full name is required' }}
              render={({ field }) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input 
                    {...field} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    placeholder="Enter your full name"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input 
                    {...field} 
                    type="tel" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    placeholder="Your phone number"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
                  )}
                </div>
              )}
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Address Information
            </h2>

            <Controller
              name="address"
              control={control}
              rules={{ required: 'Address is required' }}
              render={({ field }) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address
                  </label>
                  <textarea 
                    {...field} 
                    rows={2} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input 
                      {...field} 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
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

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Delivery Location
            </h2>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="h-48 w-full">
                <LocationPicker
                  initialCenter={latLng}
                  zoom={13}
                  onSelect={(lat, lng) => {
                    setLatLng({ lat, lng })
                    console.log('Picked:', lat, lng)
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
    </>

)
}

export default DeliveryDetails
