import React, { useState } from "react";
import axios from "axios";
import banner from "../assets/banner2.png";
import Footer from "./Footer";
import Navbar from "./Navbar";

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [status, setStatus] = useState({ success: false, error: false });
  const [showModal, setShowModal] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    axios
      .post(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/contact/`, formData)
      .then((response) => {
        console.log("Form submitted successfully:", response.data);
        setStatus({ success: true, error: false });
        setShowModal(true);
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
        });
      })
      .catch((error) => {
        console.error("There was an error submitting the form:", error);
        setStatus({ success: false, error: true });
        setShowModal(true);
      });
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="w-full">
      {/* Banner Section */}
      <Navbar />
      <div className="relative h-64 bg-yellow-600 overflow-hidden ml-20 mr-20 mt-4">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl md:text-2xl text-center max-w-2xl">
            We'd love to hear from you. Get in touch with our team.
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 bg-gray-100 p-8 rounded-lg shadow-md dark:bg-gray-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  id="name"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  id="email"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-gray-700"
              >
                Subject
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                id="subject"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700"
              >
                Message
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                id="message"
                rows={5}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-yellow-600 text-white font-semibold rounded-md shadow-sm focus:ring-2 focus:ring-blue-500"
            >
              Send Message
            </button>
          </form>
        </div>

        <div className="bg-gray-50 p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-6">Company Information</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Email:</p>
              <p className="text-gray-600">support@mulyabazzar.com</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Phone:</p>
              <p className="text-gray-600">+977-9767474645</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Address:</p>
              <p className="text-gray-600">
                Gairidhara, Kathmandu, Nepal
              </p>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            {status.success ? (
              <p className="text-green-500">Message sent successfully!</p>
            ) : (
              <p className="text-red-500">
                There was an error sending your message. Please try again.
              </p>
            )}
            <button
              onClick={closeModal}
              className="mt-4 px-4 py-2 bg-yellow-400 text-white font-semibold rounded-md shadow-sm focus:ring-2 focus:ring-blue-500"
            >
              Close
            </button>
          </div>
        </div>
      )}
      </div>
      <div className="mt-12 rounded-lg overflow-hidden shadow-lg ml-20 mr-20 mb-4">
        <img 
          src={banner}
          alt="Contact Us Banner"
          className="w-full h-80 object-cover"
        />
      </div>
      <Footer />
    </div>
  );
};

export default Contact;