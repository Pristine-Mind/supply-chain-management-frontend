import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Producer {
  id: number;
  name: string;
  contact: string;
  email: string;
  address: string;
  registration_number: string;
}

const AddProducer: React.FC = () => {
  const [producers, setProducers] = useState<Producer[]>([]);
  const [filteredProducers, setFilteredProducers] = useState<Producer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '',
    address: '',
    registration_number: ''
  });
  const [formVisible, setFormVisible] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination States
  const [limit] = useState(10); 
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch producers with limit-offset pagination
  const fetchProducers = async (limit: number, offset: number) => {
    try {
      const response = await axios.get(`http://localhost:8000/api/v1/producers/?limit=${limit}&offset=${offset}`);
      setProducers(response.data.results);
      setFilteredProducers(response.data.results); 
      setTotalCount(response.data.count);
    } catch (error) {
      console.error('Error fetching producers', error);
    }
  };

  useEffect(() => {
    fetchProducers(limit, offset);
  }, [offset]);

  // Handle search input
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    const filtered = producers.filter((producer) =>
      producer.name.toLowerCase().includes(e.target.value.toLowerCase())
    );
    setFilteredProducers(filtered);
  };

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8000/api/v1/producers/', formData);
      setSuccess('Producer added successfully!');
      setError('');
      setFormData({
        name: '',
        contact: '',
        email: '',
        address: '',
        registration_number: ''
      });
      setFormVisible(false); 
      fetchProducers(limit, offset);
  
      setTimeout(() => {
        setSuccess('');
      }, 1000);
  
    } catch (error) {
      setError('Failed to add producer');
      setSuccess('');
  
      setTimeout(() => {
        setError('');
      }, 1000);
    }
  };
  

  // Handle page change for pagination
  const handlePageChange = (newOffset: number) => {
    setOffset(newOffset);
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Producers List</h2>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search by name..."
          className="px-4 py-2 border rounded-lg w-1/3"
        />
        <button
          onClick={() => setFormVisible(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
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
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducers.length > 0 ? (
              filteredProducers.map((producer) => (
                <tr key={producer.id}>
                  <td className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap">{producer.name}</td>
                  <td className="py-4 px-6">{producer.contact}</td>
                  <td className="py-4 px-6">{producer.email}</td>
                  <td className="py-4 px-6">{producer.address}</td>
                  <td className="py-4 px-6">{producer.registration_number}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="py-4 px-6 text-center" colSpan={5}>No producers available.</td>
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
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">Add New Producer</h3>
              <form onSubmit={handleSubmit}>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                {success && <p className="text-green-500 mb-4">{success}</p>}

                <div className="mb-4">
                  <label htmlFor="name" className="block text-gray-700">Producer Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="contact" className="block text-gray-700">Contact Information</label>
                  <input
                    type="text"
                    id="contact"
                    name="contact"
                    value={formData.contact}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="email" className="block text-gray-700">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="address" className="block text-gray-700">Physical Address</label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  ></textarea>
                </div>

                <div className="mb-4">
                  <label htmlFor="registration_number" className="block text-gray-700">Registration Number</label>
                  <input
                    type="text"
                    id="registration_number"
                    name="registration_number"
                    value={formData.registration_number}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setFormVisible(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                  >
                    Add Producer
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

