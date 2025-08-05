import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/solid';

const BENEFITS = [
  { title: 'Competitive Rates', subtitle: 'Earn what you deserve with our transparent pricing.' },
  { title: 'Flexible Schedules', subtitle: 'Choose routes that fit your schedule.' },
  { title: 'Nationwide Network', subtitle: 'Access to a wide range of delivery opportunities.' },
  { title: 'Timely Payments', subtitle: 'Fast and reliable payment processing.' },
  { title: '24/7 Support', subtitle: 'Dedicated help whenever you need it.' },
  { title: 'Easy Tracking', subtitle: 'Real-time shipment tracking and management.' },
];

const STEPS = [
  'Sign up with your contact details',
  'Complete your profile and upload documents',
  'Get verified and onboarded',
  'Start accepting delivery requests!',
];

const TESTIMONIALS = [
  {
    quote: "MulyaBazzar has helped me grow my transport business with consistent loads and fair rates.",
    author: "Rajesh Kumar",
    company: "Swift Transports"
  },
  {
    quote: "The platform is easy to use and the support team is always helpful. Highly recommended!",
    author: "Priya Sharma",
    company: "GreenLine Logistics"
  }
];

const FAQS = [
  { 
    q: 'How do I become a transporter with MulyaBazzar?', 
    a: 'Simply sign up, complete your profile, submit required documents, and get verified to start accepting deliveries.' 
  },
  { 
    q: 'What documents do I need to provide?', 
    a: 'You\'ll need vehicle registration, insurance, fitness certificate, and your driving license.' 
  },
  { 
    q: 'How do I get paid?', 
    a: 'Payments are processed weekly via bank transfer or UPI to your registered account.' 
  },
  { 
    q: 'Can I choose my delivery routes?', 
    a: 'Yes, you can select routes based on your preference and availability.' 
  },
];

const TransporterLanding: React.FC = () => {
  const [openSteps, setOpenSteps] = useState<number | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="space-y-24">
      <section className="relative bg-blue-50 overflow-hidden">
        <div className="container mx-auto flex flex-col md:flex-row items-center py-20">
          <div className="md:w-1/2 text-center md:text-left space-y-4 px-4">
            <h1 className="text-4xl font-bold text-gray-800">Grow Your Transport Business with MulyaBazzar!</h1>
            <p className="text-gray-600">Connect with businesses needing reliable transport services across the country.</p>
            <Link to="/transporter-register" className="inline-block">   
              <button className="mt-4 px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600">
                Join as a Transporter
              </button>
            </Link>
          </div>
          <div className="md:w-1/2 mt-8 md:mt-0">
            <img 
              src="https://media.istockphoto.com/id/1826896757/photo/parcel-courier-with-van.webp?s=2048x2048&w=is&k=20&c=Mj1litgCdZXcI_7hviX5T9edR__qyieN8keqyGEgFMU=" 
            //   alt="Truck on the road" 
              className="w-full rounded-lg shadow-lg" 
            />
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-8">Why Partner With Us?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {BENEFITS.map((b, i) => (
            <div key={b.title} className="bg-white p-6 rounded-xl shadow hover:shadow-md transition">
              <div className="h-12 w-12 mb-4 bg-orange-100 flex items-center justify-center rounded-full">
                <span className="text-orange-500 font-bold">{i + 1}</span>
              </div>
              <h3 className="font-semibold text-lg">{b.title}</h3>
              <p className="text-gray-600 mt-1">{b.subtitle}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-start">
          <div className="md:w-1/2 pr-8">
            <h2 className="text-2xl font-bold mb-4">Get Started in 4 Simple Steps</h2>
            <p className="text-gray-600 mb-6">
              Join our network of trusted transporters and start growing your business today.
            </p>
            <Link to="/transporter-register" className="inline-block">   
              <button className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                Sign Up Now
              </button>
            </Link>
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
                    Detailed information about "{step}" will be provided during the signup process.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-8">What Our Transport Partners Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {TESTIMONIALS.map((testimonial, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow">
              <p className="text-gray-700 italic mb-4">"{testimonial.quote}"</p>
              <div className="font-semibold">{testimonial.author}</div>
              <div className="text-gray-600 text-sm">{testimonial.company}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto space-y-4">
          {FAQS.map((faq, i) => (
            <div key={i} className="bg-white rounded-lg shadow overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex justify-between items-center p-4 text-left font-medium text-gray-800 hover:bg-gray-50"
              >
                <span>{faq.q}</span>
                {openFaq === i ? (
                  <ChevronUpIcon className="h-5 w-5" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5" />
                )}
              </button>
              {openFaq === i && (
                <div className="p-4 pt-0 text-gray-600 border-t">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-orange-600 text-white py-16">
        <div className="container mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">Join our network of professional transporters and grow your business with MulyaBazzar.</p>
          <Link to="/transporter-register" className="inline-block">
            <button className="px-8 py-3 bg-white text-orange-600 font-semibold rounded-lg hover:bg-orange-100">
              Sign Up Now - It's Free
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default TransporterLanding;
