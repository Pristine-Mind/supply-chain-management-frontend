import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Building2, 
  ShoppingBag, 
  Users, 
  DollarSign, 
  BarChart3, 
  Scale, 
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  FileText,
  Activity,
  Zap,
  TrendingDown,
  Shield,
  AlertTriangle,
  TrendingUp,
  Target
} from 'lucide-react';
import { FaFirstOrder } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { listNegotiations } from '../../api/b2bApi';

interface Props {
  businessType: string | null;
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const SidebarNav: React.FC<Props> = ({ businessType, isCollapsed, setIsCollapsed }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [pendingNegCount, setPendingNegCount] = useState(0);

  useEffect(() => {
    if (businessType === 'distributor') {
      const fetchCount = async () => {
        try {
          const data = await listNegotiations();
          const results = data.results || data || [];
          if (Array.isArray(results)) {
            const count = results.filter((n: any) => 
              n.last_offer_by !== user?.id && 
              (n.status === 'PENDING' || n.status === 'COUNTER_OFFER')
            ).length;
            setPendingNegCount(count);
          }
        } catch (err) {
          console.error('Failed to fetch negotiation count:', err);
        }
      };
      fetchCount();
      const interval = setInterval(fetchCount, 60000); // Pulse every minute
      return () => clearInterval(interval);
    }
  }, [businessType, user?.id]);

  /**
   * Helper component for Navigation Links
   * Handles the logic for showing/hiding text and adjusting margins
   */
  const NavItem = ({ href, icon: Icon, label, badge }: { href: string; icon: any; label: string; badge?: number }) => (
    <li>
      <a
        href={href}
        title={isCollapsed ? label : ''}
        className={`flex items-center p-3 rounded-lg font-medium text-orange-100 hover:bg-orange-700 hover:text-white transition-all duration-200 group relative`}
      >
        <Icon 
          className={`h-5 w-5 flex-shrink-0 transition-all duration-200 ${
            isCollapsed ? 'mx-auto' : 'mr-3'
          }`} 
        />
        {!isCollapsed && (
          <div className="flex-1 flex items-center justify-between min-w-0">
            <span className="whitespace-nowrap overflow-hidden text-ellipsis">
              {label}
            </span>
            {badge ? (
              <span className="bg-white text-orange-700 text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-sm ml-2">
                {badge}
              </span>
            ) : null}
          </div>
        )}
        {isCollapsed && badge ? (
          <span className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full shadow-sm animate-pulse" />
        ) : null}
      </a>
    </li>
  );
  return (
    <div className="relative h-full flex flex-col">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden md:flex absolute -right-3 top-8 bg-orange-700 border border-orange-600 rounded-full p-1 shadow-lg hover:bg-orange-500 transition-colors z-50 text-white"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <nav className="p-4 flex-1 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-2">
          {businessType === 'retailer' ? (
            <>
              <NavItem href="/producers" icon={Building2} label={t('producer_management')} />
              <NavItem href="/products" icon={ShoppingBag} label={t('product_management')} />
              <NavItem href="/sales" icon={DollarSign} label="Direct Sales" />
              <NavItem href="/stocks" icon={Scale} label={t('stock_management')} />
              <NavItem href="/marketplace/all-products" icon={ShoppingBag} label="Marketplace Products" />

              
              <div className="pt-4 pb-2">
                <div className={`h-px bg-orange-600/50 mb-4 ${isCollapsed ? 'mx-2' : ''}`} />
                {!isCollapsed && <p className="px-3 text-[10px] font-bold text-orange-300 uppercase tracking-widest mb-2">Intelligence</p>}
              </div>
              <NavItem href="/reports/weekly-digests" icon={FileText} label="Weekly Digests" />
              <NavItem href="/reports/rfm-segments" icon={Zap} label="Customer RFM" />
              <NavItem href="/reports/lost-sales" icon={TrendingDown} label="Lost Sales Analysis" />
              <NavItem href="/system-health" icon={Activity} label="System Health" />
              
              <div className="pt-4 pb-2">
                <div className={`h-px bg-orange-600/50 mb-4 ${isCollapsed ? 'mx-2' : ''}`} />
                {!isCollapsed && <p className="px-3 text-[10px] font-bold text-orange-300 uppercase tracking-widest mb-2">Risk Management</p>}
              </div>
              <NavItem href="/risk-management" icon={Shield} label="Risk Dashboard" />
              <NavItem href="/risk-management/scorecards" icon={Target} label="Supplier Scorecards" />
              <NavItem href="/risk-management/kpis" icon={TrendingUp} label="Supply Chain KPIs" />
              <NavItem href="/risk-management/alerts" icon={AlertTriangle} label="Alerts" />
              <NavItem href="/risk-management/risks" icon={Shield} label="Risk Assessment" />
            </>
          ) : businessType === 'distributor' ? (
            <>
              <NavItem href="/producers" icon={Building2} label={t('producer_management')} />
              <NavItem href="/products" icon={ShoppingBag} label={t('product_management')} />
              <NavItem href="/customers" icon={Users} label="Customer Management" />
              <NavItem href="/orders" icon={FaFirstOrder} label={t('order_management')} />
              <NavItem href="/purchase-orders" icon={ClipboardList} label="Purchase Order Management" />
              <NavItem href="/sales" icon={DollarSign} label={t('sales_management')} />
              <NavItem href="/stocks" icon={Scale} label={t('stock_management')} />
              <NavItem href="/stats" icon={BarChart3} label={t('stats_and_analytics')} />
              <NavItem href="/audit-logs" icon={ClipboardList} label={t('audit_logs')} />
              <NavItem href="/find-business" icon={Users} label="Find Business" />
              <NavItem href="/marketplace-dashboard" icon={BarChart3} label="Marketplace Dashboard" />
              <NavItem href="/marketplace-dashboard/orders" icon={FaFirstOrder} label="Marketplace Orders" />
              <NavItem href="/marketplace-dashboard/negotiations" icon={ClipboardList} label="Negotiations" badge={pendingNegCount} />
              <NavItem href="/marketplace/all-products" icon={ShoppingBag} label="Marketplace Products" />
              
              <div className="pt-4 pb-2">
                <div className={`h-px bg-orange-600/50 mb-4 ${isCollapsed ? 'mx-2' : ''}`} />
                {!isCollapsed && <p className="px-3 text-[10px] font-bold text-orange-300 uppercase tracking-widest mb-2">Intelligence</p>}
              </div>
              <NavItem href="/reports/weekly-digests" icon={FileText} label="Weekly Digests" />
              <NavItem href="/reports/rfm-segments" icon={Zap} label="Customer RFM" />
              <NavItem href="/reports/lost-sales" icon={TrendingDown} label="Lost Sales Analysis" />
              
              <div className="pt-4 pb-2">
                <div className={`h-px bg-orange-600/50 mb-4 ${isCollapsed ? 'mx-2' : ''}`} />
                {!isCollapsed && <p className="px-3 text-[10px] font-bold text-orange-300 uppercase tracking-widest mb-2">Risk Management</p>}
              </div>
              <NavItem href="/risk-management" icon={Shield} label="Risk Dashboard" />
              <NavItem href="/risk-management/scorecards" icon={Target} label="Supplier Scorecards" />
              <NavItem href="/risk-management/kpis" icon={TrendingUp} label="Supply Chain KPIs" />
              <NavItem href="/risk-management/alerts" icon={AlertTriangle} label="Alerts" />
              <NavItem href="/risk-management/risks" icon={Shield} label="Risk Assessment" />
            </>
          ) : (
            <>
              <NavItem href="/producers" icon={Building2} label={t('producer_management')} />
              <NavItem href="/products" icon={ShoppingBag} label={t('product_management')} />
              <NavItem href="/customers" icon={Users} label={t('customer_management')} />
              <NavItem href="/orders" icon={FaFirstOrder} label={t('order_management')} />
              <NavItem href="/purchase-orders" icon={ClipboardList} label="Purchase Order Management" />
              <NavItem href="/sales" icon={DollarSign} label={t('sales_management')} />
              <NavItem href="/stats" icon={BarChart3} label={t('stats_and_analytics')} />
              <NavItem href="/audit-logs" icon={ClipboardList} label={t('audit_logs')} />
              <NavItem href="/stocks" icon={Scale} label={t('stock_management')} />
              <NavItem href="/marketplace/all-products" icon={ShoppingBag} label="Marketplace Products" />
              <div className="pt-4 pb-2">
                <div className={`h-px bg-orange-600/50 mb-4 ${isCollapsed ? 'mx-2' : ''}`} />
                {!isCollapsed && <p className="px-3 text-[10px] font-bold text-orange-300 uppercase tracking-widest mb-2">Intelligence</p>}
              </div>
              <NavItem href="/reports/weekly-digests" icon={FileText} label="Weekly Digests" />
              <NavItem href="/reports/rfm-segments" icon={Zap} label="Customer RFM" />
              <NavItem href="/reports/lost-sales" icon={TrendingDown} label="Lost Sales Analysis" />
              
              <div className="pt-4 pb-2">
                <div className={`h-px bg-orange-600/50 mb-4 ${isCollapsed ? 'mx-2' : ''}`} />
                {!isCollapsed && <p className="px-3 text-[10px] font-bold text-orange-300 uppercase tracking-widest mb-2">Risk Management</p>}
              </div>
              <NavItem href="/risk-management" icon={Shield} label="Risk Dashboard" />
              <NavItem href="/risk-management/scorecards" icon={Target} label="Supplier Scorecards" />
              <NavItem href="/risk-management/kpis" icon={TrendingUp} label="Supply Chain KPIs" />
              <NavItem href="/risk-management/alerts" icon={AlertTriangle} label="Alerts" />
              <NavItem href="/risk-management/risks" icon={Shield} label="Risk Assessment" />
            </>
          )}
        </ul>
      </nav>
    </div>
  );
};

export default SidebarNav;
