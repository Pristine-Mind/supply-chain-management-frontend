import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  fetchUserProfile,
  updateUserProfile,
  uploadProfilePicture,
  changePassword,
  type UserProfile as UserProfileType,
  type ChangePasswordData,
  type ShippingAddress
} from '../api/userProfileApi';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import Footer from './Footer';
import LoginModal from './auth/LoginModal';
import {
  User,
  Mail,
  Camera,
  Edit3,
  Save,
  X,
  Eye,
  EyeOff,
  Settings,
  Bell,
  Shield,
  Home,
  CheckCircle,
  AlertCircle,
  Package,
  ShoppingCart,
  BarChart3
} from 'lucide-react';

interface EditMode {
  personal: boolean;
  contact: boolean;
  address: boolean;
  notifications: boolean;
  password: boolean;
}

const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Edit modes
  const [editMode, setEditMode] = useState<EditMode>({
    personal: false,
    contact: false,
    address: false,
    notifications: false,
    password: false
  });

  // Form states
  const [personalForm, setPersonalForm] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    date_of_birth: '',
    gender: ''
  });

  const [contactForm, setContactForm] = useState({
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: ''
  });

  const [notificationForm, setNotificationForm] = useState({
    email_notifications: true,
    sms_notifications: true,
    marketing_emails: false,
    order_updates: true
  });

  const [passwordForm, setPasswordForm] = useState<ChangePasswordData>({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Shipping addresses (for future use)
  const [, setShippingAddresses] = useState<ShippingAddress[]>([]);

  const loadProfile = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const profileData = await fetchUserProfile();
      setProfile(profileData);
      
      // Initialize form data
      setPersonalForm({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        bio: profileData.bio || '',
        date_of_birth: profileData.date_of_birth || '',
        gender: profileData.gender || ''
      });

      setContactForm({
        phone: profileData.phone || profileData.phone_number || '',
        address: profileData.address || '',
        city: profileData.city || '',
        state: profileData.state || '',
        zip_code: profileData.zip_code || '',
        country: profileData.country || 'Nepal'
      });

      setNotificationForm(profileData.notification_preferences || {
        email_notifications: true,
        sms_notifications: true,
        marketing_emails: false,
        order_updates: true
      });

      setShippingAddresses(profileData.shipping_addresses || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [isAuthenticated]);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleEditToggle = (section: keyof EditMode) => {
    setEditMode(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSavePersonal = async () => {
    try {
      setSaveLoading(true);
      const updatedProfile = await updateUserProfile(personalForm);
      setProfile(updatedProfile);
      setEditMode(prev => ({ ...prev, personal: false }));
      showSuccess('Personal information updated successfully!');
    } catch (err) {
      setError('Failed to update personal information');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSaveContact = async () => {
    try {
      setSaveLoading(true);
      const updatedProfile = await updateUserProfile(contactForm);
      setProfile(updatedProfile);
      setEditMode(prev => ({ ...prev, contact: false }));
      showSuccess('Contact information updated successfully!');
    } catch (err) {
      setError('Failed to update contact information');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setSaveLoading(true);
      const updatedProfile = await updateUserProfile({
        notification_preferences: notificationForm
      });
      setProfile(updatedProfile);
      setEditMode(prev => ({ ...prev, notifications: false }));
      showSuccess('Notification preferences updated successfully!');
    } catch (err) {
      setError('Failed to update notification preferences');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError('New passwords do not match');
      return;
    }

    if (passwordForm.new_password.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    try {
      setSaveLoading(true);
      const result = await changePassword(passwordForm);
      
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setEditMode(prev => ({ ...prev, password: false }));
      
      const successMsg = result.message || 'Password changed successfully!';
      showSuccess(successMsg);
    } catch (err) {
      console.error('❌ Password change error:', err);
      setError('Failed to change password. Please check your current password.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    try {
      setUploadLoading(true);
      const result = await uploadProfilePicture(file);
      setProfile(prev => prev ? { ...prev, profile_picture: result.profile_picture } : null);
      showSuccess('Profile picture updated successfully!');
    } catch (err) {
      setError('Failed to upload profile picture');
    } finally {
      setUploadLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'PPP');
    } catch {
      return 'Not provided';
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <Navbar />
        <LoginModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => setShowLoginModal(false)}
        />
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-500 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-6">
              <User className="h-8 w-8 text-orange-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Please Log In</h1>
            <p className="text-gray-600 mb-8">You need to be logged in to view your profile.</p>
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center px-5 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors shadow-md hover:shadow-lg"
            >
              Login to Continue
              <User className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-50 flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-orange-200 animate-pulse"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
              </div>
            </div>
            <p className="text-lg text-orange-700 mt-6 font-medium">Loading your profile...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Profile Not Found</h1>
            <p className="text-gray-600 mb-8">We couldn't load your profile information.</p>
            <button
              onClick={loadProfile}
              className="inline-flex items-center px-5 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors shadow-md hover:shadow-lg"
            >
              Retry
              <RefreshCw className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">My Profile</h1>
            <p className="mt-2 text-lg text-gray-600">Manage your account settings and preferences</p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8 shadow-sm">
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                <p className="text-green-700 font-medium">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 shadow-sm">
              <div className="flex items-center">
                <AlertCircle className="h-6 w-6 text-red-500 mr-3 flex-shrink-0" />
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-8">
            {/* Profile Picture & Basic Info */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-xl">
              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-6 sm:space-y-0 sm:space-x-8">
                  <div className="relative">
                    <div className="h-32 w-32 rounded-full bg-gradient-to-br from-orange-400 to-purple-500 flex items-center justify-center shadow-lg">
                      {profile.profile_picture ? (
                        <img
                          src={profile.profile_picture}
                          alt="Profile"
                          className="h-full w-full object-cover rounded-full"
                        />
                      ) : (
                        <User className="h-16 w-16 text-white" />
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadLoading}
                      className="absolute bottom-2 right-2 bg-white text-orange-600 p-2 rounded-full shadow-md hover:bg-orange-50 transition-colors disabled:opacity-50"
                    >
                      {uploadLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600"></div>
                      ) : (
                        <Camera className="h-5 w-5" />
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                      className="hidden"
                    />
                  </div>
                  <div className="text-center sm:text-left">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {profile.first_name} {profile.last_name}
                    </h2>
                    <p className="text-lg text-orange-600 mt-1">@{profile.username}</p>
                    <p className="text-gray-500 mt-1">
                      Member since {formatDate(profile.date_joined)}
                    </p>
                    {profile.business_type && (
                      <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full mt-3">
                        {profile.business_type}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <User className="h-6 w-6 mr-2 text-orange-600" />
                    Personal Information
                  </h3>
                  <button
                    onClick={() => handleEditToggle('personal')}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {editMode.personal ? (
                      <X className="h-5 w-5 text-gray-600" />
                    ) : (
                      <Edit3 className="h-5 w-5 text-orange-600" />
                    )}
                  </button>
                </div>

                {editMode.personal ? (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={personalForm.first_name}
                          onChange={(e) => setPersonalForm(prev => ({ ...prev, first_name: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={personalForm.last_name}
                          onChange={(e) => setPersonalForm(prev => ({ ...prev, last_name: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      <textarea
                        value={personalForm.bio}
                        onChange={(e) => setPersonalForm(prev => ({ ...prev, bio: e.target.value }))}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          value={personalForm.date_of_birth}
                          onChange={(e) => setPersonalForm(prev => ({ ...prev, date_of_birth: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Gender
                        </label>
                        <select
                          value={personalForm.gender}
                          onChange={(e) => setPersonalForm(prev => ({ ...prev, gender: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer_not_to_say">Prefer not to say</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 pt-2">
                      <button
                        onClick={handleSavePersonal}
                        disabled={saveLoading}
                        className="inline-flex items-center px-5 py-2.5 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors shadow-sm disabled:opacity-50"
                      >
                        {saveLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Changes
                      </button>
                      <button
                        onClick={() => handleEditToggle('personal')}
                        className="inline-flex items-center px-5 py-2.5 text-gray-700 bg-gray-100 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
                    <div>
                      <p className="text-sm font-medium text-gray-500">First Name</p>
                      <p className="text-gray-900 mt-1">{profile.first_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Last Name</p>
                      <p className="text-gray-900 mt-1">{profile.last_name || 'Not provided'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-500">Bio</p>
                      <p className="text-gray-900 mt-1">{profile.bio || 'No bio provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                      <p className="text-gray-900 mt-1">{profile.date_of_birth ? formatDate(profile.date_of_birth) : 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Gender</p>
                      <p className="text-gray-900 mt-1 capitalize">{profile.gender || 'Not specified'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Mail className="h-6 w-6 mr-2 text-orange-600" />
                    Contact Information
                  </h3>
                  <button
                    onClick={() => handleEditToggle('contact')}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {editMode.contact ? (
                      <X className="h-5 w-5 text-gray-600" />
                    ) : (
                      <Edit3 className="h-5 w-5 text-orange-600" />
                    )}
                  </button>
                </div>

                {editMode.contact ? (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profile.email}
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <input
                        type="text"
                        value={contactForm.address}
                        onChange={(e) => setContactForm(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          value={contactForm.city}
                          onChange={(e) => setContactForm(prev => ({ ...prev, city: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State/Province
                        </label>
                        <input
                          type="text"
                          value={contactForm.state}
                          onChange={(e) => setContactForm(prev => ({ ...prev, state: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ZIP Code
                        </label>
                        <input
                          type="text"
                          value={contactForm.zip_code}
                          onChange={(e) => setContactForm(prev => ({ ...prev, zip_code: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country
                        </label>
                        <input
                          type="text"
                          value={contactForm.country}
                          onChange={(e) => setContactForm(prev => ({ ...prev, country: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 pt-2">
                      <button
                        onClick={handleSaveContact}
                        disabled={saveLoading}
                        className="inline-flex items-center px-5 py-2.5 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors shadow-sm disabled:opacity-50"
                      >
                        {saveLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Changes
                      </button>
                      <button
                        onClick={() => handleEditToggle('contact')}
                        className="inline-flex items-center px-5 py-2.5 text-gray-700 bg-gray-100 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 text-gray-600">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-gray-900 mt-1">{profile.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <p className="text-gray-900 mt-1">{profile.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Address</p>
                      <p className="text-gray-900 mt-1">
                        {[profile.address, profile.city, profile.state, profile.zip_code, profile.country]
                          .filter(Boolean)
                          .join(', ') || 'Not provided'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Bell className="h-6 w-6 mr-2 text-orange-600" />
                    Notification Preferences
                  </h3>
                  <button
                    onClick={() => handleEditToggle('notifications')}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {editMode.notifications ? (
                      <X className="h-5 w-5 text-gray-600" />
                    ) : (
                      <Edit3 className="h-5 w-5 text-orange-600" />
                    )}
                  </button>
                </div>

                {editMode.notifications ? (
                  <div className="space-y-6">
                    {[
                      { key: 'email_notifications', label: 'Email Notifications', description: 'Receive notifications via email' },
                      { key: 'sms_notifications', label: 'SMS Notifications', description: 'Receive notifications via SMS' },
                      { key: 'marketing_emails', label: 'Marketing Emails', description: 'Receive promotional offers and updates' },
                      { key: 'order_updates', label: 'Order Updates', description: 'Receive notifications about your orders' }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{item.label}</p>
                          <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationForm[item.key as keyof typeof notificationForm]}
                          onChange={(e) => setNotificationForm(prev => ({ 
                            ...prev, 
                            [item.key]: e.target.checked 
                          }))}
                          className="h-5 w-5 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        />
                      </div>
                    ))}
                    <div className="flex flex-wrap gap-3 pt-2">
                      <button
                        onClick={handleSaveNotifications}
                        disabled={saveLoading}
                        className="inline-flex items-center px-5 py-2.5 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors shadow-sm disabled:opacity-50"
                      >
                        {saveLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Changes
                      </button>
                      <button
                        onClick={() => handleEditToggle('notifications')}
                        className="inline-flex items-center px-5 py-2.5 text-gray-700 bg-gray-100 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[
                      { key: 'email_notifications', label: 'Email Notifications' },
                      { key: 'sms_notifications', label: 'SMS Notifications' },
                      { key: 'marketing_emails', label: 'Marketing Emails' },
                      { key: 'order_updates', label: 'Order Updates' }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-900 font-medium">{item.label}</p>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          profile.notification_preferences?.[item.key as keyof typeof profile.notification_preferences] 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {profile.notification_preferences?.[item.key as keyof typeof profile.notification_preferences] ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Shield className="h-6 w-6 mr-2 text-orange-600" />
                    Change Password
                  </h3>
                  <button
                    onClick={() => handleEditToggle('password')}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {editMode.password ? (
                      <X className="h-5 w-5 text-gray-600" />
                    ) : (
                      <Edit3 className="h-5 w-5 text-orange-600" />
                    )}
                  </button>
                </div>

                {editMode.password ? (
                  <div className="space-y-5">
                    {[
                      { key: 'current', label: 'Current Password' },
                      { key: 'new', label: 'New Password' },
                      { key: 'confirm', label: 'Confirm New Password' }
                    ].map((field) => (
                      <div key={field.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {field.label}
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords[field.key as keyof typeof showPasswords] ? 'text' : 'password'}
                            value={passwordForm[`${field.key}_password` as keyof typeof passwordForm]}
                            onChange={(e) => setPasswordForm(prev => ({ 
                              ...prev, 
                              [`${field.key}_password`]: e.target.value 
                            }))}
                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ 
                              ...prev, 
                              [field.key]: !prev[field.key as keyof typeof prev] 
                            }))}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPasswords[field.key as keyof typeof showPasswords] ? 
                              <EyeOff className="h-5 w-5 text-gray-400" /> : 
                              <Eye className="h-5 w-5 text-gray-400" />}
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="flex flex-wrap gap-3 pt-2">
                      <button
                        onClick={handleChangePassword}
                        disabled={saveLoading || !passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password}
                        className="inline-flex items-center px-5 py-2.5 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors shadow-sm disabled:opacity-50"
                      >
                        {saveLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Change Password
                      </button>
                      <button
                        onClick={() => {
                          handleEditToggle('password');
                          setPasswordForm({
                            current_password: '',
                            new_password: '',
                            confirm_password: ''
                          });
                        }}
                        className="inline-flex items-center px-5 py-2.5 text-gray-700 bg-gray-100 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 text-center">
                      Click the edit button to change your password. Make sure to use a strong password with at least 8 characters.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-xl">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-5 flex items-center">
                  <Settings className="h-6 w-6 mr-2 text-orange-600" />
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { 
                      icon: Package, 
                      label: 'My Orders', 
                      description: 'View order history',
                      path: '/my-orders'
                    },
                    { 
                      icon: Home, 
                      label: 'Marketplace', 
                      description: 'Continue shopping',
                      path: '/marketplace'
                    },
                    { 
                      icon: ShoppingCart, 
                      label: 'My Cart', 
                      description: 'View cart items',
                      path: '/cart'
                    },
                    ...(profile && (profile.business_type === 'distributor' || profile.business_type === 'retailer') ? [{
                      icon: BarChart3,
                      label: 'Dashboard',
                      description: 'View analytics',
                      path: '/home'
                    }] : [])
                  ].map((action, index) => (
                    <button
                      key={index}
                      onClick={() => navigate(action.path)}
                      className="flex flex-col items-center justify-center p-5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all group"
                    >
                      <div className="text-orange-600 group-hover:text-orange-700 transition-colors">
                        <action.icon className="h-8 w-8" />
                      </div>
                      <p className="mt-3 text-gray-900 font-medium">{action.label}</p>
                      <p className="mt-1 text-gray-500 text-sm">{action.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default UserProfile;
