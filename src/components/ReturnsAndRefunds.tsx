import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiRefreshCw, FiDollarSign, FiPackage, FiX, FiClock } from 'react-icons/fi';
import Navbar from './Navbar';
import Footer from './Footer';

interface PolicyItem {
  title: string;
  icon: React.ReactNode;
  content: string | string[];
  isList?: boolean;
}

const ReturnsAndRefunds: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const policyItems: PolicyItem[] = [
    {
      title: 'Return Policy',
      icon: <FiRefreshCw className="w-5 h-5 text-orange-500" />,
      content: [
        '14-day return window from delivery date',
        'Items must be in original condition with tags attached',
        'Original packaging must be undamaged',
        'Free returns for damaged or incorrect items'
      ],
      isList: true
    },
    {
      title: 'Refund Process',
      icon: <FiDollarSign className="w-5 h-5 text-orange-500" />,
      content: [
        'Refunds processed within 3-5 business days',
        'Original payment method will be credited',
        'Shipping fees are non-refundable',
        'Refund amount may be adjusted for used items'
      ],
      isList: true
    },
    {
      title: 'How to Return',
      icon: <FiPackage className="w-5 h-5 text-orange-500" />,
      content: [
        'Log in to your account',
        'Go to Order History',
        'Select items to return',
        'Print return label and packing slip',
        'Ship items back within 14 days'
      ],
      isList: true
    },
    {
      title: 'Non-Returnable Items',
      icon: <FiX className="w-5 h-5 text-orange-500" />,
      content: [
        'Perishable goods',
        'Personalized/custom items',
        'Intimate/sanitary products',
        'Digital products',
        'Gift cards'
      ],
      isList: true
    },
    {
      title: 'Processing Time',
      icon: <FiClock className="w-5 h-5 text-orange-500" />,
      content: 'Please allow 3-5 business days for return processing after we receive your package. You will receive an email confirmation once your return is processed.'
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
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Returns & Refunds
            </h1>
            <p className="mt-4 text-xl text-gray-600">
              Our hassle-free return and refund policy
            </p>
          </div>

          <div className="space-y-6">
            {policyItems.map((item, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  className={`w-full px-6 py-4 text-left focus:outline-none flex items-center justify-between ${
                    activeIndex === index ? 'bg-orange-50' : 'bg-white hover:bg-gray-50'
                  }`}
                  onClick={() => toggleAccordion(index)}
                >
                  <span className="flex items-center gap-2 text-lg font-medium text-gray-900">
                    {item.icon} {item.title}
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">Need Help?</h3>
            <p className="text-gray-600 mb-4">
              For questions about returns or refunds, contact our support team.
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

export default ReturnsAndRefunds;
