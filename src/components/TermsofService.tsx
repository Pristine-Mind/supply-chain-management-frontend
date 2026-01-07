import React, { useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { ShieldCheck, Scale, AlertCircle, RefreshCw, Mail, ScrollText, CheckCircle2 } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';

const sections = [
  { id: 'acceptance', title: 'Acceptance', icon: CheckCircle2 },
  { id: 'accounts', title: 'User Accounts', icon: ShieldCheck },
  { id: 'prohibited', title: 'Prohibited Actions', icon: AlertCircle },
  { id: 'transactions', title: 'Transactions', icon: Scale },
  { id: 'liability', title: 'Liability', icon: ScrollText },
  { id: 'changes', title: 'Updates', icon: RefreshCw },
  { id: 'contact', title: 'Contact', icon: Mail },
];

const TermsOfService: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen font-sans selection:bg-orange-100 selection:text-orange-900">
      <Navbar />

      <motion.div
        className="fixed top-0 left-0 right-0 h-1.5 bg-orange-500 z-[100] origin-left"
        style={{ scaleX }}
      />

      <div className="relative py-20 overflow-hidden bg-white border-b border-slate-200">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full">
           <div className="absolute top-10 left-10 w-64 h-64 bg-orange-100/50 rounded-full blur-3xl" />
           <div className="absolute bottom-10 right-10 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 text-orange-600 text-xs font-black uppercase tracking-widest mb-6"
          >
            <ShieldCheck size={14} /> Legal Documentation
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter mb-6"
          >
            Terms of <span className="text-orange-500">Service.</span>
          </motion.h1>
          <p className="text-slate-500 text-lg font-medium">
            Last Updated: July 20, 2025. Please read these terms carefully before using MulyaBazzar.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex flex-col lg:flex-row gap-16">
          
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-28 space-y-2 p-2 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-500 hover:text-orange-500 hover:bg-orange-50 transition-all text-left"
                >
                  <section.icon size={18} />
                  {section.title}
                </button>
              ))}
            </div>
          </aside>

          <main className="flex-1 max-w-3xl">
            <div className="space-y-20">
              
              <section id="acceptance" className="scroll-mt-28">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-200">
                    <CheckCircle2 size={24} />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">1. Acceptance of Terms</h2>
                </div>
                <p className="text-slate-600 text-lg leading-relaxed">
                  By accessing or using <span className="font-bold text-slate-900">MulyaBazzar</span>, you agree to comply with and be bound by these Terms of Service. Our platform connects sellers, buyers, and transporters in a unified agricultural ecosystem. If you do not agree to these terms, please refrain from using our services.
                </p>
              </section>

              <section id="accounts" className="scroll-mt-28">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <ShieldCheck size={24} />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">2. User Accounts</h2>
                </div>
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                  <p className="text-slate-600 text-lg leading-relaxed">
                    Account security is a shared responsibility. You are responsible for:
                  </p>
                  <ul className="grid gap-3">
                    {['Maintaining credential confidentiality', 'All activities under your ID', 'Notifying us of unauthorized access'].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              <section id="prohibited" className="scroll-mt-28">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-200">
                    <AlertCircle size={24} />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">3. Prohibited Activities</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { t: 'Legal Violations', d: 'Violating local or international trade laws.' },
                    { t: 'IP Infringement', d: 'Stealing content or brand assets.' },
                    { t: 'Malicious Content', d: 'Distributing viruses or harmful code.' },
                    { t: 'Fraud', d: 'Engaging in misleading or fake transactions.' },
                  ].map((item, i) => (
                    <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-red-200 transition-colors">
                      <h4 className="font-black text-slate-900 mb-1 uppercase text-xs tracking-widest">{item.t}</h4>
                      <p className="text-slate-500 text-sm">{item.d}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section id="transactions" className="scroll-mt-28">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                    <Scale size={24} />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">4. Product Listings</h2>
                </div>
                <p className="text-slate-600 text-lg leading-relaxed">
                  Sellers must provide <span className="text-emerald-600 font-bold underline decoration-2 underline-offset-4">accurate and up-to-date</span> product information. While MulyaBazzar facilitates the connection, we are not a party to the direct contract between buyer and seller and are not liable for quality disputes.
                </p>
              </section>

              <section id="contact" className="scroll-mt-28">
                <div className="bg-slate-900 rounded-[3rem] p-10 md:p-16 text-center text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl" />
                  <h2 className="text-4xl font-black mb-6">Have Questions?</h2>
                  <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
                    Our legal team is here to help you understand how MulyaBazzar protects your interests.
                  </p>
                  <a 
                    href="/contact" 
                    className="inline-flex items-center gap-3 px-10 py-5 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl transition-all shadow-xl shadow-orange-500/20"
                  >
                    <Mail size={20} /> Contact Support
                  </a>
                </div>
              </section>

            </div>
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TermsOfService;
