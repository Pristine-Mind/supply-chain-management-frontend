import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        menu: 'Menu',
        products: 'Total Products',
        orders: 'Total Orders',
        sales: 'Total Sales',
        customers: 'Total Customers',
        monthly_sales_trends: 'Monthly Sales Trends (Aggregated)',
        pending_orders: 'Pending Orders',
        total_revenue: 'Total Revenue',
        producer_management: 'Producer Management',
        product_management: 'Product Management',
        customer_management: 'Customer Management',
        sales_management: 'Sales Management',
        stats_and_analytics: 'Stats and Analytics',
        stock_management: 'Stock Management',
        supply_chain_dashboard: 'Supply Chain Dashboard',
        search_placeholder: 'Search...',
        logout: 'Logout',
      },
    },
    ne: {
      translation: {
        menu: 'मेनु',
        products: 'कुल उत्पादन',
        orders: 'कुल अर्डर',
        sales: 'कुल बिक्री',
        customers: 'कुल ग्राहक',
        monthly_sales_trends: 'मासिक बिक्री प्रवृत्ति (समग्र)',
        pending_orders: 'पेन्डिङ अर्डरहरू',
        total_revenue: 'कुल राजस्व',
        producer_management: 'उत्पादक व्यवस्थापन',
        product_management: 'उत्पादन व्यवस्थापन',
        customer_management: 'ग्राहक व्यवस्थापन',
        sales_management: 'बिक्री व्यवस्थापन',
        stats_and_analytics: 'सांख्यिकी र विश्लेषण',
        stock_management: 'स्टक व्यवस्थापन',
        supply_chain_dashboard: 'आपूर्ति श्रृंखला ड्यासबोर्ड',
        search_placeholder: 'खोजी गर्नुहोस्...',
        logout: 'बाहिर निस्कनुहोस्',

      },
    },
  },
  lng: 'ne',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
