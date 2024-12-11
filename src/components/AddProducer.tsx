import React, { useState, useEffect, useMemo } from 'react';
import axios, { isAxiosError } from 'axios';
import { FaPlus, FaDownload } from 'react-icons/fa';
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
  general?: string[]; // General errors
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

  const fetchProducers = async (limit: number, offset: number, searchQuery: string = '') => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/producers/`, {
        params: {
          limit,
          offset,
          search: searchQuery,
        },
        headers: {
          Authorization: `Token ${localStorage.getItem('token')}`,
        },
      });
      setProducers(response.data.results);
      setTotalCount(response.data.count);
    } catch (error: any) {
      if (error.response) {
        // Server responded with a status other than 200 range
        console.error('Response error:', error.response);
        console.error('Data:', error.response.data);
        console.error('Status:', error.response.status);
        console.error('Headers:', error.response.headers);
      } else if (error.request) {
        // Request was made but no response was received
        console.error('No response:', error.request);
      } else {
        // Something happened in setting up the request that triggered an error
        console.error('Error message:', error.message);
      }
      console.error('Config:', error.config);
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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setErrorMessages({ ...errorMessages, [e.target.name]: undefined });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProducerId) {
        await axios.patch(
          `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/producers/${editingProducerId}/`,
          formData,
          {
            headers: {
              Authorization: `Token ${localStorage.getItem('token')}`,
            }
          } 
        );
        setSuccess(t('producer_updated_successfully'));
        setEditingProducerId(null);
      } else {
        await axios.post(
          `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/producers/`,
          formData,
          {
            headers: {
              Authorization: `Token ${localStorage.getItem('token')}`,
            },
          }
        );
        
        setSuccess(t('producer_added_successfully'));
      }
      setErrorMessages({});
      setFormData({
        name: '',
        contact: '',
        email: '',
        address: '',
        registration_number: ''
      });
      setFormVisible(false);
      fetchProducers(limit, offset, searchQuery);

      setTimeout(() => {
        setSuccess('');
      }, 1000);
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        setErrorMessages(error.response?.data ?? { general: [t('error_general')] });
      } else {
        setErrorMessages({ general: [t('error_failed_add_update_producer')] });
      }
    }
  };

  const handlePageChange = (newOffset: number) => {
    setOffset(newOffset);
  };

  const totalPages = useMemo(() => Math.ceil(totalCount / limit), [totalCount, limit]);

  const handleEditClick = (producer: Producer) => {
    setFormVisible(true);
    setFormData({
      name: producer.name,
      contact: producer.contact,
      email: producer.email,
      address: producer.address,
      registration_number: producer.registration_number,
    });
    setEditingProducerId(producer.id);
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_REACT_APP_API_URL}/export/producers/`, {
        responseType: 'blob',
        headers: {
          Authorization: `Token ${localStorage.getItem('token')}`,
        },
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
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
        <h2 className="text-2xl font-bold mb-4 sm:mb-0">{t('farmers_list')}</h2>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          placeholder={t('search_by_name')}
          className="px-4 py-2 border rounded-lg w-full sm:w-1/3 mb-4 sm:mb-0"
        />
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setFormVisible(true);
              setFormData({ name: '', contact: '', email: '', address: '', registration_number: '' });
              setEditingProducerId(null);
            }}
            className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300"
          >
            <FaPlus className="mr-2" /> {t('add_producer')}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300"
          >
            <FaDownload className="mr-2" /> Export
          </button>
        </div>
      </div>

      <div className="overflow-x-auto relative shadow-md sm:rounded-lg mb-8">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="py-3 px-6">{t('producer_name')}</th>
              <th scope="col" className="py-3 px-6">{t('contact')}</th>
              <th scope="col" className="py-3 px-6">{t('email')}</th>
              <th scope="col" className="py-3 px-6">{t('address')}</th>
              <th scope="col" className="py-3 px-6">{t('registration_number')}</th>
              <th scope="col" className="py-3 px-6">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {producers.length > 0 ? (
              producers.map((producer) => (
                <tr key={producer.id}>
                  <td className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap">{producer.name}</td>
                  <td className="py-4 px-6">{producer.contact}</td>
                  <td className="py-4 px-6">{producer.email}</td>
                  <td className="py-4 px-6">{producer.address}</td>
                  <td className="py-4 px-6">{producer.registration_number}</td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => handleEditClick(producer)}
                      className="bg-emerald-500 text-white px-4 py-2 rounded-lg"
                    >
                      {t('edit')}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="py-4 px-6 text-center" colSpan={6}>{t('no_producers_available')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center">
        <button
          disabled={offset === 0}
          onClick={() => handlePageChange(offset - limit)}
          className={`px-4 py-2 text-white ${offset === 0 ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} rounded-lg`}
        >
          {t('previous')}
        </button>
        <span>{t('page')} {Math.floor(offset / limit) + 1} {t('of')} {totalPages}</span>
        <button
          disabled={offset + limit >= totalCount}
          onClick={() => handlePageChange(offset + limit)}
          className={`px-4 py-2 text-white ${offset + limit >= totalCount ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} rounded-lg`}
        >
          {t('next')}
        </button>
      </div>

      {formVisible && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="relative bg-white rounded-lg shadow-xl p-8 w-full max-w-lg z-20">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6 bg-gray-200 px-4 py-2 rounded-lg">
                {editingProducerId ? t('edit_farmer') : t('add_farmer')}
              </h3>

              <form onSubmit={handleSubmit}>
                {errorMessages.general && <p className="text-red-500 mb-4">{errorMessages.general[0]}</p>}

                <div className="mb-4">
                  <label htmlFor="name" className="block text-gray-700">
                    {t('producer_name')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg ${errorMessages.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                    required
                  />
                  {errorMessages.name && (
                    <p className="text-red-500 text-sm">{errorMessages.name[0]}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label htmlFor="contact" className="block text-gray-700">
                    {t('contact_information')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="contact"
                    name="contact"
                    value={formData.contact}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg ${errorMessages.contact ? 'border-red-500' : 'border-gray-300'
                      }`}
                    required
                  />
                  {errorMessages.contact && (
                    <p className="text-red-500 text-sm">{errorMessages.contact[0]}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label htmlFor="email" className="block text-gray-700">
                    {t('email_address')}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg ${errorMessages.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {errorMessages.email && (
                    <p className="text-red-500 text-sm">{errorMessages.email[0]}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label htmlFor="address" className="block text-gray-700">
                    {t('physical_address')} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg ${errorMessages.address ? 'border-red-500' : 'border-gray-300'
                      }`}
                    required
                  ></textarea>
                  {errorMessages.address && (
                    <p className="text-red-500 text-sm">{errorMessages.address[0]}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label htmlFor="registration_number" className="block text-gray-700">
                    {t('citizenship_pan_number')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="registration_number"
                    name="registration_number"
                    value={formData.registration_number}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg ${errorMessages.registration_number
                        ? 'border-red-500'
                        : 'border-gray-300'
                      }`}
                    required
                  />
                  {errorMessages.registration_number && (
                    <p className="text-red-500 text-sm">
                      {errorMessages.registration_number[0]}
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setFormVisible(false);
                      setEditingProducerId(null);
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                  >
                    {editingProducerId ? t('update_producer') : t('add_producer')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddProducer;
