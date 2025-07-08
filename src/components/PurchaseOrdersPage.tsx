import React from 'react';
import PurchaseOrderCards from './PurchaseOrderCards';
import { ClipboardListIcon } from '@heroicons/react/solid';

const PurchaseOrdersPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <div className="w-full max-w-6xl bg-white rounded-lg shadow p-6 mt-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center">
          <ClipboardListIcon className="h-7 w-7 text-blue-600 mr-2" />
          Purchase Order Management
        </h1>
        <PurchaseOrderCards pageSize={9} />
      </div>
    </div>
  );
};

export default PurchaseOrdersPage;
