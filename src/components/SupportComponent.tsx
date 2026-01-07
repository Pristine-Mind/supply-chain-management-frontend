import React, { useState } from 'react';
import axios from "axios";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, 
  Mail, 
  MessageSquare, 
  Phone, 
  ChevronDown, 
  Send, 
  HeadphonesIcon,
  HelpCircle
} from 'lucide-react';
import { toast } from 'react-toastify';

import Navbar from './Navbar';
import Footer from './Footer';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between text-left hover:text-primary-600 transition-colors"
      >
        <span className="font-semibold text-slate-800">{question}</span>
        <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-slate-600 text-sm leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SupportComponent = () => {
  const [activeTab, setActiveTab] = useState('contact');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', subject: '', message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/contact/`, formData);
      toast.success("Message sent! We'll get back to you soon.");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd]">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-slate-900 py-16 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-[-10%] left-[-5%] w-64 h-64 bg-primary-500 rounded-full blur-3xl" />
            <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-blue-600 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto text-center relative z-10">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="text-4xl md:text-5xl font-extrabold text-white mb-4"
          >
            How can we help?
          </motion.h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Whether you have a question about features, pricing, or anything else, our team is ready to answer all your questions.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-12 pb-20 relative z-20">
        <div className="max-w-5xl mx-auto">
          
          {/* Custom Animated Tabs */}
          <div className="flex justify-center mb-8">
            <div className="bg-white p-1.5 rounded-2xl shadow-xl flex gap-1 border border-slate-100">
              {['contact', 'faq'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                    activeTab === tab 
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' 
                    : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {tab === 'contact' ? 'Contact Support' : 'View FAQs'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-8">
            
            {/* Main Content Area */}
            <div className="lg:col-span-8">
              <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white rounded-3xl overflow-hidden">
                <CardContent className="p-8 md:p-10">
                  <AnimatePresence mode="wait">
                    {activeTab === 'contact' ? (
                      <motion.div
                        key="contact"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                      >
                        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                          <MessageSquare className="text-primary-600" /> Send a Message
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                              <Label className="text-slate-700 font-semibold">Full Name</Label>
                              <Input 
                                name="name" value={formData.name} onChange={handleChange} required 
                                className="h-12 bg-slate-50 border-none focus:ring-2 focus:ring-primary-500 rounded-xl"
                                placeholder="John Doe"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-700 font-semibold">Email Address</Label>
                              <Input 
                                type="email" name="email" value={formData.email} onChange={handleChange} required 
                                className="h-12 bg-slate-50 border-none focus:ring-2 focus:ring-primary-500 rounded-xl"
                                placeholder="john@example.com"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-700 font-semibold">Subject</Label>
                            <Input 
                              name="subject" value={formData.subject} onChange={handleChange} required 
                              className="h-12 bg-slate-50 border-none focus:ring-2 focus:ring-primary-500 rounded-xl"
                              placeholder="How can we help you?"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-700 font-semibold">Message</Label>
                            <Textarea 
                              name="message" value={formData.message} onChange={handleChange} required 
                              className="min-h-[150px] bg-slate-50 border-none focus:ring-2 focus:ring-primary-500 rounded-xl"
                              placeholder="Tell us more about your inquiry..."
                            />
                          </div>
                          <Button 
                            type="submit" disabled={isSubmitting}
                            className="w-full md:w-auto px-10 h-12 bg-primary-600 hover:bg-primary-700 rounded-xl shadow-lg shadow-primary-100 transition-all active:scale-[0.98]"
                          >
                            {isSubmitting ? "Sending..." : "Send Message"}
                            <Send className="ml-2 w-4 h-4" />
                          </Button>
                        </form>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="faq"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                      >
                        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                          <HelpCircle className="text-primary-600" /> General Questions
                        </h2>
                        <div className="space-y-1">
                          <FAQItem 
                            question="How do I reset my password?" 
                            answer="To reset your password, go to the login page and click on the 'Forgot Password' link. Follow the instructions sent to your email to regain access to your account." 
                          />
                          <FAQItem 
                            question="What should I do if my delivery is delayed?" 
                            answer="Delivery delays can happen due to high volume or traffic. If your delivery is more than 30 minutes late, please use the contact form here with your Delivery ID for priority support." 
                          />
                          <FAQItem 
                            question="How can I update my vehicle information?" 
                            answer="Navigate to Settings > Profile > Vehicle Info. You can upload new documents and update license plate numbers directly from that dashboard." 
                          />
                           <FAQItem 
                            question="Is my payment information secure?" 
                            answer="Yes, we use industry-standard SSL encryption and never store your full credit card details on our servers." 
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Info */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 group">
                <div className="bg-primary-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Phone className="text-primary-600 w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Call us directly</h4>
                <p className="text-slate-500 text-sm mb-4">Available Sun-Fri, 9am - 6pm</p>
                <a href="tel:+9779767474645" className="text-primary-600 font-bold hover:underline">+977-9767474645</a>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 group">
                <div className="bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Mail className="text-blue-600 w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Email support</h4>
                <p className="text-slate-500 text-sm mb-4">We usually reply within 24 hours</p>
                <a href="mailto:mulyabazzar@gmail.com" className="text-blue-600 font-bold hover:underline">mulyabazzar@gmail.com</a>
              </div>
            </div>

          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SupportComponent;
