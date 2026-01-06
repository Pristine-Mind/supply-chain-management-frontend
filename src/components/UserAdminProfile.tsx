import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Briefcase, Calendar, ShieldCheck } from 'lucide-react'; // Using Lucide for icons

interface UserProfile {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  business_type: string;
  date_joined: string;
}

const UserAdminProfile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/user-profile/`,
          { headers: { Authorization: `Token ${token}` } }
        );
        setProfile(response.data.data);
      } catch (err) {
        setError('Unable to retrieve profile information.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 bg-orange-200 rounded-full mb-4"></div>
        <div className="h-4 w-32 bg-gray-200 rounded"></div>
      </div>
    </div>
  );

  if (error || !profile) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
        <p className="text-red-500 font-medium mb-4">{error || "No data available"}</p>
        <button onClick={() => navigate(-1)} className="text-orange-600 font-semibold">Go Back</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Navigation */}
        <button
          onClick={() => navigate(-1)}
          className="group mb-6 flex items-center text-sm font-medium text-gray-500 hover:text-orange-600 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header/Banner Section */}
          <div className="h-32 bg-gradient-to-r from-orange-600 to-indigo-700" />
          
          <div className="px-8 pb-8">
            <div className="relative -mt-12 mb-6 flex items-end justify-between">
              {/* Avatar Initial Circle */}
              <div className="h-24 w-24 rounded-2xl bg-white p-1 shadow-lg">
                <div className="h-full w-full rounded-xl bg-gray-100 flex items-center justify-center text-3xl font-bold text-orange-600">
                  {profile.first_name[0]}{profile.last_name[0]}
                </div>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider rounded-full flex items-center">
                <ShieldCheck className="w-3 h-3 mr-1" /> Admin Account
              </span>
            </div>

            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                {profile.first_name} {profile.last_name}
              </h1>
              <p className="text-gray-500">@{profile.username}</p>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoCard 
                icon={<Mail className="w-5 h-5" />} 
                label="Email Address" 
                value={profile.email} 
              />
              <InfoCard 
                icon={<Briefcase className="w-5 h-5" />} 
                label="Business Category" 
                value={profile.business_type} 
              />
              <InfoCard 
                icon={<Calendar className="w-5 h-5" />} 
                label="Member Since" 
                value={new Date(profile.date_joined).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric'
                })} 
              />
              <InfoCard 
                icon={<User className="w-5 h-5" />} 
                label="Account ID" 
                value={`#${profile.username.toUpperCase()}`} 
              />
            </div>

            {/* Actions Section */}
            <div className="mt-10 pt-6 border-t border-gray-100 flex gap-3">
              <button className="flex-1 bg-orange-600 text-white py-2.5 rounded-xl font-semibold hover:bg-orange-700 transition-all">
                Edit Profile
              </button>
              <button className="flex-1 bg-white border border-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition-all">
                Security Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Sub-component for data rows
const InfoCard = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
  <div className="flex items-start p-4 rounded-xl bg-gray-50 border border-transparent hover:border-gray-200 transition-all">
    <div className="p-2 bg-white rounded-lg text-orange-600 shadow-sm mr-4">
      {icon}
    </div>
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-gray-800">{value}</p>
    </div>
  </div>
);

export default UserAdminProfile;
