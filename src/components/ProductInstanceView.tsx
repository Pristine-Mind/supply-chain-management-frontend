import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

interface Product {
  id: number;
  name: string;
  description: string;
}

interface MarketplaceProduct {
  id: number;
  product: Product;
  listed_price: string;
  bid_end_date: string | null;
}

interface Bid {
  bid_amount: string;
  bid_date: string;
}

interface SenderDetails {
    username: string,
    id: number;
}

interface Message {
  message: string;
  sender: string;
  sender_details: SenderDetails;  
  timestamp: string;
}

const ProductInstanceView: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<MarketplaceProduct | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [bidAmount, setBidAmount] = useState('');
  const [userBids, setUserBids] = useState<number>(0);
  const [message, setMessage] = useState('');

  const fetchData = async () => {
    await fetchProduct();
    await fetchUserBids();
    await fetchMessages();
  };

  useEffect(() => {
    fetchData();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/v1/marketplace/${productId}/`);
      setProduct(response.data);
    } catch (error) {
      console.error('Error fetching product details', error);
    }
  };

  const fetchUserBids = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must be logged in to place a bid.');
      return;
    }
    try {
      const response = await axios.get(`http://localhost:8000/api/v1/bids/?product=${productId}`, { 
        headers: {
          Authorization: `Token ${token}`
        }
      });
      setBids(response.data.results);
      setUserBids(response.data.filter((bid: Bid) => bid).length);
    } catch (error) {
      console.error('Error fetching user bids', error);
    }
  };

  const fetchMessages = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must be logged in to place a bid.');
      return;
    }
    try {
      const response = await axios.get(`http://localhost:8000/api/v1/chats/?product=${productId}`,  { 
        headers: {
          Authorization: `Token ${token}`
        }
      });
      setMessages(response.data.results);
    } catch (error) {
      console.error('Error fetching product messages', error);
    }
  };

  const handleBidSubmit = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must be logged in to place a bid.');
      return;
    }

    try {
      await axios.post(
        'http://localhost:8000/api/v1/bids/',
        {
          product_id: productId,
          bid_amount: bidAmount,
        },
        {
          headers: {
            Authorization: `Token ${token}`
          }
        }
      );
      alert('Bid placed successfully');
      setBidAmount('');
      fetchData();
    } catch (error) {
      console.error('Error placing bid', error);
      alert('Failed to place bid');
    }
  };

  const handleMessageSubmit = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must be logged in to send a message.');
      return;
    }

    try {
      await axios.post(
        'http://localhost:8000/api/v1/chats/',
        {
          product_id: productId,
          message: message,
        },
        {
          headers: {
            Authorization: `Token ${token}`
          }
        }
      );
      alert('Message sent successfully');
      setMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message', error);
      alert('Failed to send message');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {product ? (
        <>
          <h2 className="text-3xl font-bold mb-6 text-gray-800">{product.product.name}</h2>
          <p className="text-gray-600 mb-4">{product.product.description}</p>
          <p className="text-gray-900 font-bold mb-4">Price: ${product.listed_price}</p>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="bg-white p-4 rounded-lg shadow-md w-full md:w-1/2">
              <h3 className="text-xl font-bold mb-2">Place a Bid</h3>
              <p className="text-gray-600 mb-2">You can bid up to 3 times. Current bids: {userBids}/3</p>
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder="Enter bid amount"
                className="border rounded-lg px-4 py-2 mb-4 w-full"
              />
              <button
                onClick={handleBidSubmit}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                disabled={userBids >= 3}
              >
                Place Bid
              </button>

              <div className="mt-6">
                <h4 className="font-semibold mb-2">Your Previous Bids</h4>
                {bids.length > 0 ? (
                  <ul className="list-disc list-inside">
                    {bids.map((bid, index) => (
                      <li key={index} className="mb-2">
                        <span className="font-semibold">Bid Amount:</span> ${bid.bid_amount}
                        <span className="ml-4 font-semibold">Date:</span> {new Date(bid.bid_date).toLocaleDateString()}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600">You haven't placed any bids yet.</p>
                )}
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md w-full md:w-1/2">
              <h3 className="text-xl font-bold mb-2">Send a Message</h3>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask a question about the product..."
                className="border rounded-lg px-4 py-2 mb-4 w-full"
              />
              <button
                onClick={handleMessageSubmit}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
              >
                Send Message
              </button>

              <div className="mt-6">
                <h4 className="font-semibold mb-2">Messages on this Product</h4>
                {messages.length > 0 ? (
                  <ul className="list-disc list-inside">
                    {messages.map((msg, index) => (
                      <li key={index} className="mb-2">
                        <span className="font-semibold">{msg.sender_details.username}:</span> {msg.message}
                        <span className="ml-4 text-sm text-gray-500">({new Date(msg.timestamp).toLocaleString()})</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600">No messages yet.</p>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <p>Loading product details...</p>
      )}
    </div>
  );
};

export default ProductInstanceView;
