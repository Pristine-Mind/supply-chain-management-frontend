import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const AboutUs = () => {
  return (
    <>
    <Navbar />
    <div className="bg-neutral-50 py-16">
      <div className="container mx-auto px-4">
        <h1 className="text-h1 font-bold text-center mb-12 text-primary-600">About Mulya Bazzar</h1>
        <div className="max-w-4xl mx-auto text-neutral-700 bg-white p-8 rounded-lg shadow-elevation-lg border border-neutral-200">
          <p className="mb-6 text-body leading-relaxed">
            Mulya Bazzar is a comprehensive marketplace platform aimed at connecting buyers and sellers from all kinds of businesses. Whether you are looking to buy or sell agricultural products, manufactured goods, or services, Mulya Bazzar offers an easy-to-use interface that brings everyone together.
          </p>
          <p className="mb-6 text-body leading-relaxed">
            Our mission is to empower local businesses and individuals in Nepal by providing a centralized hub where transactions are transparent, simple, and accessible to everyone. Mulya Bazzar is designed to help small and large businesses alike reach their audiences and grow sustainably.
          </p>
          <p className="mb-6 text-body leading-relaxed">
            We strive to foster a community-driven marketplace, promoting fair trade practices and helping users explore a wide range of products and services. With Mulya Bazzar, customers can bid, negotiate, and make informed purchasing decisions easily, while sellers can list their items in the marketplace and find genuine buyers.
          </p>
          <h2 className="text-h2 font-semibold mt-8 mb-4 text-primary-500">Our Vision</h2>
          <p className="mb-6 text-body leading-relaxed">
            At Mulya Bazzar, we envision a thriving marketplace that supports economic growth and financial inclusion throughout Nepal. Our goal is to create opportunities for everyone, from farmers to artisans, enabling them to gain fair value for their products and access new markets.
          </p>
          <h2 className="text-h2 font-semibold mt-8 mb-4 text-primary-500">Why Choose Mulya Bazzar?</h2>
          <ul className="list-disc list-inside mb-6 text-body leading-relaxed space-y-2">
            <li>Inclusive Marketplace: Connects all types of businesses from across the nation.</li>
            <li>Secure Transactions: Ensures a safe and trustworthy trading environment.</li>
            <li>Transparency: Facilitates transparent bidding and purchasing processes.</li>
            <li>Community Support: Builds a supportive community of sellers and buyers.</li>
          </ul>
          <p className="mb-6 text-body leading-relaxed">
            Join us at Mulya Bazzar and be a part of this transformative journey where we bring value to every transaction. Let's grow together and contribute to a sustainable economy in Nepal.
          </p>
        </div>
      </div>
    </div>
    <Footer />
    </>
    );
};

export default AboutUs;
