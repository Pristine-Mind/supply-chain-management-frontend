import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import Navbar from './Navbar';
import Footer from './Footer';

interface InfoItem {
  title: string;
  content: string | string[];
  isList?: boolean;
}

const ShippingAndDelivery: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const shippingInfo: InfoItem[] = [
    {
      title: 'Shipping Options',
      content: [
        'Standard Shipping: 3-7 business days',
        'Express Shipping: 1-3 business days',
        'Same-day Delivery: Available in select locations',
        'Store Pickup: Available for select items'
      ],
      isList: true
    },
    {
      title: 'Delivery Areas',
      content: 'We currently deliver to all major cities and towns across the country. Enter your delivery address at checkout to see specific delivery options and estimated delivery times for your location.'
    },
    {
      title: 'Order Processing',
      content: 'Most orders are processed within 1-2 business days. You will receive a confirmation email with tracking information once your order has shipped.'
    },
    {
      title: 'Tracking Your Order',
      content: 'Once your order ships, you will receive a tracking number via email. You can track your package using our order tracking system or directly through the shipping carrier\'s website.'
    },
    {
      title: 'Shipping Rates',
      content: [
        'Free standard shipping on orders over $50',
        'Standard Shipping: $4.99',
        'Express Shipping: $9.99',
        'Same-day Delivery: $14.99 (when available)'
      ],
      isList: true
    },
    {
      title: 'International Shipping',
      content: 'We currently offer international shipping to select countries. Additional customs fees and import duties may apply and are the responsibility of the customer.'
    }
  ];

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <>
      <Navbar />
      <div className="bg-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Shipping & Delivery Information
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Everything you need to know about getting your order
            </p>
          </div>

          <div className="space-y-4">
            {shippingInfo.map((item, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  className={`w-full px-6 py-4 text-left focus:outline-none flex justify-between items-center ${
                    activeIndex === index ? 'bg-orange-50' : 'bg-white hover:bg-gray-50'
                  }`}
                  onClick={() => toggleAccordion(index)}
                >
                  <span className="text-lg font-medium text-gray-900">
                    {item.title}
                  </span>
                  {activeIndex === index ? (
                    <FiChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <FiChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                {activeIndex === index && (
                  <div className="px-6 pb-4 pt-2 bg-white">
                    {item.isList ? (
                      <ul className="list-disc pl-5 space-y-2 text-gray-600">
                        {(item.content as string[]).map((point, i) => (
                          <li key={i}>{point}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-600">{item.content as string}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 bg-orange-50 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Need Help With Your Order?</h3>
            <p className="text-gray-600 mb-4">
              Our customer service team is here to help with any shipping or delivery questions.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ShippingAndDelivery;
