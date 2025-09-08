import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as Separator from '@radix-ui/react-separator';
import * as Tabs from '@radix-ui/react-tabs';
import logo from '../assets/logo.png';
import banner from '../assets/banner2.png';
import Navbar from './Navbar';
import Footer from './Footer';

interface Post {
  id: number;
  title: string;
  excerpt: string;
  content?: string;
  image: string;
  date: string;
  author: string;
  category?: string;
}

const fetchPosts = async (): Promise<Post[]> => {
  const api = import.meta.env.VITE_REACT_APP_API_URL;
  if (api) {
    try {
      const res = await fetch(`${api}/blog/posts/`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        return data.map((p: any, i: number) => ({
          id: Number(p.id ?? i + 1),
          title: String(p.title ?? 'Untitled'),
          excerpt: String(p.excerpt ?? p.summary ?? ''),
          content: typeof p.content === 'string' ? p.content : String(p.content ?? ''),
          image: p.image || p.thumbnail || logo,
          date: String(p.date ?? p.published_at ?? ''),
          author: String(p.author ?? 'Admin'),
          category: String((p.category ?? (Array.isArray(p.categories) ? p.categories[0] : '')) || ''),
        })) as Post[];
      }
    } catch (e) {
    }
  }
  return [
    { id: 1, title: 'How to Sell Fresh Produce on MulyaBazzar', excerpt: 'Learn best listing practices for fruits and vegetables.', content: 'Full guide on listing best practices...', image: logo, date: 'Jul 10, 2025', author: 'Admin', category: 'Farming Tips' },
    { id: 2, title: 'Understanding Marketplace Fees', excerpt: 'Breakdown of fees and profit tips.', content: 'We walk through fee structures...', image: logo, date: 'Jul 08, 2025', author: 'Finance Team', category: 'Finance' },
    { id: 3, title: 'Tips for Packaging Deliveries', excerpt: 'Keep produce fresh with these strategies.', content: 'Packaging tactics for freshness...', image: logo, date: 'Jul 05, 2025', author: 'Logistics', category: 'Packaging' },
  ];
};

export const BlogPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchPosts();
        setPosts(data);
      } catch (e: any) {
        setError(e?.message || 'Failed to load blog posts');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach(p => { if (p.category) set.add(p.category); });
    return ['All', ...Array.from(set)];
  }, [posts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter(p => {
      const categoryPass = selectedCategory === 'All' || (p.category || '') === selectedCategory;
      if (!q) return categoryPass;
      const hay = `${p.title} ${p.excerpt} ${p.content ?? ''}`.toLowerCase();
      return categoryPass && hay.includes(q);
    });
  }, [posts, search, selectedCategory]);

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="relative h-72 bg-cover bg-center mt-6" style={{ backgroundImage: `url(${banner})` }}>
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <h1 className="text-white text-4xl md:text-5xl font-bold">Insights & Updates</h1>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {loading ? (
          <div className="lg:col-span-2 flex justify-center items-center">
            <span>Loading...</span>
          </div>
        ) : error ? (
          <div className="lg:col-span-2 text-red-600">{error}</div>
        ) : (
          <section className="lg:col-span-2 space-y-12">
            {filtered.map(post => (
              <article key={post.id} className="flex flex-col md:flex-row bg-white shadow-lg rounded-lg overflow-hidden">
                <img src={post.image} alt={post.title} className="h-48 md:h-auto md:w-48 object-cover" />
                <div className="p-6 flex flex-col justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">{post.date} &bull; by {post.author}</p>
                    <h2 className="text-2xl font-semibold mb-2 hover:text-orange-600">
                      <Link to={`/blog/${post.id}`}>{post.title}</Link>
                    </h2>
                    <p className="text-gray-700 mb-4">
                      {expanded.has(post.id) ? (post.content || post.excerpt) : post.excerpt}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      className="text-orange-600 font-medium hover:underline"
                      onClick={() => toggleExpand(post.id)}
                    >
                      {expanded.has(post.id) ? 'Read Less ←' : 'Read More →'}
                    </button>
                    <Link to={`/blog/${post.id}`} className="text-gray-600 hover:text-gray-900">
                      Open Post
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}

        <aside className="space-y-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">Search Posts</h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <Separator.Root decorative orientation="horizontal" className="w-full h-px bg-gray-200" />

          <div>
            <h3 className="text-xl font-semibold mb-4">Categories</h3>
            <Tabs.Root value={selectedCategory} onValueChange={setSelectedCategory} className="flex flex-col space-y-2">
              <Tabs.List className="grid grid-cols-2 gap-2 sm:flex sm:flex-col sm:space-y-1">
                {categories.map((cat) => (
                  <Tabs.Trigger
                    key={cat}
                    value={cat}
                    className={`px-3 py-1 rounded-md text-sm ${selectedCategory === cat ? 'bg-orange-100 text-orange-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    {cat}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
            </Tabs.Root>
          </div>

          <Separator.Root decorative orientation="horizontal" className="w-full h-px bg-gray-200" />

          <div>
            <h3 className="text-xl font-semibold mb-4">Recent Posts</h3>
            <ul className="space-y-4">
              {posts.slice(0, 3).map(post => (
                <li key={post.id} className="flex items-center space-x-4">
                  <img src={post.image} alt={post.title} className="w-16 h-16 object-cover rounded-md" />
                  <div>
                    <Link to={`/blog/${post.id}`} className="hover:text-orange-600 font-medium">
                      {post.title}
                    </Link>
                    <p className="text-sm text-gray-500">{post.date}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPage;
