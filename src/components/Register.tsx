import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Phone, Lock, MapPin, CheckCircle, 
  Shield, Clock, ArrowRight, ChevronLeft, Eye, EyeOff 
} from 'lucide-react';

import LocationPicker from './LocationPicker';
import Footer from './Footer';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import logo from '../assets/logo.png';

const schema = yup.object({
  username: yup.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must not exceed 20 characters')
    .matches(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
    .required('Username is required'),
  email: yup.string()
    .email('Please enter a valid email address')
    .test('email-domain', 'Email domain must be valid', function(value) {
      if (!value) return false;
      const parts = value.split('@');
      return parts.length === 2 && parts[1].includes('.');
    })
    .required('Email is required'),
  password: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[@$!%*?&_-]/, 'Password must contain at least one special character (@$!%*?&_-)')
    .required('Password is required'),
  password2: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
  firstName: yup.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes')
    .required('First name is required'),
  lastName: yup.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes')
    .required('Last name is required'),
  phone: yup.string()
    .matches(/^[0-9]{7,15}$/, 'Phone number must be between 7 and 15 digits')
    .test('valid-phone', 'Please enter a valid phone number', function(value) {
      if (!value) return false;
      // Remove common phone formatting characters for validation
      const cleanedPhone = value.replace(/[\s\-\+()]/g, '');
      return /^[0-9]{7,15}$/.test(cleanedPhone);
    })
    .required('Phone number is required'),
  cityId: yup.number()
    .transform((value) => (isNaN(value) ? 0 : value))
    .min(1, 'Please select a valid city')
    .required('City selection is required'),
}).required();

type FormValues = yup.InferType<typeof schema>;

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showPass, setShowPass] = useState(false);
  const [cities, setCities] = useState<{ id: number; name: string }[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [position, setPosition] = useState<[number, number]>([27.7172, 85.3240]);

  const { register, handleSubmit, control, trigger, formState: { errors } } = useForm<FormValues>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: { cityId: 0 }
  });

  // Fetch Cities
  useEffect(() => {
    const fetchCities = async () => {
      setLoadingCities(true);
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/cities/`);
        setCities(data);
      } catch {
        setSubmitError('Failed to load cities. Please refresh the page.');
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, []);

  const nextStep = async () => {
    const fieldsByStep: any = {
      1: ['username', 'email', 'password', 'password2'],
      2: ['firstName', 'lastName', 'phone'],
    };
    const isStepValid = await trigger(fieldsByStep[step]);
    if (isStepValid) setStep((s) => s + 1);
  };

  const onSubmit: SubmitHandler<FormValues> = async (vals) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await axios.post(`${import.meta.env.VITE_REACT_APP_API_URL}/api/register/user/`, {
        username: vals.username,
        email: vals.email,
        password: vals.password,
        password2: vals.password2,
        first_name: vals.firstName,
        last_name: vals.lastName,
        phone_number: vals.phone,
        city_id: vals.cityId,
        latitude: position[0],
        longitude: position[1],
      });
      alert('Registration successful!');
      navigate('/login');
    } catch (e: any) {
      setSubmitError(e.response?.data?.message || 'Failed to register. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] selection:bg-primary-100">
      <div className="pt-12 pb-8 text-center">
        <motion.img 
          initial={{ scale: 0.8, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          src={logo} alt="MulyaBazzar Logo" 
          className="w-20 h-20 mx-auto mb-4 rounded-2xl shadow-lg" 
        />
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">MulyaBazzar</h1>
        <p className="text-slate-500 mt-2">Create your account in few easy steps</p>
      </div>

      <div className="container max-w-6xl mx-auto px-4 pb-20">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          
          <div className="hidden lg:block lg:col-span-4 sticky top-8">
            <div className="space-y-6">
              {[
                { icon: CheckCircle, title: "Quick Signup", desc: "Start exploring in under 2 minutes." },
                { icon: Shield, title: "Privacy First", desc: "Your data is encrypted and secure." },
                { icon: Clock, title: "24/7 Access", desc: "Manage your profile anytime, anywhere." }
              ].map((item, i) => (
                <motion.div 
                  initial={{ x: -20, opacity: 0 }} 
                  animate={{ x: 0, opacity: 1 }} 
                  transition={{ delay: i * 0.1 }}
                  key={i} 
                  className="flex gap-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm"
                >
                  <div className="bg-primary-50 p-3 rounded-xl">
                    <item.icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{item.title}</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8">
            <Card className="border-none shadow-2xl shadow-slate-200/60 overflow-hidden bg-white">
              <div className="h-1.5 bg-slate-100 w-full">
                <motion.div 
                  className="h-full bg-primary-600" 
                  animate={{ width: `${(step / 3) * 100}%` }} 
                  transition={{ duration: 0.4 }}
                />
              </div>
              
              <CardContent className="p-8 lg:p-12">
                {submitError && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg"
                  >
                    {submitError}
                  </motion.div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div 
                        key="step1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}
                        className="space-y-5"
                      >
                        <InputField label="Username" icon={<User size={18}/>} {...register('username')} error={errors.username?.message} placeholder="Choose a unique username" />
                        <InputField label="Email Address" type="email" icon={<Mail size={18}/>} {...register('email')} error={errors.email?.message} placeholder="name@example.com" />
                        <div className="grid sm:grid-cols-2 gap-5">
                          <div className="relative">
                            <InputField label="Password" type={showPass ? "text" : "password"} icon={<Lock size={18}/>} {...register('password')} error={errors.password?.message} placeholder="••••••••" />
                            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-10 text-slate-400 hover:text-primary-600 transition-colors">
                              {showPass ? <EyeOff size={18}/> : <Eye size={18}/>}
                            </button>
                          </div>
                          <InputField label="Confirm Password" type="password" icon={<Lock size={18}/>} {...register('password2')} error={errors.password2?.message} placeholder="••••••••" />
                        </div>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div 
                        key="step2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}
                        className="space-y-5"
                      >
                        <div className="grid sm:grid-cols-2 gap-5">
                          <InputField label="First Name" {...register('firstName')} error={errors.firstName?.message} placeholder="John" />
                          <InputField label="Last Name" {...register('lastName')} error={errors.lastName?.message} placeholder="Doe" />
                        </div>
                        <InputField label="Phone Number" icon={<Phone size={18}/>} {...register('phone')} error={errors.phone?.message} placeholder="98XXXXXXXX" />
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div 
                        key="step3" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}
                        className="space-y-6"
                      >
                         <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 ml-1 flex items-center gap-2">
                              <MapPin size={16} className="text-primary-600"/> Select City
                            </label>
                            <Controller
                              name="cityId"
                              control={control}
                              render={({ field }) => (
                                <select 
                                  {...field} 
                                  disabled={loadingCities}
                                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all cursor-pointer"
                                >
                                  <option value={0}>Search your city...</option>
                                  {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                              )}
                            />
                            {errors.cityId && <p className="text-xs text-red-500 font-medium">{errors.cityId.message}</p>}
                         </div>

                         <div className="space-y-3">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Pin Precise Location</label>
                            <div className="h-[280px] rounded-2xl overflow-hidden border-2 border-slate-100 shadow-inner group">
                              <LocationPicker 
                                initialCenter={{ lat: position[0], lng: position[1] }} 
                                zoom={13} 
                                onSelect={(lat, lng) => setPosition([lat, lng])} 
                              />
                            </div>
                            <div className="flex items-center justify-between px-2 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                              <span className="bg-slate-50 px-2 py-1 rounded">LAT: {position[0].toFixed(4)}</span>
                              <span className="bg-slate-50 px-2 py-1 rounded">LNG: {position[1].toFixed(4)}</span>
                            </div>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-4 pt-6">
                    {step > 1 && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setStep(step - 1)} 
                        className="h-12 px-6 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                      >
                        <ChevronLeft className="mr-2 w-4 h-4"/> Back
                      </Button>
                    )}
                    
                    {step < 3 ? (
                      <Button 
                        type="button" 
                        onClick={nextStep} 
                        className="flex-1 h-12 rounded-xl bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all active:scale-[0.98]"
                      >
                        Continue <ArrowRight className="ml-2 w-4 h-4"/>
                      </Button>
                    ) : (
                      <Button 
                        type="submit" 
                        disabled={submitting} 
                        className="flex-1 h-12 rounded-xl bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all active:scale-[0.98]"
                      >
                        {submitting ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Finalizing...
                          </div>
                        ) : "Complete Registration"}
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
            <p className="text-center mt-8 text-slate-500 text-sm">
              Already have an account? <a href="/login" className="text-primary-600 font-bold hover:text-primary-700 transition-colors">Sign In Here</a>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

const InputField = React.forwardRef(({ label, icon, error, type = "text", ...props }: any, ref: any) => (
  <div className="space-y-1.5 w-full">
    <label className="text-sm font-semibold text-slate-700 ml-1">{label}</label>
    <div className="relative group">
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors duration-200">
          {icon}
        </div>
      )}
      <input 
        type={type} 
        {...props} 
        ref={ref}
        className={`w-full h-12 ${icon ? 'pl-11' : 'px-4'} pr-4 rounded-xl border border-slate-200 bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all duration-200 placeholder:text-slate-300 shadow-sm`} 
      />
    </div>
    <AnimatePresence>
      {error && (
        <motion.p 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          exit={{ opacity: 0, y: -10 }}
          className="text-xs text-red-500 font-medium ml-1"
        >
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
));

InputField.displayName = "InputField";

export default Register;