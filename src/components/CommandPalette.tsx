import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Command, ShoppingBag, DollarSign, Scale, Activity } from 'lucide-react';
import { reportsApi } from '../api/reportsApi';

interface CommandItem {
  id: string;
  name: string;
  shortcut: string;
  action: string;
  category: string;
}

const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [commands, setCommands] = useState<CommandItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCommands = async () => {
      try {
        const data = await reportsApi.getCommandPalette();
        setCommands(data);
      } catch (error) {
        console.error('Error fetching command palette:', error);
        setCommands([
          { id: '1', name: 'Search Products', shortcut: 'Ctrl+P', action: '/products', category: 'General' },
          { id: '2', name: 'Export Sales', shortcut: 'Ctrl+E', action: '/sales', category: 'Reporting' },
          { id: '3', name: 'Inventory Audit', shortcut: 'Ctrl+I', action: '/stocks', category: 'Inventory' },
        ]);
      }
    };

    fetchCommands();
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setIsOpen(prev => !prev);
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault();
      navigate('/products');
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
      e.preventDefault();
      navigate('/sales');
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      navigate('/stocks');
    }

    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }, [navigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const filteredCommands = Array.isArray(commands) ? commands.filter(cmd =>
    (cmd?.name?.toLowerCase().includes(query.toLowerCase()) || false) ||
    (cmd?.category?.toLowerCase().includes(query.toLowerCase()) || false)
  ) : [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 sm:px-6 md:px-8">
      <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center px-4 border-b border-gray-100">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            autoFocus
            className="flex-1 px-4 py-4 text-gray-800 bg-transparent border-none focus:ring-0 text-lg placeholder-gray-400"
            placeholder="Search commands (Ctrl+K)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-lg border border-gray-200">
            <Command className="h-3 w-3 text-gray-500" />
            <span className="text-[10px] font-bold text-gray-500 uppercase">K</span>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredCommands.length > 0 ? (
            <div className="space-y-4 py-2">
              {['General', 'Reporting', 'Inventory', 'Intelligence', 'System'].map(category => {
                const categoryCmds = filteredCommands.filter(c => c.category === category);
                if (categoryCmds.length === 0) return null;
                
                return (
                  <div key={category}>
                    <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {category}
                    </h3>
                    <div className="space-y-1">
                      {categoryCmds.map(cmd => (
                        <button
                          key={cmd.id}
                          onClick={() => {
                            navigate(cmd.action);
                            setIsOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-orange-50 group transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-white transition-colors">
                              {cmd.id === '1' && <ShoppingBag className="h-4 w-4 text-gray-600" />}
                              {cmd.id === '2' && <DollarSign className="h-4 w-4 text-gray-600" />}
                              {cmd.id === '3' && <Scale className="h-4 w-4 text-gray-600" />}
                              {cmd.category === 'System' && <Activity className="h-4 w-4 text-gray-600" />}
                              {!['1', '2', '3'].includes(cmd.id) && cmd.category !== 'System' && <Command className="h-4 w-4 text-gray-600" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{cmd.name}</p>
                              <p className="text-xs text-gray-500">{cmd.category}</p>
                            </div>
                          </div>
                          {cmd.shortcut && (
                            <span className="text-xs text-gray-400 font-medium group-hover:text-orange-500 transition-colors">
                              {cmd.shortcut}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-gray-500">No commands found for "{query}"</p>
            </div>
          )}
        </div>

        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[10px] text-gray-500 uppercase font-bold tracking-widest">
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 bg-white border border-gray-200 rounded shadow-sm">Enter</span>
              <span>to select</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 bg-white border border-gray-200 rounded shadow-sm">Esc</span>
              <span>to close</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
