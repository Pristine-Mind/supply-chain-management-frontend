import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { CartContext } from '../context/CartContext'
import LocationPicker from '../components/LocationPicker'
import type { LatLng } from 'leaflet'

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
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between px-4 py-3 border-b">
        <button onClick={() => navigate('/marketplace', { replace: true })} className="text-orange-600">
          Home
        </button>
        <h1 className="font-bold text-lg text-gray-800">Delivery Details</h1>
        <div className="w-10" />
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
        {error && <div className="text-red-600">{error}</div>}

        <Controller
          name="name"
          control={control}
          rules={{ required: 'Full name is required' }}
          render={({ field }) => (
            <div>
              <label className="block mb-1">Full Name *</label>
              <input {...field} className="w-full border rounded px-3 py-2" />
              {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
            </div>
          )}
        />

        <Controller
          name="phone"
          control={control}
          rules={{
            required: 'Phone is required',
            minLength: { value: 10, message: 'Min 10 digits' }
          }}
          render={({ field }) => (
            <div>
              <label className="block mb-1">Phone *</label>
              <input {...field} type="tel" className="w-full border rounded px-3 py-2" />
              {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
            </div>
          )}
        />

        <Controller
          name="address"
          control={control}
          rules={{ required: 'Address is required' }}
          render={({ field }) => (
            <div>
              <label className="block mb-1">Address *</label>
              <textarea {...field} rows={2} className="w-full border rounded px-3 py-2" />
              {errors.address && <p className="text-red-500 text-sm">{errors.address.message}</p>}
            </div>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="city"
            control={control}
            rules={{ required: 'City is required' }}
            render={({ field }) => (
              <div>
                <label className="block mb-1">City *</label>
                <input {...field} className="w-full border rounded px-3 py-2" />
                {errors.city && <p className="text-red-500 text-sm">{errors.city.message}</p>}
              </div>
            )}
          />

          <Controller
            name="region"
            control={control}
            rules={{ required: 'State is required' }}
            render={({ field }) => (
              <div>
                <label className="block mb-1">State *</label>
                <input {...field} className="w-full border rounded px-3 py-2" />
                {errors.region && <p className="text-red-500 text-sm">{errors.region.message}</p>}
              </div>
            )}
          />
        </div>

        <Controller
          name="zip"
          control={control}
          rules={{
            required: 'ZIP is required',
            minLength: { value: 5, message: 'Min 5 digits' }
          }}
          render={({ field }) => (
            <div>
              <label className="block mb-1">ZIP Code *</label>
              <input {...field} className="w-full border rounded px-3 py-2" />
              {errors.zip && <p className="text-red-500 text-sm">{errors.zip.message}</p>}
            </div>
          )}
        />

        <div>
          <p className="mb-2 font-medium">Select Delivery Location</p>
          <div className="h-64 w-full">
            <LocationPicker
              initialCenter={latLng}
              zoom={13}
              onSelect={(lat, lng) => {
                setLatLng({ lat, lng })
                console.log('Picked:', lat, lng)
              }}
            />
          </div>
          <div className="flex gap-4 mt-2">
            <input
              readOnly
              value={latLng?.lat.toFixed(6) || ''}
              placeholder="Latitude"
              className="flex-1 border rounded px-3 py-2 bg-gray-50"
            />
            <input
              readOnly
              value={latLng?.lng.toFixed(6) || ''}
              placeholder="Longitude"
              className="flex-1 border rounded px-3 py-2 bg-gray-50"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-orange-500 rounded text-black font-bold disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Continue to Checkout'}
        </button>
      </form>
    </div>
)
}

export default DeliveryDetails
