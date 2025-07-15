import React, { useState, useEffect } from 'react';
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
  image: string;
  date: string;
  author: string;
}

const fetchPosts = async (): Promise<Post[]> => [
  { id: 1, title: 'How to Sell Fresh Produce on MulyaBazzar', excerpt: 'Learn best listing practices for fruits and vegetables.', image: logo, date: 'Jul 10, 2025', author: 'Admin' },
  { id: 2, title: 'Understanding Marketplace Fees', excerpt: 'Breakdown of fees and profit tips.', image: logo, date: 'Jul 08, 2025', author: 'Finance Team' },
  { id: 3, title: 'Tips for Packaging Deliveries', excerpt: 'Keep produce fresh with these strategies.', image: logo, date: 'Jul 05, 2025', author: 'Logistics' },
];

export const BlogPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts().then(data => {
      setPosts(data);
      setLoading(false);
    });
  }, []);

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
        ) : (
          <section className="lg:col-span-2 space-y-12">
            {posts.map(post => (
              <article key={post.id} className="flex flex-col md:flex-row bg-white shadow-lg rounded-lg overflow-hidden">
                <img src={post.image} alt={post.title} className="h-48 md:h-auto md:w-48 object-cover" />
                <div className="p-6 flex flex-col justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">{post.date} &bull; by {post.author}</p>
                    <h2 className="text-2xl font-semibold mb-2 hover:text-orange-600">
                      <Link to={`/blog/${post.id}`}>{post.title}</Link>
                    </h2>
                    <p className="text-gray-700 mb-4">{post.excerpt}</p>
                  </div>
                  <button className="text-orange-600 font-medium hover:underline">
                      Read More →
                    </button>
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
              />
            </div>
          </div>

          <Separator.Root decorative orientation="horizontal" className="w-full h-px bg-gray-200" />

          <div>
            <h3 className="text-xl font-semibold mb-4">Categories</h3>
            <Tabs.Root defaultValue="farming" className="flex flex-col space-y-2">
              <Tabs.List className="space-y-1">
                {[
                  ['farming', 'Farming Tips'],
                  ['packaging', 'Packaging'],
                  ['finance', 'Finance'],
                  ['trends', 'Market Trends'],
                ].map(([value, label]) => (
                  <Tabs.Trigger
                    key={value}
                    value={value}
                    className="px-3 py-1 text-gray-700 rounded-md hover:bg-gray-100 focus:shadow-outline"
                  >
                    {label}
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
