import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
        setError(null);
        const response = await axios.get(
          `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/user-profile/`,
          {
            headers: { Authorization: `Token ${localStorage.getItem('token')}` },
          }
        );
        setProfile(response.data.data);
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
  }
  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center">No profile data found.</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-10 bg-white rounded-xl shadow p-8">
      <button
        className="mb-6 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 text-sm"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>
      <h1 className="text-2xl font-bold mb-4">Admin Profile</h1>
      <div className="space-y-2">
        <div><strong>Name:</strong> {profile.first_name} {profile.last_name}</div>
        <div><strong>Username:</strong> {profile.username}</div>
        <div><strong>Email:</strong> {profile.email}</div>
        <div><strong>Business Type:</strong> {profile.business_type}</div>
        <div><strong>Date Joined:</strong> {new Date(profile.date_joined).toLocaleDateString()}</div>
      </div>
    </div>
  );
};

export default UserAdminProfile;
