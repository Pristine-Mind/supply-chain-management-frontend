import React, { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const usernameInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = original
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => usernameInputRef.current?.focus(), 0)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const loginResponse = await axios.post<{ token: string }>(
        `${import.meta.env.VITE_REACT_APP_API_URL}/login/`,
        { username, password }
      )
      const { token } = loginResponse.data

      const userInfoResponse = await axios.get(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/user-info/`,
        { headers: { Authorization: `Token ${token}` } }
      )

      const userData = {
        email: userInfoResponse.data.email || '',
        name: userInfoResponse.data.username || '',
        hasAccessToMarketplace: !!userInfoResponse.data.has_access_to_marketplace,
        businessType: userInfoResponse.data.business_type,
        shopId: userInfoResponse.data.shop_id,
      }

      login(token, userData)
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 z-[9998]" onClick={onClose} />
      <div className="relative z-[10000] w-full max-w-sm bg-white rounded-lg shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Login</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <p className="text-sm text-gray-600 mb-3">Please log in to proceed to checkout.</p>
        {error && (
          <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Username</label>
            <input
              ref={usernameInputRef}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white font-medium py-2 rounded"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )

  return ReactDOM.createPortal(modalContent, document.body)
}

export default LoginModal
