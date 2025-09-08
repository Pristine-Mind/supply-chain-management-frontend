import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import banner from '../assets/banner_new.png';

interface FormState {
  username: string;
  email: string;
  password: string;
  password2: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  location?: number | '';
  latitude?: number | '';
  longitude?: number | '';
}

const initialState: FormState = {
  username: '',
  email: '',
  password: '',
  password2: '',
  first_name: '',
  last_name: '',
  phone_number: '',
  location: '',
  latitude: '',
  longitude: '',
};

interface City { id: number; name: string }

const BuyerRegister: React.FC = () => {
  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cities, setCities] = useState<City[]>([]);

  const api = import.meta.env.VITE_REACT_APP_API_URL as string | undefined;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validate = (): string | null => {
    if (!form.first_name.trim()) return 'Please enter your first name';
    if (!form.last_name.trim()) return 'Please enter your last name';
    if (!form.username.trim()) return 'Please choose a username';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Please enter a valid email address';
    if (form.phone_number && !/^\+?[0-9\-\s]{7,15}$/.test(form.phone_number)) return 'Please enter a valid phone number';
    if (form.password.length < 6) return 'Password should be at least 6 characters';
    if (form.password !== form.password2) return 'Passwords do not match';
    return null;
  };

  useEffect(() => {
    const fetchCities = async () => {
      if (!api) return;
      try {
        const res = await fetch(`${api}/api/v1/cities/`);
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data)) {
          setCities(data.map((c: any) => ({ id: Number(c.id), name: String(c.name ?? c.title ?? 'City') })) as City[]);
        }
      } catch {}
    };
    fetchCities();
  }, [api]);

  const useCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(prev => ({
          ...prev,
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
        }));
      },
      (err) => setError(err.message || 'Failed to fetch current location'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        username: form.username,
        email: form.email,
        password: form.password,
        password2: form.password2,
        first_name: form.first_name,
        last_name: form.last_name,
        phone_number: form.phone_number || undefined,
        location: form.location || undefined,
        latitude: form.latitude === '' ? undefined : form.latitude,
        longitude: form.longitude === '' ? undefined : form.longitude,
      };

      if (api) {
        const res = await fetch(`${api}/auth/register/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.detail || `Registration failed (HTTP ${res.status})`);
        }
      } else {
        // No API configured, simulate success
        await new Promise(res => setTimeout(res, 500));
      }

      setSuccess('Registration successful! You can now sign in.');
      setForm(initialState);
    } catch (err: any) {
      setError(err?.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="relative h-56 bg-cover bg-center" style={{ backgroundImage: `url(${banner})` }}>
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <h1 className="text-white text-3xl md:text-4xl font-bold">Buyer Registration</h1>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">Welcome to MulyaBazzar</h2>
            <p className="text-gray-600">
              Create a buyer account to track orders, save addresses, and enjoy a faster checkout experience.
              You can always update your details later from your profile.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
            {error && <div className="p-3 rounded bg-red-50 text-red-700 border border-red-200">{error}</div>}
            {success && <div className="p-3 rounded bg-green-50 text-green-700 border border-green-200">{success}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Sita"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Sharma"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="sita.sharma"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone_number"
                  value={form.phone_number || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="+977 98xxxxxxx"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City (optional)</label>
                <select
                  name="location"
                  value={form.location ?? ''}
                  onChange={(e) => setForm(prev => ({ ...prev, location: e.target.value ? Number(e.target.value) : '' }))}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                >
                  <option value="">Select city</option>
                  {cities.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Latitude (optional)</label>
                <input
                  type="number"
                  step="0.000001"
                  name="latitude"
                  value={form.latitude as any}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="27.7172"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Longitude (optional)</label>
                <input
                  type="number"
                  step="0.000001"
                  name="longitude"
                  value={form.longitude as any}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="85.3240"
                />
              </div>
              <div className="md:col-span-2">
                <button type="button" onClick={useCurrentLocation} className="text-sm text-orange-600 hover:underline">Use my current location</button>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirm Password</label>
                <input
                  type="password"
                  name="password2"
                  value={form.password2}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="inline-flex items-center px-5 py-2.5 rounded-md bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-60"
                disabled={loading}
              >
                {loading ? 'Registering...' : 'Create Account'}
              </button>
            </div>
          </form>
        </section>

        <aside className="space-y-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-2">Why create a buyer account?</h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-600 text-sm">
              <li>Faster checkout with saved addresses</li>
              <li>Track your orders in one place</li>
              <li>Get updates on offers and seasonal deals</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-2">Already have an account?</h3>
            <a href="/login" className="text-orange-600 hover:underline">Sign in</a>
          </div>
        </aside>
      </main>

      <Footer />
    </div>
  );
};

export default BuyerRegister;
