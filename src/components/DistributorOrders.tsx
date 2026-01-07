import React, { useEffect, useState, useMemo } from 'react';
import { 
  listDistributorOrders, 
  fetchDistributorOrderInvoice, 
  DistributorOrder 
} from '../api/distributorApi';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { 
  Search, 
  Download, 
  Eye, 
  ShoppingBag, 
  CreditCard, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  CheckSquare,
  Square,
  FileDown,
  Trophy
} from 'lucide-react';

const DistributorOrders: React.FC = () => {
  const [orders, setOrders] = useState<DistributorOrder[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState<number | null>(null);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      try {
        const data = await listDistributorOrders();
        setOrders(data);
      } catch (e: any) {
        setError('Failed to sync orders.');
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = !searchQuery || o.order_number?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || o.order_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const visibleOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  
  const toggleSelectAll = () => {
    if (selectedIds.length === visibleOrders.length) setSelectedIds([]);
    else setSelectedIds(visibleOrders.map(o => o.id));
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleDownload = async (id: number, num: string) => {
    setInvoiceLoading(id);
    try {
      const res = await fetchDistributorOrderInvoice(id);
      if (res instanceof Blob) {
        const url = window.URL.createObjectURL(res);
        const link = document.body.appendChild(document.createElement('a'));
        link.href = url;
        link.download = `Invoice-${num}.pdf`;
        link.click();
        link.remove();
      }
    } finally {
      setInvoiceLoading(null);
    }
  };

  const handleBulkDownload = async () => {
    setIsBulkLoading(true);
    for (const id of selectedIds) {
      const order = orders.find(o => o.id === id);
      await handleDownload(id, order?.order_number || id.toString());
    }
    setIsBulkLoading(false);
    setSelectedIds([]);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-10">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Orders</h1>
            <p className="text-slate-500 font-medium">Manage fulfillment and documentation</p>
          </div>
          
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-4">
              <span className="text-sm font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                {selectedIds.length} Selected
              </span>
              <Button 
                onClick={handleBulkDownload} 
                className="bg-slate-900 hover:bg-slate-800 gap-2 shadow-lg"
                disabled={isBulkLoading}
              >
                {isBulkLoading ? <CircleDashed className="animate-spin" size={16} /> : <FileDown size={16} />}
                Download ZIP
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-none shadow-sm overflow-hidden ring-1 ring-slate-200">
              <CardHeader className="bg-white p-4 flex flex-row items-center justify-between border-b">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20"
                    placeholder="Search orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="ghost" size="sm" onClick={toggleSelectAll} className="text-xs font-bold text-slate-500">
                  {selectedIds.length === visibleOrders.length ? "Deselect All" : "Select Page"}
                </Button>
              </CardHeader>
              
              <CardContent className="p-0 bg-white">
                <div className="divide-y divide-slate-100">
                  {visibleOrders.map(order => (
                    <OrderListItem 
                      key={order.id} 
                      order={order} 
                      isSelected={selectedIds.includes(order.id)}
                      onSelect={() => toggleSelect(order.id)}
                      onDownload={handleDownload}
                      isDownloading={invoiceLoading === order.id}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-orange-600 text-white border-none shadow-xl shadow-orange-200">
              <CardContent className="p-6">
                <Trophy size={32} className="mb-4 text-orange-200" />
                <p className="text-sm font-bold opacity-80 uppercase tracking-widest">Revenue Focus</p>
                <h3 className="text-4xl font-black mb-1">
                  Rs.{filteredOrders.reduce((a, b) => a + (b.total_amount || 0), 0).toLocaleString()}
                </h3>
                <p className="text-xs font-medium opacity-70 italic">Based on filtered results</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm ring-1 ring-slate-200">
              <CardHeader><CardTitle className="text-sm">Quick Filters</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {['all', 'pending', 'shipped', 'delivered'].map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`w-full text-left px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                      statusFilter === status ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

const OrderListItem = ({ order, isSelected, onSelect, onDownload, isDownloading }: any) => {
  return (
    <div className={`flex items-center p-4 gap-4 transition-colors ${isSelected ? 'bg-orange-50/30' : 'hover:bg-slate-50/50'}`}>
      <button onClick={onSelect} className="text-slate-300 hover:text-orange-500 transition-colors">
        {isSelected ? <CheckSquare className="text-orange-600" size={20} /> : <Square size={20} />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-black text-slate-900">{order.order_number}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
            order.order_status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {order.order_status}
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1"><ShoppingBag size={12}/> {order.customer}</span>
          <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(order.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="text-right mr-4">
        <p className="text-xs font-black text-slate-900">Rs.{order.total_amount?.toLocaleString()}</p>
        <p className="text-[10px] text-slate-400 font-bold uppercase">{order.seller_items?.length} Items</p>
      </div>

      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-orange-600" asChild>
          <a href={`/orders/${order.id}`}><Eye size={16} /></a>
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-slate-400 hover:text-orange-600"
          disabled={isDownloading}
          onClick={() => onDownload(order.id, order.order_number)}
        >
          {isDownloading ? <CircleDashed className="animate-spin" size={16} /> : <Download size={16} />}
        </Button>
      </div>
    </div>
  );
};

export default DistributorOrders;
