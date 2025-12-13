import React, { useState } from 'react';
import { creatorsApi } from '../api/creatorsApi';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

interface Props {
  creatorId: number;
  initialFollowing?: boolean;
  onToggle?: (following: boolean, follower_count?: number) => void;
  className?: string;
}

const FollowButton: React.FC<Props> = ({ creatorId, initialFollowing = false, onToggle, className }) => {
  const [following, setFollowing] = useState<boolean>(initialFollowing);
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleClick = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setLoading(true);
    const prev = following;
    setFollowing(!prev); // optimistic
    try {
      const res = await creatorsApi.toggleFollow(creatorId);
      setFollowing(res.following);
      onToggle?.(res.following, res.follower_count);
    } catch (err) {
      setFollowing(prev);
      toast.error('Failed to update follow status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`${className || ''} ${following ? 'bg-white text-gray-800 border' : 'btn-primary'} px-3 py-1 rounded-full follow-pill disabled:opacity-60`}
    >
      {loading ? '...' : following ? (hovered ? 'Unfollow' : 'Following') : 'Follow'}
    </button>
  );
};

export default FollowButton;
