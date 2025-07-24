import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const TermsofService: React.FC = () => {
  return (
    <>
      <Navbar />
      <div className="bg-white py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">Terms of Service</h1>
          <div className="space-y-6 text-gray-700 text-base">
            <section>
              <h2 className="text-xl font-semibold mb-2">1. Acceptance of Terms</h2>
              <p>
                By accessing or using MulyaBazzar, you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not use our platform.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-2">2. User Accounts</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials and all activities that occur under your account. Notify us immediately of any unauthorized use.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-2">3. Prohibited Activities</h2>
              <ul className="list-disc pl-6">
                <li>Violating any laws or regulations</li>
                <li>Infringing intellectual property rights</li>
                <li>Distributing harmful or malicious content</li>
                <li>Engaging in fraudulent or misleading activities</li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-2">4. Product Listings & Transactions</h2>
              <p>
                Sellers must provide accurate product information. Buyers are responsible for reviewing product details before making a purchase. MulyaBazzar is not liable for disputes between buyers and sellers.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-2">5. Limitation of Liability</h2>
              <p>
                MulyaBazzar is provided on an "as is" basis. We are not liable for any damages resulting from your use of the platform.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-2">6. Changes to Terms</h2>
              <p>
                We reserve the right to update these Terms at any time. Continued use of the platform constitutes acceptance of the revised Terms.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-2">7. Contact Us</h2>
              <p>
                If you have any questions about these Terms, please <a href="/contact" className="text-orange-600 hover:underline">contact us</a>.
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default TermsofService;
