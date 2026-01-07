import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  Store, 
  TrendingUp, 
  Headphones, 
  Wrench, 
  Zap, 
  CheckCircle2, 
  MessageCircle,
  ArrowRight
} from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';

const BENEFITS = [
  { 
    title: '0% Commission', 
    subtitle: 'Keep all your earnings. Only pay a tiny flat fee when you sell.',
    icon: <Zap className="w-6 h-6 text-orange-600" />
  },
  { 
    title: 'Nationwide Reach', 
    subtitle: 'From Kathmandu to Jhapa, your products reach every corner.',
    icon: <TrendingUp className="w-6 h-6 text-orange-600" />
  },
  { 
    title: 'Dedicated Support', 
    subtitle: 'Expert business consultants available 24/7 to help you grow.',
    icon: <Headphones className="w-6 h-6 text-orange-600" />
  },
  { 
    title: 'Marketing Tools', 
    subtitle: 'Get access to premium analytics and promotion banners.',
    icon: <Wrench className="w-6 h-6 text-orange-600" />
  },
  { 
    title: 'Timely Payments', 
    subtitle: 'Reliable 3-day settlement cycle directly to your bank.',
    icon: <CheckCircle2 className="w-6 h-6 text-orange-600" />
  },
  { 
    title: 'Seller Dashboard', 
    subtitle: 'Manage inventory, orders, and returns in one simple app.',
    icon: <Store className="w-6 h-6 text-orange-600" />
  },
];

const STEPS = [
  { title: 'Quick Signup', desc: 'Verify your phone number and get instant access to the seller portal.' },
  { title: 'Business Identity', desc: 'Enter your shop address and basic contact email for logistics.' },
  { title: 'Verification', desc: 'Upload your ID and Bank details to ensure secure, fast payouts.' },
  { title: 'Go Live', desc: 'List your first product and start receiving orders nationwide!' },
];

const FAQS = [
  { q: 'How can I sell on MulyaBazzar?', a: 'Just create an account, list your products, and start selling!' },
  { q: 'What categories can I sell?', a: 'Fruits, Vegetables, Grains, Spices, Dairy, and more.' },
  { q: 'How much commission do you charge?', a: 'We charge 0% until you make your first sale.' },
  { q: 'What is the payment policy?', a: 'Payouts within 3 business days after delivery confirmation.' },
];

export const SellerLanding: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="bg-white selection:bg-orange-100">
      <Navbar />

      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-orange-100/50 rounded-full blur-3xl -z-10" />
        <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8 text-center lg:text-left"
          >
            <span className="inline-block px-4 py-1.5 bg-orange-100 text-orange-700 text-sm font-bold rounded-full uppercase tracking-wider">
              Start your online journey
            </span>
            <h1 className="text-5xl lg:text-6xl font-black text-slate-900 leading-tight">
              Grow Your Business with <span className="text-orange-500">MulyaBazzar!</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-xl mx-auto lg:mx-0">
              Reach millions of customers across Nepal. Enjoy <span className="font-bold text-slate-900">Zero Commission</span> on your first month of sales.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/business-register">
                <button className="w-full sm:w-auto px-8 py-4 bg-orange-500 text-white font-bold rounded-2xl hover:bg-orange-600 shadow-xl shadow-orange-200 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2">
                  Sign Up as a Business <ArrowRight size={20} />
                </button>
              </Link>
            </div>
          </motion.div>
          
          <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="relative"
          >
            <div className="absolute inset-0 bg-orange-500 rounded-3xl rotate-3 scale-95 opacity-20" />
            <img 
              src="https://images.unsplash.com/photo-1556745753-b2904692b3cd?q=80&w=1673&auto=format&fit=crop" 
              alt="Happy seller" 
              className="relative w-full rounded-3xl shadow-2xl z-10" 
            />
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4">Why Sell on MulyaBazzar?</h2>
          <p className="text-slate-500">Everything you need to thrive in the digital marketplace.</p>
        </div>
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {BENEFITS.map((b, i) => (
            <motion.div 
              key={b.title}
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group"
            >
              <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
                {b.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{b.title}</h3>
              <p className="text-slate-500 leading-relaxed">{b.subtitle}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <h2 className="text-4xl font-black text-slate-900 mb-6">4 Simple Steps to Your First Sale</h2>
              <p className="text-lg text-slate-600 mb-8">
                MulyaBazzar provides a seamless onboarding experience. Get your store live in less than 24 hours.
              </p>
              <div className="space-y-8">
                {STEPS.map((step, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">{step.title}</h4>
                      <p className="text-slate-500">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-1/2 bg-orange-500 rounded-[3rem] p-12 text-white">
               <h3 className="text-2xl font-bold mb-4">Start your journey now</h3>
               <p className="mb-8 opacity-90">Join 5000+ local businesses growing with us.</p>
               <div className="space-y-4">
                  <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl flex items-center gap-3">
                    <CheckCircle2 className="text-white" /> High visibility on marketplace
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl flex items-center gap-3">
                    <CheckCircle2 className="text-white" /> Advanced analytics dashboard
                  </div>
               </div>
               <Link to="/business-register" className="mt-10 block">
                <button className="w-full py-4 bg-white text-orange-600 font-bold rounded-2xl hover:bg-slate-100 transition-colors">
                  Create Seller Account
                </button>
               </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <MessageCircle className="w-12 h-12 text-orange-500 mx-auto mb-8 opacity-50" />
            <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-8">
              “Thanks to MulyaBazzar, I doubled my sales in 3 months! The platform is intuitive, and the support team actually cares about small businesses.”
            </h2>
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center font-bold text-xl">AS</div>
              <div className="text-left">
                <p className="font-bold text-lg">Alex Sharma</p>
                <p className="text-slate-400">Founder, FreshFruits Ltd.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_50%,rgba(249,115,22,0.1),transparent)]" />
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-black text-center text-slate-900 mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQS.map((f, i) => (
              <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex justify-between items-center p-6 text-left font-bold text-slate-800 hover:bg-slate-50 transition-colors"
                >
                  <span>{f.q}</span>
                  <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      <div className="p-6 pt-0 text-slate-500 border-t border-slate-100">
                        {f.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="bg-orange-500 rounded-[3rem] p-12 text-center text-white relative overflow-hidden shadow-2xl shadow-orange-200">
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Start selling today.</h2>
            <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto">
              Ready to take your local business to millions of online shoppers? We’re here to help you every step of the way.
            </p>
            <Link to="/business-register">
              <button className="px-10 py-4 bg-white text-orange-600 font-bold rounded-2xl hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 shadow-xl">
                Get Started for Free
              </button>
            </Link>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SellerLanding;
