import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaPaperPlane, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay for contact info
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/contact/`, formData);
      setStatus({ success: true, error: false });
      setShowModal(true);
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      console.error("There was an error submitting the form:", error);
      setStatus({ success: false, error: true });
      setShowModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="w-full bg-soft-gradient">
      <Navbar />
      
      {/* Hero Section with F-pattern layout */}
      <div className="relative section-spacing bg-brand-gradient overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full translate-x-24 translate-y-24"></div>
        
        <div className="relative container-padding">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h1 className="text-h1 font-bold mb-6 text-balance">
              Get In Touch
            </h1>
            <p className="text-body-lg opacity-90 mb-8 text-pretty max-w-2xl mx-auto">
              Have questions or need assistance? Our dedicated support team is here to help you succeed on your journey.
            </p>
            
            {/* Quick contact info */}
            <div className="flex flex-wrap justify-center gap-6 text-body-sm">
              <div className="flex items-center gap-2">
                <FaPhone className="w-4 h-4" />
                <span>+977 9767474645</span>
              </div>
              <div className="flex items-center gap-2">
                <FaEnvelope className="w-4 h-4" />
                <span>mulyabazzar@gmail.com</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto container-padding section-spacing">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Contact Form - Primary focus (F-pattern) */}
          <div className="lg:col-span-2">
            <div className="card-elevated">
              <div className="mb-8">
                <h2 className="text-h2 font-bold text-neutral-900 mb-2">Send us a message</h2>
                <p className="text-body text-neutral-600">
                  Fill out the form below and we'll get back to you within 24 hours.
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="content-spacing">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-body-sm font-semibold text-neutral-700 mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      id="name"
                      placeholder="Enter your full name"
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-body-sm font-semibold text-neutral-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      id="email"
                      placeholder="your.email@example.com"
                      className="input-field"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-body-sm font-semibold text-neutral-700 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    id="subject"
                    placeholder="What is this regarding?"
                    className="input-field"
                    required
                  />
                  <p className="text-caption text-neutral-500 mt-1">
                    Brief description of your inquiry
                  </p>
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-body-sm font-semibold text-neutral-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    id="message"
                    rows={6}
                    placeholder="Tell us more about your inquiry..."
                    className="input-field resize-none"
                    required
                  ></textarea>
                  <p className="text-caption text-neutral-500 mt-1">
                    Minimum 10 characters
                  </p>
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full py-4 relative"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      Sending your message...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="mr-2" />
                      Send Message
                    </>
                  )}
                </button>
                
                <p className="text-caption text-neutral-500 text-center">
                  We typically respond within 24 hours during business days
                </p>
              </form>
            </div>
          </div>

          {/* Contact Information Sidebar */}
          <div className="content-spacing">
            <div className="card-elevated">
              <h2 className="text-h3 font-bold text-neutral-900 mb-6">Contact Information</h2>
              <div className="content-spacing">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FaEnvelope className="text-primary-600 text-lg" />
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900">Email</p>
                    <p className="text-neutral-600">mulyabazzar@gmail.com</p>
                    <p className="text-caption text-neutral-500 mt-1">We typically respond within 24 hours</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-accent-success-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FaPhone className="text-accent-success-600 text-lg" />
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900">Phone</p>
                    <p className="text-neutral-600">+977-9767474645</p>
                    <p className="text-caption text-neutral-500 mt-1">Mon-Fri, 9 AM - 6 PM NPT</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FaMapMarkerAlt className="text-secondary-600 text-lg" />
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900">Address</p>
                    <p className="text-neutral-600">Baluwatar, Kathmandu</p>
                    <p className="text-neutral-600">Nepal</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Help CTA */}
            <div className="card bg-brand-gradient text-white">
              <h3 className="text-h3 font-bold mb-4">Need Quick Help?</h3>
              <p className="text-body mb-6 opacity-90">
                Check out our FAQ section for instant answers to common questions about orders, shipping, and more.
              </p>
              <button className="btn-secondary bg-white text-primary-600 hover:bg-primary-50 border-white hover:border-primary-200">
                View FAQ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Banner Section */}
      <div className="max-w-7xl mx-auto container-padding pb-16">
        <div className="rounded-xl overflow-hidden shadow-medium">
          <img 
            src={banner}
            alt="Contact Us Banner"
            className="w-full h-64 md:h-80 object-cover"
          />
        </div>
      </div>

      {/* Success/Error Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="card-elevated max-w-md w-full transform animate-slide-in">
            <div className="text-center">
              {status.success ? (
                <>
                  <div className="w-16 h-16 bg-accent-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FaCheckCircle className="text-accent-success-600 text-2xl" />
                  </div>
                  <h3 className="text-h3 font-bold text-neutral-900 mb-2">Message Sent!</h3>
                  <p className="text-body text-neutral-600 mb-8">
                    Thank you for contacting us. We'll get back to you within 24 hours.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-accent-error-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FaExclamationTriangle className="text-accent-error-600 text-2xl" />
                  </div>
                  <h3 className="text-h3 font-bold text-neutral-900 mb-2">Oops!</h3>
                  <p className="text-body text-neutral-600 mb-8">
                    There was an error sending your message. Please try again or contact us directly.
                  </p>
                </>
              )}
              <button
                onClick={closeModal}
                className="btn-primary w-full"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default Contact;
