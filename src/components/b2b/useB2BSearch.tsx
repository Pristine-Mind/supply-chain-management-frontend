import { useState, useEffect, useCallback } from 'react';
import { listB2BUsers, getRecommendedBusinesses, getRecommendedBusinessesFromProducts, B2BUser, BusinessFilters, BusinessListResponse } from '../../api/b2bApi';
import { getSellerConversation, sendSellerMessage } from '../../api/chatApi';

export const useB2BSearch = (open: boolean) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<B2BUser[]>([]);
  const [recommendedIds, setRecommendedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [filtersApplied, setFiltersApplied] = useState<BusinessFilters>({});
  
  // Advanced Filters State
  const [filters, setFilters] = useState<BusinessFilters>({});
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  
  // Chat States
  const [activeChatUser, setActiveChatUser] = useState<B2BUser | null>(null);
  const [conversation, setConversation] = useState<any[]>([]);
  const [convLoading, setConvLoading] = useState(false);

  const currentUserId = parseInt(localStorage.getItem('user_id') || '0');

  const fetchUsers = useCallback(async (
    searchQuery = query,
    currentPage = page,
    currentFilters = filters
  ) => {
    setLoading(true);
    try {
      // Merge search query into filters
      const mergedFilters: BusinessFilters = {
        ...currentFilters,
        search: searchQuery || currentFilters.search
      };

      const data: BusinessListResponse = await listB2BUsers(
        searchQuery || undefined,
        currentPage,
        12,
        mergedFilters
      );
      
      setUsers(data.results || []);
      setCount(data.count || 0);
      setFiltersApplied(data.filters_applied || {});
      setHasNextPage(!!data.next);
      setHasPrevPage(!!data.previous);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [query, page, filters]);

  // Fetch users when component opens or dependencies change
  useEffect(() => {
    if (open) {
      fetchUsers();
      
      // Load recommended businesses from verified users products API
      getRecommendedBusinessesFromProducts(1, 12)
        .then(response => {
          const recommendedUsers = response.results;
          // Set both the recommended users and their IDs for filtering
          setRecommendedIds(recommendedUsers.map(u => u.id));
          
          // If we have recommended users, merge them with current results
          // but prioritize showing them in the recommended section
          setUsers(prevUsers => {
            const nonRecommendedUsers = prevUsers.filter(u => 
              !recommendedUsers.some(rec => rec.id === u.id)
            );
            return [...recommendedUsers, ...nonRecommendedUsers];
          });
          
          // Update count to include recommended users
          setCount(prev => prev + recommendedUsers.filter(rec => 
            !users.some(u => u.id === rec.id)
          ).length);
        })
        .catch(error => {
          console.error('Error loading recommended businesses from products API:', error);
          // Fallback to original recommended businesses API
          getRecommendedBusinesses()
            .then(recommendedUsers => {
              setRecommendedIds(recommendedUsers.map(u => u.id));
              setUsers(prevUsers => {
                const nonRecommendedUsers = prevUsers.filter(u => 
                  !recommendedUsers.some(rec => rec.id === u.id)
                );
                return [...recommendedUsers, ...nonRecommendedUsers];
              });
              setCount(prev => prev + recommendedUsers.filter(rec => 
                !users.some(u => u.id === rec.id)
              ).length);
            })
            .catch(() => {
              console.error('Both recommended business APIs failed');
              setRecommendedIds([]);
            });
        });
    }
  }, [open, page, fetchUsers]);

  // Handle search with debouncing
  const handleSearch = useCallback((searchTerm: string) => {
    setQuery(searchTerm);
    setPage(1); // Reset to first page on new search
  }, []);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: BusinessFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  }, []);

  // Apply filters and search
  const applyFilters = useCallback(() => {
    fetchUsers(query, 1, filters);
  }, [query, filters, fetchUsers]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
    setQuery('');
    setPage(1);
    fetchUsers('', 1, {});
  }, [fetchUsers]);

  // Handle pagination
  const goToNextPage = useCallback(() => {
    if (hasNextPage) {
      setPage(prev => prev + 1);
    }
  }, [hasNextPage]);

  const goToPrevPage = useCallback(() => {
    if (hasPrevPage) {
      setPage(prev => prev - 1);
    }
  }, [hasPrevPage]);

  const goToPage = useCallback((pageNum: number) => {
    setPage(pageNum);
  }, []);

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
    state: { 
      query, 
      users, 
      loading, 
      page, 
      count, 
      recommendedIds, 
      activeChatUser, 
      conversation, 
      convLoading, 
      currentUserId,
      filters,
      filtersApplied,
      hasNextPage,
      hasPrevPage
    },
    actions: { 
      setQuery: handleSearch,
      setPage: goToPage,
      goToNextPage,
      goToPrevPage,
      setActiveChatUser, 
      fetchUsers, 
      handleSendMessage, 
      setConversation, 
      setConvLoading,
      handleFiltersChange,
      applyFilters,
      clearFilters
    }
  };
};
