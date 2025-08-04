import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaMapMarkerAlt, FaShoppingBag, FaReceipt } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import Navbar from './Navbar';
import Footer from './Footer';

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
  const { cart: items, total, subTotal, shipping } = useCart();

  useEffect(() => {
    const state = location.state as CheckoutLocationState | undefined;
    if (state?.delivery) {
      setDelivery(state.delivery);
    } else {
      console.log('No delivery data found in location state');
    }
  }, [location.state]);

  const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
    <Navbar/>
    <div className="min-h-screen bg-gray-50 flex items-start justify-center p-4 pt-24 md:pt-10">
      <div className="w-full max-w-lg min-h-[600px] bg-white shadow-lg rounded-2xl overflow-auto flex flex-col">
        <div className="p-6 space-y-6">
          {delivery ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <FaMapMarkerAlt className="text-green-600 text-sm" />
                </div>
                <h2 className="ml-3 font-semibold text-gray-900">Delivery Address</h2>
              </div>
              <div className="space-y-1 text-sm">
                <p className="font-medium text-gray-900">{delivery.customer_name}</p>
                <p className="text-gray-600">{delivery.phone_number}</p>
                <p className="text-gray-600">{delivery.address}</p>
                <p className="text-gray-600">{delivery.city}, {delivery.state} {delivery.zip_code}</p>
              </div>
              <button
                onClick={() => navigate('/delivery-details')}
                className="mt-3 text-sm text-green-700 font-medium hover:text-green-800 transition-colors"
              >
                Change Address
              </button>
            </div>
          ) : (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-center mb-2">
                <FaMapMarkerAlt className="text-orange-600 mr-2" />
                <span className="font-semibold text-gray-900">Delivery Address Required</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Please add your delivery address to continue
              </p>
              <button
                onClick={() => navigate('/delivery-details')}
                className="text-sm bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg font-medium hover:bg-orange-200 transition-colors"
              >
                Add Address
              </button>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <FaShoppingBag className="text-blue-600 text-sm" />
                </div>
                <h2 className="ml-3 font-semibold text-gray-900">Order Items</h2>
              </div>
              <span className="text-sm text-gray-500">{itemsCount} items</span>
            </div>

            <div className="space-y-3">
              {items.map(item => (
                <div
                  key={item.id}
                  className="flex items-center bg-gray-50 rounded-lg p-3"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                        <FaShoppingBag className="text-gray-500 text-xs" />
                      </div>
                    )}
                  </div>

                  <div className="ml-3 flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate text-sm">
                      {item.name}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                      <span>Qty: {item.quantity}</span>
                      {item.price > 0 && (
                        <span>Rs. {item.price.toFixed(0)} each</span>
                      )}
                    </div>
                  </div>

                  <div className="text-sm font-semibold text-gray-900 ml-2">
                    Rs. {(item.price * item.quantity).toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <FaReceipt className="text-blue-600 text-sm" />
              </div>
              <h2 className="ml-3 font-semibold text-gray-900">Order Summary</h2>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({itemsCount} items)</span>
                <span>Rs. {subTotal?.toFixed(0) || total.toFixed(0)}</span>
              </div>
              {shipping !== undefined && shipping > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span>Rs. {shipping.toFixed(0)}</span>
                </div>
              )}
              <div className="border-t border-blue-200 pt-2 mt-2">
                <div className="flex justify-between font-semibold text-base text-gray-900">
                  <span>Total Amount</span>
                  <span>Rs. {total.toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="text-xs text-yellow-800">
                <p className="font-medium mb-1">Delivery Information:</p>
                <p>• Orders are typically delivered within 2-3 business days</p>
                <p>• You will receive a confirmation SMS once your order is confirmed</p>
              </div>
            </div>
          </div>

        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <button
            onClick={() =>
              delivery
                ? navigate('/payment', { state: { delivery, total } })
                : navigate('/delivery-details')
            }
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-sm"
          >
            {delivery 
              ? `Proceed to Payment • Rs. ${total.toFixed(0)}` 
              : 'Add Delivery Details First'
            }
          </button>
        </div>
      </div>
    </div>
    <Footer/>
    </> 
  );
};

export default Checkout;
