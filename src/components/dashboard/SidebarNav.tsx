import React from 'react';
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
  TrendingDown
} from 'lucide-react';
import { FaFirstOrder } from 'react-icons/fa';

interface Props {
  businessType: string | null;
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const SidebarNav: React.FC<Props> = ({ businessType, isCollapsed, setIsCollapsed }) => {
  const { t } = useTranslation();

  /**
   * Helper component for Navigation Links
   * Handles the logic for showing/hiding text and adjusting margins
   */
  const NavItem = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => (
    <li>
      <a
        href={href}
        title={isCollapsed ? label : ''}
        className={`flex items-center p-3 rounded-lg font-medium text-orange-100 hover:bg-orange-700 hover:text-white transition-all duration-200 group`}
      >
        <Icon 
          className={`h-5 w-5 flex-shrink-0 transition-all duration-200 ${
            isCollapsed ? 'mx-auto' : 'mr-3'
          }`} 
        />
        {!isCollapsed && (
          <span className="whitespace-nowrap overflow-hidden text-ellipsis">
            {label}
          </span>
        )}
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
              
              <div className="pt-4 pb-2">
                <div className={`h-px bg-orange-600/50 mb-4 ${isCollapsed ? 'mx-2' : ''}`} />
                {!isCollapsed && <p className="px-3 text-[10px] font-bold text-orange-300 uppercase tracking-widest mb-2">Intelligence</p>}
              </div>
              <NavItem href="/reports/weekly-digests" icon={FileText} label="Weekly Digests" />
              <NavItem href="/reports/rfm-segments" icon={Zap} label="Customer RFM" />
              <NavItem href="/reports/lost-sales" icon={TrendingDown} label="Lost Sales Analysis" />
              <NavItem href="/system-health" icon={Activity} label="System Health" />
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
              <NavItem href="/marketplace-dashboard/negotiations" icon={ClipboardList} label="Negotiations" />
              
              <div className="pt-4 pb-2">
                <div className={`h-px bg-orange-600/50 mb-4 ${isCollapsed ? 'mx-2' : ''}`} />
                {!isCollapsed && <p className="px-3 text-[10px] font-bold text-orange-300 uppercase tracking-widest mb-2">Intelligence</p>}
              </div>
              <NavItem href="/reports/weekly-digests" icon={FileText} label="Weekly Digests" />
              <NavItem href="/reports/rfm-segments" icon={Zap} label="Customer RFM" />
              <NavItem href="/reports/lost-sales" icon={TrendingDown} label="Lost Sales Analysis" />
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

              <div className="pt-4 pb-2">
                <div className={`h-px bg-orange-600/50 mb-4 ${isCollapsed ? 'mx-2' : ''}`} />
                {!isCollapsed && <p className="px-3 text-[10px] font-bold text-orange-300 uppercase tracking-widest mb-2">Intelligence</p>}
              </div>
              <NavItem href="/reports/weekly-digests" icon={FileText} label="Weekly Digests" />
              <NavItem href="/reports/rfm-segments" icon={Zap} label="Customer RFM" />
              <NavItem href="/reports/lost-sales" icon={TrendingDown} label="Lost Sales Analysis" />
            </>
          )}
        </ul>
      </nav>
    </div>
  );
};

export default SidebarNav;
