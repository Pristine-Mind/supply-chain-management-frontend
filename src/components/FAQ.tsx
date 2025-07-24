import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import Navbar from './Navbar';
import Footer from './Footer';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const faqItems: FAQItem[] = [
    {
      question: 'How do I create an account as a buyer?',
      answer: 'Click on the "Register" button in the top navigation and select "I\'m a Buyer" to create your buyer account. Fill in the required details and you\'ll be ready to start shopping.'
    },
    {
      question: 'How can I sell my products on MulyaBazzar?',
      answer: 'To become a seller, click on "Register" and select "I\'m a Seller". Complete the registration process, verify your business details, and you can start listing your products once approved.'
    },
    {
      question: 'What payment methods do you accept?',
      'answer': 'We accept various payment methods including credit/debit cards, bank transfers, and popular mobile wallets. All transactions are secure and encrypted.'
    },
    {
      question: 'How does shipping work?',
      'answer': 'Shipping options and costs vary by seller and product. You\'ll see available shipping methods at checkout. Most orders are processed within 1-2 business days and delivered within 3-7 business days.'
    },
    {
      question: 'Can I return or exchange a product?',
      'answer': 'Yes, we have a 7-day return policy. If you\'re not satisfied with your purchase, you can initiate a return through your order history. Some items may be excluded from returns for hygiene reasons.'
    },
    {
      question: 'How do I track my order?',
      'answer': 'Once your order ships, you\'ll receive a tracking number via email. You can also check the status of your order by logging into your account and viewing your order history.'
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
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Can't find the answer you're looking for? Reach out to our
            <a href="/contact" className="ml-1 font-medium text-orange-600 hover:text-orange-500">
              customer support
            </a>
            .
          </p>
        </div>

        <div className="space-y-4">
          {faqItems.map((item, index) => (
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
                  {item.question}
                </span>
                {activeIndex === index ? (
                  <FiChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <FiChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </button>
              {activeIndex === index && (
                <div className="px-6 pb-4 pt-2 bg-white">
                  <p className="text-gray-600">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 bg-orange-50 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Still have questions?</h3>
          <p className="text-gray-600 mb-4">
            Can't find the answer you're looking for? Our support team is here to help.
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

export default FAQ;
