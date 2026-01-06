import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { motion } from 'framer-motion'
import { 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Map as MapIcon, 
  Navigation, 
  ChevronRight,
  CheckCircle2
} from 'lucide-react'
import { CartContext } from '../context/CartContext'
import LocationPicker from '../components/LocationPicker'
import Navbar from './Navbar'
import Footer from './Footer'
import { useAuth } from '../context/AuthContext'
import LoginModal from './auth/LoginModal'

const DeliveryDetails: React.FC = () => {
  const navigate = useNavigate()
  const cartContext = useContext(CartContext)
  if (!cartContext) throw new Error('Must be inside CartProvider')
  const { state: cartState, createCartOnBackend } = cartContext
  const { isAuthenticated } = useAuth()

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: { name: '', phone: '', address: '', city: '', region: '', zip: '' }
  })

  const [latLng, setLatLng] = useState({ lat: 27.7172, lng: 85.3240 })
  const [loading, setLoading] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [storedFormData, setStoredFormData] = useState<FormValues | null>(null)

  const onSubmit = async (data: FormValues) => {
    if (!isAuthenticated) {
      setStoredFormData(data)
      setShowLoginModal(true)
      return
    }
    
    setLoading(true)
    try {
      let cartId = cartState.cartId || await createCartOnBackend()
      const delivery = { ...data, cartId, latitude: latLng.lat, longitude: latLng.lng }
      navigate('/payment', { state: { delivery } })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Progress Header */}
        <div className="flex flex-col items-center mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold shadow-lg shadow-orange-200">1</div>
            <div className="h-[2px] w-12 bg-gray-200" />
            <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center font-bold">2</div>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Delivery Logistics</h1>
          <p className="text-slate-500 font-medium">Where should we send your treasures?</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Side: The Form */}
          <div className="lg:col-span-7 space-y-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Section 1: Identity */}
              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2.5 bg-orange-50 rounded-xl text-orange-600">
                    <User size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Recipient Identity</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputWrapper label="Full Name" error={errors.name?.message}>
                    <Controller
                      name="name"
                      control={control}
                      rules={{ required: 'Required' }}
                      render={({ field }) => (
                        <div className="relative">
                          <input {...field} className="form-input-premium pl-11" placeholder="John Doe" />
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        </div>
                      )}
                    />
                  </InputWrapper>

                  <InputWrapper label="Phone Connection" error={errors.phone?.message}>
                    <Controller
                      name="phone"
                      control={control}
                      rules={{ required: 'Required', minLength: 10 }}
                      render={({ field }) => (
                        <div className="relative">
                          <input {...field} className="form-input-premium pl-11" placeholder="98XXXXXXXX" />
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        </div>
                      )}
                    />
                  </InputWrapper>
                </div>
              </div>

              {/* Section 2: Destination */}
              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                    <MapPin size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Drop-off Point</h2>
                </div>

                <div className="space-y-6">
                  <InputWrapper label="Detailed Street Address" error={errors.address?.message}>
                    <Controller
                      name="address"
                      control={control}
                      rules={{ required: 'Required' }}
                      render={({ field }) => (
                        <textarea {...field} rows={2} className="form-input-premium py-4" placeholder="House no, Street name, Landmark..." />
                      )}
                    />
                  </InputWrapper>

                  <div className="grid grid-cols-3 gap-4">
                    <InputWrapper label="City">
                      <Controller name="city" control={control} render={({ field }) => <input {...field} className="form-input-premium" />} />
                    </InputWrapper>
                    <InputWrapper label="Province">
                      <Controller name="region" control={control} render={({ field }) => <input {...field} className="form-input-premium" />} />
                    </InputWrapper>
                    <InputWrapper label="Zip">
                      <Controller name="zip" control={control} render={({ field }) => <input {...field} className="form-input-premium" />} />
                    </InputWrapper>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                className="w-full bg-orange-700 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-xl hover:bg-orange-600 transition-colors"
              >
                {loading ? 'Securing Logistics...' : 'Proceed to Payment'}
                <ChevronRight size={18} />
              </motion.button>
            </form>
          </div>

          {/* Right Side: Visual Map Context */}
          <div className="lg:col-span-5 sticky top-24">
            <div className="bg-slate-900 rounded-[2.5rem] p-2 shadow-2xl overflow-hidden">
              <div className="relative h-[500px] rounded-[2rem] overflow-hidden">
                <LocationPicker
                  initialCenter={latLng}
                  zoom={14}
                  onSelect={(lat, lng) => setLatLng({ lat, lng })}
                />
                
                {/* Floating Map Overlay */}
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-2xl flex items-center gap-4 border border-white/20">
                    <div className="bg-orange-500 p-3 rounded-xl text-white">
                      <Navigation size={20} className="animate-pulse" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Precision Coordinates</p>
                      <p className="text-sm font-bold text-slate-900">
                        {latLng.lat.toFixed(4)}°N, {latLng.lng.toFixed(4)}°E
                      </p>
                    </div>
                    <div className="ml-auto">
                      <CheckCircle2 className="text-green-500" size={24} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex items-center gap-4 px-6 text-slate-400">
              <MapIcon size={16} />
              <p className="text-xs font-medium italic">Drag the marker to pinpoint your exact doorstep for faster delivery.</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => storedFormData && onSubmit(storedFormData)}
      />

      <style>{`
        .form-input-premium {
          width: 100%;
          background: #fcfcfd;
          border: 1px solid #e2e8f0;
          padding: 0.875rem 1rem;
          border-radius: 1rem;
          font-weight: 600;
          font-size: 0.95rem;
          transition: all 0.2s ease;
          color: #1e293b;
        }
        .form-input-premium:focus {
          outline: none;
          background: white;
          border-color: #f97316;
          box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.1);
        }
      `}</style>
    </div>
  )
}

const InputWrapper = ({ label, children, error }: any) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center px-1">
      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">{label}</label>
      {error && <span className="text-[10px] font-bold text-red-500">{error}</span>}
    </div>
    {children}
  </div>
)

export default DeliveryDetails