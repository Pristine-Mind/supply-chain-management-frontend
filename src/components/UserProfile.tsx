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
  ShoppingCart
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
      
      // Use the message from the API response if available, otherwise use default message
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
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

  // Address management functions removed for simplicity
  // Can be implemented in future versions

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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Log In</h1>
            <p className="text-gray-600 mb-6">You need to be logged in to view your profile.</p>
                        <button
              onClick={() => navigate('/login')}
              className="btn-primary"
            >
              Login to Continue
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
        <div className="min-h-screen bg-soft-gradient flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading your profile...</p>
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
            <p className="text-gray-600 mb-6">We couldn't load your profile information.</p>
            <button
              onClick={loadProfile}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Retry
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
      <div className="min-h-screen bg-soft-gradient section-spacing">
        <div className="max-w-4xl mx-auto container-padding">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
            <p className="text-gray-600">Manage your account settings and preferences</p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                <p className="text-green-700">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Profile Picture & Basic Info */}
            <div className="card-elevated">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="h-24 w-24 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                    {profile.profile_picture ? (
                      <img
                        src={profile.profile_picture}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-12 w-12 text-gray-400" />
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadLoading}
                    className="absolute bottom-0 right-0 bg-primary-500 text-white p-2 rounded-full hover:bg-primary-600 transition-colors disabled:opacity-50"
                  >
                    {uploadLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Camera className="h-4 w-4" />
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
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {profile.first_name} {profile.last_name}
                  </h2>
                  <p className="text-gray-600">@{profile.username}</p>
                  <p className="text-sm text-gray-500">
                    Member since {formatDate(profile.date_joined)}
                  </p>
                  {profile.business_type && (
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full mt-1">
                      {profile.business_type}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="card-elevated">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Personal Information
                </h3>
                <button
                  onClick={() => handleEditToggle('personal')}
                  className="text-primary-600 hover:text-primary-700 transition-colors"
                >
                  {editMode.personal ? <X className="h-5 w-5" /> : <Edit3 className="h-5 w-5" />}
                </button>
              </div>

              {editMode.personal ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={personalForm.first_name}
                      onChange={(e) => setPersonalForm(prev => ({ ...prev, first_name: e.target.value }))}
                      className="input-field focus-ring"
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
                      className="input-field focus-ring"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={personalForm.bio}
                      onChange={(e) => setPersonalForm(prev => ({ ...prev, bio: e.target.value }))}
                      rows={3}
                      className="input-field focus-ring"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={personalForm.date_of_birth}
                      onChange={(e) => setPersonalForm(prev => ({ ...prev, date_of_birth: e.target.value }))}
                      className="input-field focus-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    <select
                      value={personalForm.gender}
                      onChange={(e) => setPersonalForm(prev => ({ ...prev, gender: e.target.value }))}
                      className="input-field focus-ring"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 flex space-x-3">
                    <button
                      onClick={handleSavePersonal}
                      disabled={saveLoading}
                      className="btn-primary disabled:opacity-50"
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
                      className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">First Name</p>
                    <p className="text-gray-900">{profile.first_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Last Name</p>
                    <p className="text-gray-900">{profile.last_name || 'Not provided'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-gray-500">Bio</p>
                    <p className="text-gray-900">{profile.bio || 'No bio provided'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Date of Birth</p>
                    <p className="text-gray-900">{profile.date_of_birth ? formatDate(profile.date_of_birth) : 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Gender</p>
                    <p className="text-gray-900 capitalize">{profile.gender || 'Not specified'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div className="card-elevated">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Contact Information
                </h3>
                <button
                  onClick={() => handleEditToggle('contact')}
                  className="text-primary-600 hover:text-primary-700 transition-colors"
                >
                  {editMode.contact ? <X className="h-5 w-5" /> : <Edit3 className="h-5 w-5" />}
                </button>
              </div>

              {editMode.contact ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
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
                      className="input-field focus-ring"
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
                      className="input-field focus-ring"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                        <input
                        type="text"
                        value={contactForm.city}
                        onChange={(e) => setContactForm(prev => ({ ...prev, city: e.target.value }))}
                        className="input-field focus-ring"
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
                        className="input-field focus-ring"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        value={contactForm.zip_code}
                        onChange={(e) => setContactForm(prev => ({ ...prev, zip_code: e.target.value }))}
                        className="input-field focus-ring"
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
                        className="input-field focus-ring"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSaveContact}
                      disabled={saveLoading}
                      className="btn-primary disabled:opacity-50"
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
                      className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="text-gray-900">{profile.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="text-gray-900">{profile.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Address</p>
                    <p className="text-gray-900">
                      {[profile.address, profile.city, profile.state, profile.zip_code, profile.country]
                        .filter(Boolean)
                        .join(', ') || 'Not provided'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Notification Preferences */}
            <div className="card-elevated">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Notification Preferences
                </h3>
                <button
                  onClick={() => handleEditToggle('notifications')}
                  className="text-primary-600 hover:text-primary-700 transition-colors"
                >
                  {editMode.notifications ? <X className="h-5 w-5" /> : <Edit3 className="h-5 w-5" />}
                </button>
              </div>

              {editMode.notifications ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Email Notifications</p>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationForm.email_notifications}
                      onChange={(e) => setNotificationForm(prev => ({ ...prev, email_notifications: e.target.checked }))}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">SMS Notifications</p>
                      <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationForm.sms_notifications}
                      onChange={(e) => setNotificationForm(prev => ({ ...prev, sms_notifications: e.target.checked }))}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Marketing Emails</p>
                      <p className="text-sm text-gray-500">Receive promotional offers and updates</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationForm.marketing_emails}
                      onChange={(e) => setNotificationForm(prev => ({ ...prev, marketing_emails: e.target.checked }))}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Order Updates</p>
                      <p className="text-sm text-gray-500">Receive notifications about your orders</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationForm.order_updates}
                      onChange={(e) => setNotificationForm(prev => ({ ...prev, order_updates: e.target.checked }))}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={handleSaveNotifications}
                      disabled={saveLoading}
                      className="btn-primary disabled:opacity-50"
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
                      className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-gray-900">Email Notifications</p>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      profile.notification_preferences?.email_notifications 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {profile.notification_preferences?.email_notifications ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-900">SMS Notifications</p>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      profile.notification_preferences?.sms_notifications 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {profile.notification_preferences?.sms_notifications ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-900">Marketing Emails</p>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      profile.notification_preferences?.marketing_emails 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {profile.notification_preferences?.marketing_emails ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-900">Order Updates</p>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      profile.notification_preferences?.order_updates 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {profile.notification_preferences?.order_updates ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Change Password */}
            <div className="card-elevated">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Change Password
                </h3>
                <button
                  onClick={() => handleEditToggle('password')}
                  className="text-primary-600 hover:text-primary-700 transition-colors"
                >
                  {editMode.password ? <X className="h-5 w-5" /> : <Edit3 className="h-5 w-5" />}
                </button>
              </div>

              {editMode.password ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordForm.current_password}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 input-field focus-ring"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.current ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordForm.new_password}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 input-field focus-ring"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordForm.confirm_password}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 input-field focus-ring"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleChangePassword}
                      disabled={saveLoading || !passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password}
                      className="btn-primary disabled:opacity-50"
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
                      className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">
                  Click the edit button to change your password. Make sure to use a strong password with at least 8 characters.
                </p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => navigate('/my-orders')}
                  className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="text-center">
                    <Package className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm font-medium text-gray-900">My Orders</p>
                    <p className="text-xs text-gray-500">View order history</p>
                  </div>
                </button>
                <button
                  onClick={() => navigate('/marketplace')}
                  className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="text-center">
                    <Home className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm font-medium text-gray-900">Marketplace</p>
                    <p className="text-xs text-gray-500">Continue shopping</p>
                  </div>
                </button>
                <button
                  onClick={() => navigate('/cart')}
                  className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="text-center">
                    <ShoppingCart className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm font-medium text-gray-900">My Cart</p>
                    <p className="text-xs text-gray-500">View cart items</p>
                  </div>
                </button>
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