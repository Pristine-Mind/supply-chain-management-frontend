import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, User, ArrowLeft, MessageCircle, Share2 } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';

export const BlogDetail: React.FC = () => {
  const { id } = useParams();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
        setLoading(true);
        setTimeout(() => {
            setPost({
                title: 'How to Sell Fresh Produce on MulyaBazzar',
                content: `<h3>Mastering the Marketplace</h3><p>Selling fresh produce requires more than just high-quality goods; it requires presentation. In this guide, we explore how to photograph your harvest to attract high-paying B2B buyers.</p><blockquote>"Quality is not an act, it is a habit."</blockquote><p>Our logistics network ensures that from the moment a buyer clicks 'purchase', your produce is handled with the cooling technology it deserves.</p>`,
                image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=1740',
                date: 'Jul 10, 2025',
                author: 'Admin',
                category: 'Farming Tips'
            });
            setLoading(false);
        }, 800);
    };
    fetchPost();
  }, [id]);

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse text-orange-500 uppercase tracking-widest">Loading Post...</div>;

  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      
      <article className="pt-12 pb-24">
        <header className="max-w-4xl mx-auto px-4 text-center mb-12">
          <Link to="/blog" className="inline-flex items-center gap-2 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-orange-500 transition-colors mb-8">
            <ArrowLeft size={14} /> Back to Journal
          </Link>
          <div className="text-orange-500 font-black uppercase text-xs tracking-[0.3em] mb-4">{post.category}</div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.1] mb-8 tracking-tighter">
            {post.title}
          </h1>
          <div className="flex items-center justify-center gap-6 text-slate-400 font-bold text-sm uppercase tracking-wider">
            <span className="flex items-center gap-2"><Calendar size={16}/> {post.date}</span>
            <span className="flex items-center gap-2"><User size={16}/> {post.author}</span>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 mb-16">
          <motion.img 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            src={post.image} className="w-full h-[60vh] object-cover rounded-[3rem] shadow-2xl shadow-slate-200" 
          />
        </div>

        <div className="max-w-3xl mx-auto px-4">
          <div 
            className="prose prose-orange prose-lg md:prose-xl max-w-none 
            prose-headings:font-black prose-headings:tracking-tighter prose-headings:text-slate-900
            prose-p:text-slate-600 prose-p:leading-relaxed
            prose-blockquote:border-l-4 prose-blockquote:border-orange-500 prose-blockquote:bg-orange-50 prose-blockquote:py-2 prose-blockquote:rounded-r-xl"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <div className="mt-20 pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-4">
               <span className="text-xs font-black uppercase text-slate-400 tracking-widest">Spread the word</span>
               <button className="p-3 bg-slate-50 rounded-full hover:bg-orange-500 hover:text-white transition-all"><Share2 size={20}/></button>
            </div>
            <button className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white font-black rounded-2xl hover:shadow-xl transition-all active:scale-95">
              <MessageCircle size={20} /> Join the Discussion
            </button>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default BlogDetail;
