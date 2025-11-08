import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import banner from '../assets/banner2.png';
import logo from '../assets/logo.png';

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

const fetchPostById = async (id: string | number): Promise<Post | null> => {
  const api = import.meta.env.VITE_REACT_APP_API_URL;
  if (api) {
    try {
      const res = await fetch(`${api}/blog/posts/${id}/`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const p = await res.json();
      return {
        id: Number(p.id ?? id),
        title: String(p.title ?? 'Untitled'),
        excerpt: String(p.excerpt ?? p.summary ?? ''),
        content: typeof p.content === 'string' ? p.content : String(p.content ?? ''),
        image: p.image || p.thumbnail || logo,
        date: String(p.date ?? p.published_at ?? ''),
        author: String(p.author ?? 'Admin'),
        category: String((p.category ?? (Array.isArray(p.categories) ? p.categories[0] : '')) || ''),
      } as Post;
    } catch (e) {
      // fall through to fallback
    }
  }
  return null;
};

const fetchRecent = async (): Promise<Post[]> => {
  const api = import.meta.env.VITE_REACT_APP_API_URL;
  if (api) {
    try {
      const res = await fetch(`${api}/blog/posts/`);
      if (res.ok) {
        const arr = await res.json();
        if (Array.isArray(arr)) {
          return arr.slice(0, 5).map((p: any, i: number) => ({
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
      }
    } catch {}
  }
  // fallback
  return [
    { id: 1, title: 'How to Sell Fresh Produce on MulyaBazzar', excerpt: 'Learn best listing practices for fruits and vegetables.', content: 'Full guide on listing best practices...', image: logo, date: 'Jul 10, 2025', author: 'Admin', category: 'Farming Tips' },
    { id: 2, title: 'Understanding Marketplace Fees', excerpt: 'Breakdown of fees and profit tips.', content: 'We walk through fee structures...', image: logo, date: 'Jul 08, 2025', author: 'Finance Team', category: 'Finance' },
  ];
};

const isLikelyHtml = (s?: string): boolean => {
  if (!s) return false;
  return /<([a-z][\w0-9]*)\b[^>]*>(.*?)<\/\1>/i.test(s) || /<(p|h1|h2|h3|ul|ol|li|strong|em|br)\b/i.test(s);
};

const BlogDetail: React.FC = () => {
  const { id } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [recent, setRecent] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [p, r] = await Promise.all([
          id ? fetchPostById(id) : Promise.resolve(null),
          fetchRecent(),
        ]);
        setPost(p);
        setRecent(r);
        if (!p) setError('Post not found');
      } catch (e: any) {
        setError(e?.message || 'Failed to load post');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const content = useMemo(() => {
    const c = post?.content || post?.excerpt || '';
    return String(c);
  }, [post]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="relative h-56 bg-cover bg-center mt-6" style={{ backgroundImage: `url(${banner})` }}>
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <h1 className="text-white text-3xl md:text-4xl font-bold">Blog</h1>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="p-8 bg-white rounded-xl shadow-sm mb-8 w-full max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-primary-700 mb-6">Blog Detail</h1>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mr-4"></div>
              <span className="text-base text-gray-500">Loading blog...</span>
            </div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : post ? (
            <>
              <img src={post.image} alt={post.title} className="w-full h-64 object-cover rounded" />
              <div className="mt-4 text-sm text-gray-500">{post.date} • by {post.author}{post.category ? ` • ${post.category}` : ''}</div>
              <h2 className="mt-2 text-3xl font-bold">{post.title}</h2>
              <div className="prose max-w-none lg:prose-lg mt-4">
                {isLikelyHtml(content) ? (
                  <div dangerouslySetInnerHTML={{ __html: content }} />
                ) : (
                  <p>{content}</p>
                )}
              </div>
              <div className="mt-6">
                <Link to="/blog" className="text-orange-600 hover:underline">← Back to Blog</Link>
              </div>
            </>
          ) : null}
        </div>

        <aside className="space-y-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-3">Recent Posts</h3>
            <ul className="space-y-3">
              {recent.map(r => (
                <li key={r.id} className="flex gap-3 items-center">
                  <img src={r.image} alt={r.title} className="w-14 h-14 object-cover rounded" />
                  <div>
                    <Link to={`/blog/${r.id}`} className="font-medium hover:text-orange-600">{r.title}</Link>
                    <div className="text-xs text-gray-500">{r.date}</div>
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

export default BlogDetail;
