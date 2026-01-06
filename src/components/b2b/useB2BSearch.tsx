import { useState, useEffect, useCallback } from 'react';
import { listB2BUsers, getRecommendedBusinesses, B2BUser } from '../../api/b2bApi';
import { getSellerConversation, sendSellerMessage } from '../../api/chatApi';

export const useB2BSearch = (open: boolean) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<B2BUser[]>([]);
  const [recommendedIds, setRecommendedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  
  // Chat States
  const [activeChatUser, setActiveChatUser] = useState<B2BUser | null>(null);
  const [conversation, setConversation] = useState<any[]>([]);
  const [convLoading, setConvLoading] = useState(false);

  const currentUserId = parseInt(localStorage.getItem('user_id') || '0');

  const fetchUsers = useCallback(async (q = query, p = page) => {
    setLoading(true);
    try {
      const data = await listB2BUsers(q || undefined, p, 12);
      setUsers(data.results || []);
      setCount(data.count || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [query, page]);

  useEffect(() => {
    if (open) {
      fetchUsers();
      getRecommendedBusinesses().then(data => {
        setRecommendedIds(data.map((r: any) => Number(r.user_id)));
      }).catch(() => setRecommendedIds([]));
    }
  }, [open, page, fetchUsers]);

  const handleSendMessage = async (msg: string) => {
    if (!activeChatUser || !msg.trim()) return;
    try {
      await sendSellerMessage(activeChatUser.id, msg);
      const data = await getSellerConversation(activeChatUser.id);
      setConversation(data.results || data);
    } catch (e) {
      throw e;
    }
  };

  return {
    state: { query, users, loading, page, count, recommendedIds, activeChatUser, conversation, convLoading, currentUserId },
    actions: { setQuery, setPage, setActiveChatUser, fetchUsers, handleSendMessage, setConversation, setConvLoading }
  };
};
