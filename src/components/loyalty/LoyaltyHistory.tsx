import React, { useState, useEffect } from 'react';
import { useLoyalty } from '../../context/LoyaltyContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowUp, Trash2, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { loyaltyApi, LoyaltyTransaction } from '../../api/loyaltyApi';
import { format, parseISO } from 'date-fns';
import Navbar from '../Navbar';
import Footer from '../Footer';
import LoginModal from '../auth/LoginModal';

const LoyaltyHistory: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { refreshLoyalty } = useLoyalty();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'earned' | 'spent' | 'expired' | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
    } else {
      fetchTransactions(1);
    }
  }, [isAuthenticated, filterType]);

  const fetchTransactions = async (page: number) => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);
    try {
      const result = await loyaltyApi.getUserTransactions(page, pageSize, filterType);
      setTransactions(result.results);
      setTotalCount(result.count);
      setCurrentPage(page);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load transactions';
      setError(errorMessage);
      console.error('Transaction error:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earned':
        return <ArrowUp className="w-5 h-5 text-green-600" />;
      case 'spent':
        return <ArrowDown className="w-5 h-5 text-red-600" />;
      case 'expired':
        return <Trash2 className="w-5 h-5 text-gray-500" />;
      default:
        return null;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'earned':
        return 'bg-green-50 border-green-200';
      case 'spent':
        return 'bg-red-50 border-red-200';
      case 'expired':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getPointsColor = (type: string) => {
    switch (type) {
      case 'earned':
        return 'text-green-600';
      case 'spent':
        return 'text-red-600';
      case 'expired':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4 pt-20">
          <LoginModal
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            title="Sign In to View Loyalty History"
            description="Track your earned and spent loyalty points"
          />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Please sign in to view your loyalty history</h1>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Transaction History</h1>
            <p className="text-gray-600">Track all your loyalty points activities</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Filter Tabs */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-900">Filter by Type:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterType(undefined)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterType === undefined
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Transactions
              </button>
              <button
                onClick={() => setFilterType('earned')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterType === 'earned'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Earned
              </button>
              <button
                onClick={() => setFilterType('spent')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterType === 'spent'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Spent
              </button>
              <button
                onClick={() => setFilterType('expired')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterType === 'expired'
                    ? 'bg-gray-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Expired
              </button>
            </div>
          </div>

          {/* Transactions List */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-600 mb-2">No transactions found</p>
              <p className="text-sm text-gray-500">Start earning points by making purchases or writing reviews</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className={`border border-gray-200 rounded-lg p-4 ${getTransactionColor(transaction.transaction_type)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getTransactionIcon(transaction.transaction_type)}
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-semibold text-gray-900">{transaction.description}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {format(parseISO(transaction.created_at), 'MMM dd, yyyy · hh:mm a')}
                        </p>
                        {transaction.expires_at && (
                          <p className="text-xs text-orange-600 mt-1">
                            Expires: {format(parseISO(transaction.expires_at), 'MMM dd, yyyy')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className={`text-right ${getPointsColor(transaction.transaction_type)}`}>
                      <p className="text-2xl font-bold">
                        {transaction.transaction_type === 'spent' ||
                        transaction.transaction_type === 'expired'
                          ? '-'
                          : '+'}
                        {transaction.points}
                      </p>
                      <p className="text-xs font-medium capitalize mt-1">
                        {transaction.transaction_type}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center space-x-2">
              <button
                onClick={() => fetchTransactions(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => fetchTransactions(page)}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      page === currentPage
                        ? 'bg-amber-500 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => fetchTransactions(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default LoyaltyHistory;
