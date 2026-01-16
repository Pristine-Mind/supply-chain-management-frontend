import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLoyalty } from '../context/LoyaltyContext';
import { 
  Menu, X, User, LogOut, ChevronDown, ShoppingBag, BadgeCheck, Gift
} from 'lucide-react';
import logo from '../assets/logo.png';

const NavLink: React.FC<{ to: string; children: React.ReactNode; onClick?: () => void }> = ({ to, children, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`relative px-4 py-2 text-sm font-semibold transition-all duration-300 group
        ${isActive ? 'text-primary-600' : 'text-slate-600 hover:text-primary-600'}`}
    >
      {children}
      <motion.span 
        initial={false}
        animate={{ scaleX: isActive ? 1 : 0 }}
        className="absolute inset-x-4 -bottom-1 h-0.5 bg-primary-600 rounded-full origin-left"
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
    </Link>
  );
};

const UserAvatar: React.FC<{ user: any }> = ({ user }) => {
  const initial = (user?.name || user?.email || 'U').charAt(0).toUpperCase();
  return (
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold shadow-lg shadow-primary-200 ring-2 ring-white">
      {initial}
    </div>
  );
};


export const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { userLoyalty } = useLoyalty();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/marketplace', label: 'Marketplace' },
    { path: '/blog', label: 'Blog' },
    { path: '/contact', label: 'Contact' },
  ];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="sticky top-0 z-[60] bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative p-1">
                <img src={logo} alt="Logo" className="w-10 h-10 group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <span className="text-2xl font-orange tracking-tighter bg-gradient-to-r from-orange-700 to-orange-900 bg-clip-text text-bold text-transparent">
                MulyaBazzar
              </span>
            </Link>

            <div className="hidden md:flex items-center bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50">
              {navItems.map((item) => (
                <NavLink key={item.path} to={item.path}>{item.label}</NavLink>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-3 p-1.5 pr-3 rounded-2xl hover:bg-slate-100 transition-all"
                  >
                    <UserAvatar user={user} />
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 p-2 overflow-hidden"
                      >
                        <div className="px-4 py-4 bg-slate-50 rounded-2xl mb-2">
                          <p className="text-sm font-bold text-slate-900">{user?.name || 'User'}</p>
                          <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                          {user?.b2b_verified && (
                            <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                              <BadgeCheck className="w-3 h-3" /> B2B Verified
                            </div>
                          )}
                        </div>

                        {/* Loyalty Points Display */}
                        {userLoyalty && userLoyalty.current_tier && (
                          <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl mb-2 border border-amber-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-gray-700">Loyalty Points</span>
                              <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                                {userLoyalty.current_tier.name}
                              </span>
                            </div>
                            <p className="text-2xl font-bold text-amber-600 mb-1">{userLoyalty.current_points}</p>
                            <p className="text-xs text-gray-600 mb-2">
                              Earn {userLoyalty.current_tier.point_multiplier}x on purchases
                            </p>
                            <button
                              onClick={() => {
                                navigate('/loyalty');
                                setIsUserMenuOpen(false);
                              }}
                              className="w-full text-xs font-bold text-amber-600 hover:text-amber-700 bg-white hover:bg-amber-50 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 border border-amber-200"
                            >
                              <Gift className="w-3 h-3" />
                              View Details
                            </button>
                          </div>
                        )}

                        <div className="space-y-1">
                          <DropdownItem to="/user-profile" icon={<User size={16}/>} label="My Profile" />
                          <DropdownItem to="/loyalty" icon={<Gift size={16}/>} label="Loyalty Rewards" />
                          <DropdownItem to="/my-orders" icon={<ShoppingBag size={16}/>} label="Order History" />
                          <div className="h-px bg-slate-100 my-1" />
                          <button 
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <LogOut size={16} /> Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-slate-900 px-4">Log in</Link>
                  <Link to="/register" className="bg-primary-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary-200 hover:bg-primary-700 active:scale-95 transition-all">
                    Sign up
                  </Link>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-100 text-slate-600 active:scale-90 transition-transform"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[65] bg-slate-900/40 backdrop-blur-sm md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 z-[70] w-[80%] max-w-sm bg-white shadow-2xl md:hidden flex flex-col p-6"
            >
              <div className="flex items-center justify-between mb-10">
                <span className="font-black text-xl">Menu</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-lg bg-slate-100"><X size={20}/></button>
              </div>

              <div className="space-y-4 flex-1">
                {navItems.map((item) => (
                  <Link 
                    key={item.path} 
                    to={item.path} 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-2xl font-bold text-slate-800 hover:text-primary-600 transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="pt-6 border-t border-slate-100">
                {isAuthenticated ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                      <UserAvatar user={user} />
                      <div>
                        <p className="font-bold text-slate-900">{user?.name || 'User'}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[150px]">{user?.email}</p>
                      </div>
                    </div>

                    {/* Loyalty Points in Mobile Menu */}
                    {userLoyalty && userLoyalty.current_tier && (
                      <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-amber-700">Loyalty Points</span>
                          <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                            {userLoyalty.current_tier.name}
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-amber-600">{userLoyalty.current_points}</p>
                        <button
                          onClick={() => {
                            navigate('/loyalty');
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full text-sm font-bold text-amber-600 bg-white hover:bg-amber-50 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 border border-amber-200"
                        >
                          <Gift className="w-4 h-4" />
                          View Dashboard
                        </button>
                      </div>
                    )}

                    <button onClick={handleLogout} className="w-full py-4 text-red-500 font-bold flex items-center justify-center gap-2 bg-red-50 rounded-2xl">
                      <LogOut size={20} /> Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="py-4 text-center font-bold text-slate-600 bg-slate-100 rounded-2xl">Log in</Link>
                    <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="py-4 text-center font-bold text-white bg-primary-600 rounded-2xl">Sign up</Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

const DropdownItem = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => (
  <Link
    to={to}
    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
  >
    <span className="text-slate-400 group-hover:text-primary-600">{icon}</span>
    {label}
  </Link>
);

export default Navbar;
