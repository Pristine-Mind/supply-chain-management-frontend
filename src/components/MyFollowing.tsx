import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { creatorsApi } from '../api/creatorsApi';
import { CreatorProfile } from '../types/creator';

const MyFollowing: React.FC = () => {
  const [following, setFollowing] = useState<CreatorProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const data = await creatorsApi.getMyFollowing();
      setFollowing(data);
    } catch (err) {
      console.error('Failed to load following', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  
  if (following.length === 0) {
    return <div className="p-6 text-center text-gray-500">You're not following any creators yet.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-8 text-gray-900">Creators You Follow</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {following.map((c) => (
          <div
            key={c.id}
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/creators/${c.id}`)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') navigate(`/creators/${c.id}`);
            }}
            aria-label={`Open ${c.display_name || c.handle} profile`}
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
          >
            {/* Avatar and Name Section */}
            <div className="flex flex-col items-center text-center mb-4">
              <img
                src={c.profile_image || '/placeholder-avatar.png'}
                alt={c.handle}
                className="w-20 h-20 rounded-full object-cover mb-3 ring-2 ring-gray-100"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect width="80" height="80" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="30" fill="%239ca3af"%3E?%3C/text%3E%3C/svg%3E';
                }}
              />
              <h3 className="font-semibold text-gray-900 text-lg mb-1 w-full overflow-hidden text-ellipsis">
                {c.display_name || c.handle}
              </h3>
              <p className="text-sm text-gray-500 w-full overflow-hidden text-ellipsis">
                @{c.handle}
              </p>
            </div>
            
            {/* Bio Section */}
            {c.bio && (
              <p className="text-sm text-gray-600 text-center mb-4 line-clamp-3 leading-relaxed">
                {c.bio}
              </p>
            )}
            
            {/* Stats Section */}
            <div className="flex justify-center gap-6 text-sm pt-4 border-t border-gray-100">
              <div className="text-center">
                <div className="font-semibold text-gray-900">{c.follower_count ?? 0}</div>
                <div className="text-gray-500">followers</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900">{c.views_count ?? 0}</div>
                <div className="text-gray-500">views</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyFollowing;
