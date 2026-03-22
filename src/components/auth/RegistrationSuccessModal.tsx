import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Loader } from 'lucide-react';

export interface RegistrationSuccessModalProps {
  isOpen: boolean;
  username?: string;
  autoRedirectDelay?: number; // in milliseconds
  onRedirect?: () => void;
  onManualRedirect?: () => void;
}

/**
 * Success modal shown after user registration
 * Features auto-redirect countdown and manual redirect button
 */
export const RegistrationSuccessModal: React.FC<RegistrationSuccessModalProps> = ({
  isOpen,
  username,
  autoRedirectDelay = 5000,
  onRedirect,
  onManualRedirect,
}) => {
  const [countdown, setCountdown] = useState(Math.ceil(autoRedirectDelay / 1000));
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setIsRedirecting(true);
          onRedirect?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [isOpen, autoRedirectDelay, onRedirect]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center"
      >
        {/* Success Icon with Pulse Animation */}
        <motion.div
          className="flex justify-center mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        >
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <CheckCircle className="w-20 h-20 text-green-500" strokeWidth={1.5} />
          </motion.div>
        </motion.div>

        {/* Main Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-slate-900 mb-2"
        >
          Account Created!
        </motion.h2>

        {/* Success Message */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-slate-600 mb-2"
        >
          Welcome to MulyaBazzar!
        </motion.p>

        {/* Username Display */}
        {username && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-green-50 border border-green-200 rounded-lg py-3 px-4 mb-6"
          >
            <p className="text-sm text-slate-600">
              Username: <span className="font-semibold text-green-700">{username}</span>
            </p>
          </motion.div>
        )}

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-slate-500 text-sm mb-8 leading-relaxed"
        >
          Your account is ready to use. Sign in with your credentials to start exploring our marketplace.
        </motion.p>

        {/* Redirect Button & Countdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          <button
            onClick={onManualRedirect}
            disabled={isRedirecting}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-primary-200 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {isRedirecting ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Redirecting...
              </>
            ) : (
              'Sign In Now'
            )}
          </button>

          {/* Auto-redirect Countdown */}
          {!isRedirecting && countdown > 0 && (
            <motion.p
              animate={{ opacity: [0.6, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="text-sm text-slate-500"
            >
              Redirecting in{' '}
              <span className="font-bold text-primary-600">{countdown}</span>s...
            </motion.p>
          )}
        </motion.div>

        {/* Decorative Confetti-like elements */}
        <motion.div className="absolute top-4 left-4 w-2 h-2 bg-primary-400 rounded-full" animate={{ y: [-10, 10], opacity: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity }} />
        <motion.div className="absolute bottom-4 right-4 w-2 h-2 bg-green-400 rounded-full" animate={{ y: [10, -10], opacity: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }} />
        <motion.div className="absolute top-1/2 right-4 w-1.5 h-1.5 bg-blue-400 rounded-full" animate={{ x: [-10, 10], opacity: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }} />
      </motion.div>
    </motion.div>
  );
};

export default RegistrationSuccessModal;
