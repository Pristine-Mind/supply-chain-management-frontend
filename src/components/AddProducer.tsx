import React, { useState, useEffect, useMemo } from 'react';
import axios, { isAxiosError } from 'axios';
import { FaPlus, FaDownload, FaEdit, FaSearch } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

interface Producer {
  id: number;
  name: string;
  contact: string;
  email: string;
  address: string;
  registration_number: string;
}

interface ErrorMessages {
  name?: string[];
  contact?: string[];
  email?: string[];
  address?: string[];
  registration_number?: string[];
  general?: string[];
}

const AddProducer: React.FC = () => {
  const { t } = useTranslation();
  const [producers, setProducers] = useState<Producer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '',
    address: '',
    registration_number: ''
  });
  const [formVisible, setFormVisible] = useState(false);
  const [errorMessages, setErrorMessages] = useState<ErrorMessages>({});
  const [success, setSuccess] = useState('');
  const [editingProducerId, setEditingProducerId] = useState<number | null>(null);
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProducers = async (limit: number, offset: number, searchQuery: string = '') => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/producers/`, {
        params: { limit, offset, search: searchQuery },
        headers: { Authorization: `Token ${localStorage.getItem('token')}` },
      });
      setProducers(response.data.results);
      setTotalCount(response.data.count);
    } catch (error) {
      console.error('Error fetching producers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducers(limit, offset, searchQuery);
  }, [offset, searchQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setOffset(0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMessages({ ...errorMessages, [e.target.name]: undefined });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProducerId) {
        await axios.patch(
          `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/producers/${editingProducerId}/`,
          formData,
          { headers: { Authorization: `Token ${localStorage.getItem('token')}` } }
        );
        setSuccess(t('producer_updated_successfully'));
        setEditingProducerId(null);
      } else {
        await axios.post(
          `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/producers/`,
          formData,
          { headers: { Authorization: `Token ${localStorage.getItem('token')}` } }
        );
        setSuccess(t('producer_added_successfully'));
      }
      setErrorMessages({});
      setFormData({ name: '', contact: '', email: '', address: '', registration_number: '' });
      setFormVisible(false);
      fetchProducers(limit, offset, searchQuery);
      setTimeout(() => setSuccess(''), 1000);
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        setErrorMessages(error.response?.data ?? { general: [t('error_general')] });
      } else {
        setErrorMessages({ general: [t('error_failed_add_update_producer')] });
      }
    }
  };

  const handlePageChange = (newOffset: number) => setOffset(newOffset);

  const totalPages = useMemo(() => Math.ceil(totalCount / limit), [totalCount, limit]);

  const handleEditClick = (producer: Producer) => {
    setFormVisible(true);
    setFormData({ ...producer });
    setEditingProducerId(producer.id);
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_REACT_APP_API_URL}/api/export/producers/`, {
        responseType: 'blob',
        headers: { Authorization: `Token ${localStorage.getItem('token')}` },
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'producers.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        console.error('Export error:', error.response?.data);
        setErrorMessages({ general: [t('error_exporting_data')] });
      } else {
        console.error('Unexpected error:', error);
        setErrorMessages({ general: [t('error_exporting_data')] });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="p-8 bg-white rounded-xl shadow-sm mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-primary-700">{t('producers_list')}</h2>
        </div>

        {success && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">{success}</div>}

        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder={t('search_by_name')}
              className="pl-10 pr-4 py-2 border rounded-lg w-full"
            />
            <FaSearch className="absolute left-3 top-2.5 text-gray-400" />
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setFormVisible(true);
                setFormData({ name: '', contact: '', email: '', address: '', registration_number: '' });
                setEditingProducerId(null);
              }}
              className="flex items-center bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              <FaPlus className="mr-2" /> {t('add_producer')}
            </button>
            <button
              onClick={handleExport}
              className="flex items-center bg-accent-success-600 text-white px-4 py-2 rounded-lg hover:bg-accent-success-700 transition-colors font-medium"
            >
              <FaDownload className="mr-2" /> {t('export')}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('producer_name')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('contact')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('email')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('address')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('registration_number')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mr-4"></div>
                      <span className="text-base text-gray-500">{t('loading')}</span>
                    </div>
                  </td>
                </tr>
              ) : producers.length > 0 ? (
                producers.map((producer) => (
                  <tr key={producer.id} className="hover:bg-gray-50 transition duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{producer.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producer.contact}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producer.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producer.address}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producer.registration_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEditClick(producer)}
                        className="text-primary-600 hover:text-primary-700 flex items-center font-medium transition-colors"
                      >
                        <FaEdit className="mr-1" /> {t('edit')}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">{t('no_producers_available')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mt-6">
          <button
            disabled={offset === 0}
            onClick={() => handlePageChange(offset - limit)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${offset === 0 ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700 text-white'}`}
          >
            {t('previous')}
          </button>
          <span className="text-body text-neutral-600">
            {t('page')} {Math.floor(offset / limit) + 1} {t('of')} {totalPages}
          </span>
          <button
            disabled={offset + limit >= totalCount}
            onClick={() => handlePageChange(offset + limit)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${offset + limit >= totalCount ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700 text-white'}`}
          >
            {t('next')}
          </button>
        </div>

        {formVisible && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                {editingProducerId ? t('edit_producer') : t('add_producer')}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMessages.general && <p className="text-red-500 text-sm">{errorMessages.general[0]}</p>}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    {t('producer_name')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border ${errorMessages.name ? 'border-red-500' : ''}`}
                    required
                  />
                  {errorMessages.name && <p className="mt-2 text-sm text-red-600">{errorMessages.name[0]}</p>}
                </div>
                <div>
                  <label htmlFor="contact" className="block text-sm font-medium text-gray-700">
                    {t('contact_information')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="contact"
                    name="contact"
                    value={formData.contact}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border ${errorMessages.contact ? 'border-red-500' : ''}`}
                    required
                  />
                  {errorMessages.contact && <p className="mt-2 text-sm text-red-600">{errorMessages.contact[0]}</p>}
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    {t('email_address')}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border ${errorMessages.email ? 'border-red-500' : ''}`}
                  />
                  {errorMessages.email && <p className="mt-2 text-sm text-red-600">{errorMessages.email[0]}</p>}
                </div>
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    {t('physical_address')} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border ${errorMessages.address ? 'border-red-500' : ''}`}
                    required
                  ></textarea>
                  {errorMessages.address && <p className="mt-2 text-sm text-red-600">{errorMessages.address[0]}</p>}
                </div>
                <div>
                  <label htmlFor="registration_number" className="block text-sm font-medium text-gray-700">
                    {t('citizenship_pan_number')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="registration_number"
                    name="registration_number"
                    value={formData.registration_number}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border ${errorMessages.registration_number ? 'border-red-500' : ''}`}
                    required
                  />
                  {errorMessages.registration_number && <p className="mt-2 text-sm text-red-600">{errorMessages.registration_number[0]}</p>}
                </div>
                <div className="flex justify-end space-x-3 pt-6 border-t border-neutral-200">
                  <button
                    type="button"
                    onClick={() => {
                      setFormVisible(false);
                      setEditingProducerId(null);
                    }}
                    className="px-6 py-3 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 text-body font-medium transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-body font-medium transition-colors"
                  >
                    {editingProducerId ? t('update_producer') : t('add_producer')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddProducer;
