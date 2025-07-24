import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const Privacy: React.FC = () => {
  return (
    <>
      <Navbar />
      <div className="bg-white py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">Privacy Policy</h1>
          <div className="space-y-6 text-gray-700 text-base">
            <section>
              <h2 className="text-xl font-semibold mb-2">1. Information We Collect</h2>
              <ul className="list-disc pl-6">
                <li>Personal information you provide (name, email, address, etc.)</li>
                <li>Order and payment information</li>
                <li>Usage data and cookies</li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-2">2. How We Use Your Information</h2>
              <ul className="list-disc pl-6">
                <li>To process orders and provide services</li>
                <li>To improve our platform and customer experience</li>
                <li>To communicate with you about your account or orders</li>
                <li>For legal and security purposes</li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-2">3. Sharing Your Information</h2>
              <ul className="list-disc pl-6">
                <li>With trusted third parties for payment, shipping, and analytics</li>
                <li>When required by law or to protect rights and safety</li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-2">4. Data Security</h2>
              <p>
                We use industry-standard measures to protect your data. However, no method of transmission over the Internet is 100% secure.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-2">5. Your Rights</h2>
              <ul className="list-disc pl-6">
                <li>Access, update, or delete your personal information</li>
                <li>Opt out of marketing communications</li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-2">6. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. Please review it periodically.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-2">7. Contact Us</h2>
              <p>
                For privacy questions, please <a href="/contact" className="text-orange-600 hover:underline">contact us</a>.
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Privacy;
