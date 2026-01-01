import React from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, ShoppingBag, Users, DollarSign, BarChart3, Scale, ClipboardList } from 'lucide-react';
import { FaFirstOrder } from 'react-icons/fa';

interface Props {
  businessType: string | null;
}

const SidebarNav: React.FC<Props> = ({ businessType }) => {
  const { t } = useTranslation();

  return (
    <nav className="p-4">
      <ul className="space-y-2">
        {businessType === 'retailer' ? (
          <>
            <li><a href="/producers" className="flex items-center p-3 rounded-lg text-body font-medium text-neutral-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"><Building2 className="h-5 w-5 mr-3" />{t('producer_management')}</a></li>
            <li><a href="/products" className="flex items-center p-3 rounded-lg text-body font-medium text-neutral-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"><ShoppingBag className="h-5 w-5 mr-3" />{t('product_management')}</a></li>
            <li><a href="/sales" className="flex items-center p-3 rounded-lg text-body font-medium text-neutral-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"><DollarSign className="h-5 w-5 mr-3" />Direct Sales</a></li>
            <li><a href="/stocks" className="flex items-center p-3 rounded-lg text-body font-medium text-neutral-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"><Scale className="h-5 w-5 mr-3" />{t('stock_management')}</a></li>
          </>
        ) : businessType === 'distributor' ? (
          <>
            <li><a href="/producers" className="flex items-center p-3 rounded-lg text-body font-medium text-neutral-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"><Building2 className="h-5 w-5 mr-3" />{t('producer_management')}</a></li>
            <li><a href="/products" className="flex items-center p-3 rounded-lg text-body font-medium text-neutral-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"><ShoppingBag className="h-5 w-5 mr-3" />{t('product_management')}</a></li>
            <li><a href="/customers" className="flex items-center p-3 rounded-lg text-body font-medium text-neutral-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"><Users className="h-5 w-5 mr-3" />Customer Management</a></li>            
            <li><a href="/orders" className="flex items-center p-3 rounded-lg text-body font-medium text-neutral-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"><FaFirstOrder className="h-5 w-5 mr-3" />{t('order_management')}</a></li>
            <li><a href="/purchase-orders" className="flex items-center p-3 rounded-lg text-body font-medium text-neutral-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"><ClipboardList className="h-5 w-5 mr-3" />Purchase Order Management</a></li>
            <li><a href="/sales" className="flex items-center p-3 rounded-lg text-body font-medium text-neutral-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"><DollarSign className="h-5 w-5 mr-3" />{t('sales_management')}</a></li>
            <li><a href="/stocks" className="flex items-center p-3 rounded-lg text-body font-medium text-neutral-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"><Scale className="h-5 w-5 mr-3" />{t('stock_management')}</a></li>
            <li><a href="/stats" className="flex items-center p-3 rounded-lg text-body font-medium text-neutral-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"><BarChart3 className="h-5 w-5 mr-3" />{t('stats_and_analytics')}</a></li>
            <li><a href="/audit-logs" className="flex items-center p-3 rounded-lg text-body font-medium text-neutral-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"><ClipboardList className="h-5 w-5 mr-3" />{t('audit_logs')}</a></li>
            <li><a href="/find-business" className="flex items-center p-3 rounded-lg text-body font-medium text-neutral-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"><Users className="h-5 w-5 mr-3" />Find Business</a></li>
            <li><a href="/marketplace-dashboard" className="flex items-center p-3 rounded-lg text-body font-medium text-neutral-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"><BarChart3 className="h-5 w-5 mr-3" />Marketplace Dashboard</a></li>
            <li><a href="/marketplace-dashboard/orders" className="flex items-center p-3 rounded-lg text-body font-medium text-neutral-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"><FaFirstOrder className="h-5 w-5 mr-3" />Marketplace Orders</a></li>  
          </>
        ) : (
          <>
            <li><a href="/producers" className="flex items-center p-3 rounded-lg text-body font-medium text-neutral-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"><Building2 className="h-5 w-5 mr-3" />{t('producer_management')}</a></li>
            <li><a href="/products" className="flex items-center p-3 rounded-lg text-body font-medium text-neutral-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"><ShoppingBag className="h-5 w-5 mr-3" />{t('product_management')}</a></li>
            <li><a href="/customers" className="flex items-center p-3 rounded-lg text-body font-medium text-neutral-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"><Users className="h-5 w-5 mr-3" />{t('customer_management')}</a></li>
            <li><a href="/orders" className="flex items-center p-3 rounded-lg text-body font-medium text-neutral-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"><FaFirstOrder className="h-5 w-5 mr-3" />{t('order_management')}</a></li>
            <li><a href="/purchase-orders" className="flex items-center p-3 rounded-lg text-body font-medium text-neutral-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"><ClipboardList className="h-5 w-5 mr-3" />Purchase Order Management</a></li>
            <li><a href="/sales" className="flex items-center p-3 rounded-lg text-body font-medium text-neutral-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"><DollarSign className="h-5 w-5 mr-3" />{t('sales_management')}</a></li>
            <li><a href="/stats" className="flex items-center p-3 rounded-lg text-body font-medium text-neutral-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"><BarChart3 className="h-5 w-5 mr-3" />{t('stats_and_analytics')}</a></li>
            <li><a href="/audit-logs" className="flex items-center p-3 rounded-lg text-body font-medium text-neutral-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"><ClipboardList className="h-5 w-5 mr-3" />{t('audit_logs')}</a></li>
            <li><a href="/stocks" className="flex items-center p-3 rounded-lg text-body font-medium text-neutral-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"><Scale className="h-5 w-5 mr-3" />{t('stock_management')}</a></li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default SidebarNav;
