import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaHome, FaMapMarkerAlt } from 'react-icons/fa';
import { useCart } from '../context/CartContext';

export interface Delivery {
  cart: number;
  customer_name: string;
  phone_number: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude: number;
  longitude: number;
  id?: number;
  createdAt?: string;
  updatedAt?: string;
}

export function deliveryFromJson(json: any): Delivery {
  return {
    id: json.id ?? undefined,
    cart: json.cart,
    customer_name: json.customer_name,
    phone_number: json.phone_number,
    address: json.address,
    city: json.city,
    state: json.state,
    zip_code: json.zip_code,
    latitude: Number(json.latitude),
    longitude: Number(json.longitude),
    createdAt: json.created_at ?? undefined,
    updatedAt: json.updated_at ?? undefined,
  };
}

export function deliveryToJson(delivery: Delivery): any {
  return {
    cart: delivery.cart,
    customer_name: delivery.customer_name,
    phone_number: delivery.phone_number,
    address: delivery.address,
    city: delivery.city,
    state: delivery.state,
    zip_code: delivery.zip_code,
    latitude: delivery.latitude,
    longitude: delivery.longitude,
  };
}

interface CheckoutLocationState {
  delivery: Delivery;
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  console.log(delivery);
  const { cart: items, total } = useCart();

  useEffect(() => {
    const state = location.state as CheckoutLocationState | undefined;
    if (state?.delivery) {
      setDelivery(state.delivery);
    } else {
      console.log('No delivery data found in location state');
    }
  }, [location.state]);

  return (
    <div className="bg-white min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          <button onClick={() => navigate('/marketplace', { replace: true })}>
            <FaHome className="text-deep-orange text-xl" />
          </button>
          <h1 className="ml-4 font-bold text-black-87 text-lg">Checkout</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 flex flex-col">
        {delivery && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-5">
            <div className="flex items-center mb-3">
              <FaMapMarkerAlt className="text-orange-600" />
              <h2 className="ml-2 text-lg font-bold text-black-87">Delivery Details</h2>
            </div>
            <p className="text-md font-semibold">{delivery.customer_name}</p>
            <p className="text-sm mb-1">{delivery.phone_number}</p>
            <p className="text-sm mb-1">
              {delivery.address}, {delivery.city}
            </p>
            <p className="text-sm">
              {delivery.state} - {delivery.zip_code}
            </p>
          </div>
        )}

        <h2 className="text-lg font-bold text-black-87 mb-3">Order Items</h2>
        <div className="space-y-4 mb-5">
          {items.map(item => (
            <div
              key={item.id}
              className="flex items-center bg-white border border-gray-200 rounded-lg p-3"
            >
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-300 flex-shrink-0">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <div className="ml-4 flex-1">
                <div className="font-semibold text-black-87">
                  {item.name}
                </div>
                <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
                {(item.price > 0) && (
                  <div className="text-xs text-gray-700">
                    Unit Price: Rs.{item.price.toFixed(2)}
                  </div>
                )}
              </div>

              <div className="font-semibold">
                Rs.{(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-5">
          <h2 className="text-lg font-bold text-black-87 mb-3">Order Summary</h2>
          <div className="flex justify-between mb-1">
            <span>Subtotal</span>
            <span>Rs.{total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-black-87 text-lg">
            <span>Total</span>
            <span>Rs.{total.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={() =>
            delivery
              ? navigate('/payment', { state: { delivery, total } })
              : navigate('/delivery-details')
          }
          className="w-full py-4 bg-orange-500 text-black font-bold rounded-lg"
        >
          {delivery ? 'Proceed to Payment' : 'Add Delivery Details'}
        </button>
      </main>
    </div>
  );
};

export default Checkout;
