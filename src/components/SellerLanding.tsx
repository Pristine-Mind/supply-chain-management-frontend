import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/solid';

const BENEFITS = [
  { title: '0% Commission', subtitle: 'Only pay when you sell.' },
  { title: 'Free Shipping', subtitle: 'We handle delivery for you.' },
  { title: 'Nationwide Reach', subtitle: 'Sell across the country.' },
  { title: 'Dedicated Support', subtitle: 'Expert help 24/7.' },
  { title: 'Marketing Tools', subtitle: 'Boost your visibility.' },
  { title: 'Timely Payments', subtitle: 'Fast settlements.' },
];

const STEPS = [
  'Sign up with a phone number',
  'Fill in contact email & address details',
  'Submit ID and Bank Account details',
  'Upload products and get orders!',
];

const FAQS = [
  { q: 'How can I sell on MulyaBazzar?', a: 'Just create an account, list your products, and start selling!' },
  { q: 'What categories can I sell?', a: 'Fruits, Vegetables, Grains, Spices, Dairy, and more.' },
  { q: 'How much commission do you charge?', a: 'We charge 0% until you make your first sale.' },
  { q: 'What is the payment policy?', a: 'Payouts within 3 business days after delivery confirmation.' },
];

export const SellerLanding: React.FC = () => {
  const [openSteps, setOpenSteps] = useState<number | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="space-y-24">
      <section className="relative bg-orange-50 overflow-hidden">
        <div className="container mx-auto flex flex-col md:flex-row items-center py-20">
          <div className="md:w-1/2 text-center md:text-left space-y-4 px-4">
            <h1 className="text-4xl font-bold text-gray-800">Grow Your Business with MulyaBazzar!</h1>
            <p className="text-gray-600">Reach millions of customers & enjoy zero commission until you sell.</p>
            <Link to="/seller/register" className="inline-block">   
            <button className="mt-4 px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600">
              Sign Up as a Seller
            </button>
            </Link>
          </div>
          <div className="md:w-1/2 mt-8 md:mt-0">
            <img src="https://images.unsplash.com/photo-1556745753-b2904692b3cd?q=80&w=1673&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Happy seller" className="w-full rounded-lg shadow-lg" />
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-8">New Seller Benefits</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {BENEFITS.map(b => (
            <div key={b.title} className="bg-white p-6 rounded-xl shadow hover:shadow-md transition">
              <div className="h-12 w-12 mb-4 bg-orange-100 flex items-center justify-center rounded-full">
                <span className="text-orange-500 font-bold">{b.title.charAt(0)}</span>
              </div>
              <h3 className="font-semibold text-lg">{b.title}</h3>
              <p className="text-gray-600 mt-1">{b.subtitle}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-orange-50 py-16">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-start">
          <div className="md:w-1/2 pr-8">
            <h2 className="text-2xl font-bold mb-4">Steps to Start Selling</h2>
            <p className="text-gray-600 mb-6">
              As a MulyaBazzar seller you’ll get everything you need to grow your business online.
            </p>
            <button className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
              Sign Up Now
            </button>
          </div>
          <div className="md:w-1/2 mt-8 md:mt-0">
            {STEPS.map((step, i) => (
              <div key={i} className="border-b">
                <button
                  onClick={() => setOpenSteps(openSteps === i ? null : i)}
                  className="w-full flex justify-between items-center py-4 text-lg font-medium text-gray-800"
                >
                  <span>{`${i + 1}. ${step}`}</span>
                  {openSteps === i ? (
                    <ChevronUpIcon className="h-5 w-5" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5" />
                  )}
                </button>
                {openSteps === i && (
                  <div className="pb-4 pl-4 text-gray-600">
                    Detailed instructions for "{step}" will go here.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-8">Seller’s Story</h2>
        <div className="space-y-4">
          <blockquote className="bg-white p-6 rounded-xl shadow">
            <p className="text-gray-700 mb-4">“Thanks to MulyaBazzar, I doubled my sales in 3 months!”</p>
            <cite className="block font-semibold">— Alex Sharma, FreshFruits Ltd.</cite>
          </blockquote>
        </div>
      </section>
      <section className="bg-orange-50 py-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="text-2xl font-bold text-center mb-8">FAQ</h2>
          {FAQS.map((f, i) => (
            <div key={i} className="border-b">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex justify-between items-center py-4 text-lg font-medium text-gray-800"
              >
                <span>{f.q}</span>
                {openFaq === i ? (
                  <ChevronUpIcon className="h-5 w-5" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5" />
                )}
              </button>
              {openFaq === i && (
                <div className="pb-4 pl-4 text-gray-600">{f.a}</div>
              )}
            </div>
          ))}
          <div className="text-center mt-6">
            <button className="px-6 py-2 border border-orange-500 text-orange-500 rounded-lg hover:bg-orange-100">
              Need more help?
            </button>
          </div>
        </div>
      </section>

      <section className="bg-orange-500 text-white text-center py-12">
        <h2 className="text-2xl font-bold mb-4">
          What are you waiting for? Start selling with MulyaBazzar today.
        </h2>
        <Link to="/seller/register" className="inline-block">
          <button className="px-8 py-3 bg-white text-orange-500 font-semibold rounded-lg hover:bg-gray-100">
            Get Started
          </button>
        </Link>
      </section>
    </div>
  );
};

export default SellerLanding;
