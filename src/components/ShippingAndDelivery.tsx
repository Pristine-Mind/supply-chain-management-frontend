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
  const [loading, setLoading] = useState<boolean>(true);

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

  // Simulate loading delay
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Navbar />
      <div className="p-8 bg-white rounded-xl shadow-sm mb-8 w-full max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-primary-700 mb-6">Shipping & Delivery</h1>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mr-4"></div>
            <span className="text-base text-gray-500">Loading shipping info...</span>
          </div>
        ) : (
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
        )}
      </div>
      <Footer />
    </>
  );
};

export default ShippingAndDelivery;
