import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

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
}

const AddProducer: React.FC = () => {
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
      });
      setProducers(response.data.results);
      setTotalCount(response.data.count);
    } catch (error) {
      console.error('Error fetching producers', error);
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
        await axios.patch(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/producers/${editingProducerId}/`, formData);
        setSuccess('Producer updated successfully!');
        setEditingProducerId(null);
      } else {
        await axios.post(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/producers/`, formData);
        setSuccess('Producer added successfully!');
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
    } catch (error) {
      if (error.response && error.response.data) {
        setErrorMessages(error.response.data);
      } else {
        setErrorMessages({ general: ['Failed to add/update producer. Please try again later.'] });
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

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
        <h2 className="text-2xl font-bold mb-4 sm:mb-0">Producers List</h2>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search by name..."
          className="px-4 py-2 border rounded-lg w-full sm:w-1/3 mb-4 sm:mb-0"
        />
        <button
          onClick={() => {
            setFormVisible(true);
            setFormData({ name: '', contact: '', email: '', address: '', registration_number: '' });
            setEditingProducerId(null);
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg w-full sm:w-auto"
        >
          Add New Producer
        </button>
      </div>

      <div className="overflow-x-auto relative shadow-md sm:rounded-lg mb-8">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="py-3 px-6">Producer Name</th>
              <th scope="col" className="py-3 px-6">Contact</th>
              <th scope="col" className="py-3 px-6">Email</th>
              <th scope="col" className="py-3 px-6">Address</th>
              <th scope="col" className="py-3 px-6">Registration Number</th>
              <th scope="col" className="py-3 px-6">Actions</th>
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
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="py-4 px-6 text-center" colSpan={6}>No producers available.</td>
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
          Previous
        </button>
        <span>Page {Math.floor(offset / limit) + 1} of {totalPages}</span>
        <button
          disabled={offset + limit >= totalCount}
          onClick={() => handlePageChange(offset + limit)}
          className={`px-4 py-2 text-white ${offset + limit >= totalCount ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} rounded-lg`}
        >
          Next
        </button>
      </div>

      {formVisible && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="relative bg-white rounded-lg shadow-xl p-8 w-full max-w-lg z-20">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
                {editingProducerId ? 'Edit Producer' : 'Add New Producer'}
              </h3>
              <form onSubmit={handleSubmit}>
                {errorMessages.general && <p className="text-red-500 mb-4">{errorMessages.general[0]}</p>}

                <div className="mb-4">
                  <label htmlFor="name" className="block text-gray-700">
                    Producer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg ${
                      errorMessages.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errorMessages.name && (
                    <p className="text-red-500 text-sm">{errorMessages.name[0]}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label htmlFor="contact" className="block text-gray-700">
                    Contact Information <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="contact"
                    name="contact"
                    value={formData.contact}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg ${
                      errorMessages.contact ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errorMessages.contact && (
                    <p className="text-red-500 text-sm">{errorMessages.contact[0]}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label htmlFor="email" className="block text-gray-700">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg ${
                      errorMessages.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errorMessages.email && (
                    <p className="text-red-500 text-sm">{errorMessages.email[0]}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label htmlFor="address" className="block text-gray-700">
                    Physical Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg ${
                      errorMessages.address ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  ></textarea>
                  {errorMessages.address && (
                    <p className="text-red-500 text-sm">{errorMessages.address[0]}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label htmlFor="registration_number" className="block text-gray-700">
                    Registration Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="registration_number"
                    name="registration_number"
                    value={formData.registration_number}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg ${
                      errorMessages.registration_number
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
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                  >
                    {editingProducerId ? 'Update Producer' : 'Add Producer'}
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

