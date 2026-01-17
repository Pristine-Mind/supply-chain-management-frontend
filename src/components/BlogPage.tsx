import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Calendar, User, ArrowRight, Tag, 
  BookOpen, Hash, Newspaper 
} from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';
import banner from '../assets/banner2.png';

interface Post {
  id: number;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  author: string;
  category?: string;
}

export const BlogPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    const loadPosts = async () => {
      const api = import.meta.env.VITE_REACT_APP_API_URL;
      try {
        const res = await fetch(`${api}/blog/posts/`);
        const data = await res.json();
        setPosts(data);
      } catch (e) {
        setPosts([
          { id: 1, title: 'How to Sell Fresh Produce on MulyaBazzar', excerpt: 'Learn best listing practices for fruits and vegetables to maximize your revenue...', image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=1740', date: 'Jul 10, 2025', author: 'Admin', category: 'Farming' },
          { id: 2, title: 'Understanding Marketplace Fees', excerpt: 'A transparent breakdown of how we help you keep more profit in your pocket...', image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1711', date: 'Jul 08, 2025', author: 'Finance', category: 'Finance' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    loadPosts();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach(p => { if (p.category) set.add(p.category); });
    return ['All', ...Array.from(set)];
  }, [posts]);

  const filtered = useMemo(() => {
    return posts.filter(p => {
      const categoryPass = selectedCategory === 'All' || p.category === selectedCategory;
      const searchPass = p.title.toLowerCase().includes(search.toLowerCase());
      return categoryPass && searchPass;
    });
  }, [posts, search, selectedCategory]);

  return (
    <div className="bg-[#fcfcfd] min-h-screen">
      <Navbar />

      <div className="relative h-[45vh] flex items-center justify-center overflow-hidden">
        <motion.img 
          initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ duration: 10 }}
          src={banner} className="absolute inset-0 w-full h-full object-cover" alt="Banner" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#fcfcfd] via-black/40 to-black/60" />
        <div className="relative text-center px-4 space-y-4">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="text-5xl md:text-7xl font-black text-white tracking-tighter"
          >
            Mulya Journal
          </motion.h1>
          <p className="text-white/90 text-lg md:text-xl font-medium max-w-2xl mx-auto">
            Insights from the heart of Nepal's agriculture.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-16 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8">
          <div className="flex items-center gap-4 mb-10">
            <Newspaper className="text-orange-500" />
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest">Latest Updates</h2>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <div className="space-y-16">
            <AnimatePresence mode="popLayout">
              {filtered.map((post) => (
                <motion.article 
                  layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  key={post.id} className="group grid md:grid-cols-12 gap-8 items-start"
                >
                  <div className="md:col-span-5 relative overflow-hidden rounded-[2rem]">
                    <img 
                      src={post.image} 
                      className="w-full h-72 object-cover transition-transform duration-700 group-hover:scale-105" 
                      alt={post.title} 
                    />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-4 py-1 rounded-full text-xs font-black text-orange-600 uppercase">
                      {post.category}
                    </div>
                  </div>
                  <div className="md:col-span-7 space-y-4 pt-2">
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><Calendar size={14}/> {post.date}</span>
                      <span className="flex items-center gap-1.5"><User size={14}/> {post.author}</span>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 group-hover:text-orange-500 transition-colors leading-tight">
                      <Link to={`/blog/${post.id}`}>{post.title}</Link>
                    </h2>
                    <p className="text-slate-600 text-lg leading-relaxed line-clamp-2">{post.excerpt}</p>
                    <Link to={`/blog/${post.id}`} className="inline-flex items-center gap-2 font-black text-orange-500 hover:gap-4 transition-all">
                      Read Article <ArrowRight size={20} />
                    </Link>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <aside className="lg:col-span-4">
          <div className="sticky top-24 space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
              <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text" placeholder="Search insights..."
                  className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-orange-500 transition-all"
                  value={search} onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                <Hash size={20} className="text-orange-500" /> Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat} onClick={() => setSelectedCategory(cat)}
                    className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                      selectedCategory === cat 
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden">
              <BookOpen className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10 rotate-12" />
              <h4 className="text-xl font-black mb-2">Weekly Harvest</h4>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">Join 2,000+ farmers and entrepreneurs getting weekly market updates.</p>
              <button className="w-full h-12 bg-orange-500 rounded-xl font-bold hover:bg-orange-600 transition-all active:scale-95">
                Subscribe Now
              </button>
            </div>
          </div>
        </aside>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPage;
