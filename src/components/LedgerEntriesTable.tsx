import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface LedgerEntry {
  id: number;
  account_type: string;
  amount: string;
  debit: boolean;
  reference_id: string;
  date: string;
  related_entity: number;
  account_type_display: string;
}

interface LedgerEntriesTableProps {
  entries: LedgerEntry[];
}

const LedgerEntriesTable: React.FC<LedgerEntriesTableProps> = ({ entries = [] }) => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    account_type: '',
    amount: '',
    debit: true,
    reference_id: '',
    date: '',
    related_entity: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const { name, value } = target;

    let nextValue: string | number | boolean = value;
    if (name === 'debit') {
      // Select control maps to boolean
      nextValue = value === 'debit';
    } else if ((target as HTMLInputElement).type === 'checkbox') {
      nextValue = (target as HTMLInputElement).checked;
    }

    setFormData(prev => ({
      ...prev,
      [name]: nextValue,
    }));
  };

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const payload = {
        ...formData,
        related_entity: Number(formData.related_entity),
      };
      await import('../api/ledgerApi').then(api => api.addLedgerEntry(payload, token));
      setShowModal(false);
      setFormData({
        account_type: '',
        amount: '',
        debit: true,
        reference_id: '',
        date: '',
        related_entity: '',
      });
    } catch (e: any) {
      setError(e.message || 'Error adding entry');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="overflow-x-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{t('ledger_entries')}</h2>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition"
          onClick={() => setShowModal(true)}
        >
          + {t('add')}
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium">{t('add_ledger_entry')}</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('account_type')}
                </label>
                <input
                  type="text"
                  name="account_type"
                  value={formData.account_type}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('amount')}
                </label>
                <input
                  type="number"
                  name="amount"
                  step="any"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('transaction_type')}
                </label>
                <select
                  name="debit"
                  value={formData.debit ? 'debit' : 'credit'}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="debit">{t('debit')}</option>
                  <option value="credit">{t('credit')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('reference_id')}
                </label>
                <input
                  type="text"
                  name="reference_id"
                  value={formData.reference_id}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('date')}
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('related_entity')}
                </label>
                <input
                  type="text"
                  name="related_entity"
                  value={formData.related_entity}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  {t('add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <table className="min-w-full bg-white divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {['ID', 'Account Type', 'Amount', 'Debit/Credit', 'Reference ID', 'Date', 'Related Entity'].map(col => (
              <th
                key={col}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {entries.map(entry => (
            <tr key={entry.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{entry.id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{entry.account_type_display}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{entry.amount}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{entry.debit ? t('debit') : t('credit')}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{entry.reference_id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{entry.date}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{entry.related_entity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LedgerEntriesTable;
