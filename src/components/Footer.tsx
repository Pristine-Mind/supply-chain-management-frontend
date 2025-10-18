import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const FacebookIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.621 5.367 11.988 11.988 11.988s11.987-5.367 11.987-11.988C24.004 5.367 18.637.001 12.017.001zM8.449 16.988c-2.508 0-4.541-2.033-4.541-4.54s2.033-4.541 4.541-4.541c2.508 0 4.541 2.034 4.541 4.541s-2.033 4.54-4.541 4.54zm7.519 0c-2.508 0-4.541-2.033-4.541-4.54s2.033-4.541 4.541-4.541c2.508 0 4.541 2.034 4.541 4.541s-2.033 4.54-4.541 4.54z"/>
  </svg>
);

const LinkedInIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const MapPinIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PhoneIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const MailIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const CheckIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const NewsletterIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
  </svg>
);

interface FooterLinkProps {
  to: string;
  children: React.ReactNode;
  external?: boolean;
}

const FooterLink: React.FC<FooterLinkProps> = ({ to, children, external = false }) => {
  const baseClasses = "text-gray-600 hover:text-orange-500 transition-all duration-200 hover:translate-x-1 inline-block group";
  
  if (external) {
    return (
      <a 
        href={to} 
        target="_blank" 
        rel="noopener noreferrer" 
        className={baseClasses}
      >
        {children}
        <span className="opacity-0 group-hover:opacity-100 ml-1 transition-opacity">→</span>
      </a>
    );
  }
  
  return (
    <Link to={to} className={baseClasses}>
      {children}
      <span className="opacity-0 group-hover:opacity-100 ml-1 transition-opacity">→</span>
    </Link>
  );
};

const SocialLink: React.FC<{ href: string; icon: React.ReactNode; label: string }> = ({ href, icon, label }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="group relative p-3 bg-gray-100 hover:bg-gradient-to-br hover:from-orange-400 hover:to-orange-600 rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-lg"
    aria-label={label}
  >
    <div className="text-gray-600 group-hover:text-white transition-colors duration-300">
      {icon}
    </div>
    <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
  </a>
);

const PaymentBadge: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`flex items-center bg-white hover:bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 hover:border-orange-300 shadow-sm hover:shadow-md transition-all duration-200 ${className}`}>
    {children}
  </div>
);

const NewsletterForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubscribed(true);
    setIsLoading(false);
    setEmail('');
    
    setTimeout(() => setIsSubscribed(false), 3000);
  };

  return (
    <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-2xl border border-orange-200">
      <div className="flex items-center mb-4">
        <NewsletterIcon className="w-6 h-6 text-orange-600 mr-2" />
        <h4 className="text-lg font-semibold text-gray-900">Stay Updated</h4>
      </div>
      <p className="text-gray-600 mb-4 text-sm">Get the latest deals and updates delivered to your inbox.</p>
      
      {isSubscribed ? (
        <div className="flex items-center text-green-600 animate-in fade-in duration-300">
          <CheckIcon className="w-5 h-5 mr-2" />
          <span className="font-medium">Thanks for subscribing!</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Subscribing...
              </div>
            ) : (
              'Subscribe'
            )}
          </button>
        </form>
      )}
    </div>
  );
};

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-gradient-to-b from-gray-50 to-white border-t border-gray-200">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-100 rounded-full opacity-20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-100 rounded-full opacity-20 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 mb-12">
          <div className="lg:col-span-4 space-y-6">
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-2">
                MulyaBazzar
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Connecting you to quality products with trusted sellers across Nepal. Your satisfaction is our priority.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-900 mb-3">Follow Us</p>
              <div className="flex space-x-3">
                <SocialLink
                  href="https://www.facebook.com/profile.php?id=61571097347345"
                  icon={<FacebookIcon className="w-5 h-5" />}
                  label="Facebook"
                />
                <SocialLink
                  href="https://www.instagram.com/mulya_bazzar/"
                  icon={<InstagramIcon className="w-5 h-5" />}
                  label="Instagram"
                />
                <SocialLink
                  href="https://www.linkedin.com/company/105111648/admin/dashboard/"
                  icon={<LinkedInIcon className="w-5 h-5" />}
                  label="LinkedIn"
                />
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-900 mb-3">Download Our App</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a 
                  href="https://play.google.com/store/apps/details?id=com.pristineminds.supply_chain_mobile&pcampaignid=web_share" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:scale-105 transition-transform duration-200"
                >
                  <img 
                    src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" 
                    alt="Get it on Google Play" 
                    className="h-12 w-auto" 
                  />
                </a>
                <a 
                  href="https://apps.apple.com/np/app/mulyabazar/id6749258559" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:scale-105 transition-transform duration-200"
                >
                  <img 
                    src="https://developer.apple.com/app-store/marketing/guidelines/images/badge-download-on-the-app-store.svg" 
                    alt="Download on the App Store" 
                    className="h-12 w-auto" 
                  />
                </a>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-lg font-semibold text-gray-900 mb-6">Quick Links</h4>
            <ul className="space-y-3">
              <li><FooterLink to="/about">About Us</FooterLink></li>
              <li><FooterLink to="/marketplace">Products</FooterLink></li>
              <li><FooterLink to="/sellers">Sellers</FooterLink></li>
              <li><FooterLink to="/buyer/register">Buyer</FooterLink></li>
              <li><FooterLink to="/transporters">Transporters</FooterLink></li>
              <li><FooterLink to="/blog">Blog</FooterLink></li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-lg font-semibold text-gray-900 mb-6">Support</h4>
            <ul className="space-y-3">
              <li><FooterLink to="/faq">FAQ</FooterLink></li>
              <li><FooterLink to="/shipping">Shipping & Delivery</FooterLink></li>
              <li><FooterLink to="/returns">Returns & Refunds</FooterLink></li>
              <li><FooterLink to="/terms">Terms of Service</FooterLink></li>
              <li><FooterLink to="/privacy">Privacy Policy</FooterLink></li>
            </ul>
          </div>

          <div className="lg:col-span-4">
            <NewsletterForm />
          </div>
        </div>

        <div className="mb-12">
          <h4 className="text-lg font-semibold text-gray-900 mb-6">Contact Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all duration-200">
              <MapPinIcon className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900 text-sm">Address</p>
                <p className="text-gray-600 text-sm">Baluwatar, Kathmandu, Nepal</p>
              </div>
            </div>
            
            <a 
              href="tel:+9779767474645" 
              className="flex items-start space-x-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all duration-200 group"
            >
              <PhoneIcon className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0 group-hover:animate-pulse" />
              <div>
                <p className="font-medium text-gray-900 text-sm">Phone</p>
                <p className="text-gray-600 group-hover:text-orange-600 text-sm transition-colors">+977 9767474645</p>
              </div>
            </a>
            
            <a 
              href="mailto:mulyabazzar@gmail.com" 
              className="flex items-start space-x-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all duration-200 group"
            >
              <MailIcon className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900 text-sm">Email</p>
                <p className="text-gray-600 group-hover:text-orange-600 text-sm transition-colors">mulyabazzar@gmail.com</p>
              </div>
            </a>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-6 lg:space-y-0">
            <p className="text-gray-500 text-sm text-center lg:text-left">
              &copy; {currentYear} MulyaBazzar. All rights reserved. Made by Pristine Minds Nepal Pvt Ltd
            </p>
            
            <div className="flex flex-wrap justify-center lg:justify-end items-center gap-3">
              <p className="text-sm font-medium text-gray-700 mr-2">We Accept:</p>
              
              <PaymentBadge>
                <CheckIcon className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Cash on Delivery</span>
              </PaymentBadge>
              
              <PaymentBadge>
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" 
                  alt="VISA" 
                  className="h-6 w-auto" 
                />
              </PaymentBadge>
              
              <PaymentBadge>
                <img 
                  src="https://images.seeklogo.com/logo-png/38/1/khalti-digital-wallet-logo-png_seeklogo-380047.png" 
                  alt="Khalti" 
                  className="h-6 w-auto" 
                />
              </PaymentBadge>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
