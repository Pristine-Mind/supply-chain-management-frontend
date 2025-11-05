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
      setDelivery(null);}
  }, [location.state]);

  const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
    <Navbar/>
    <div className="min-h-screen bg-neutral-50 flex items-start justify-center p-4 pt-24 md:pt-10">
      <div className="w-full max-w-lg min-h-[600px] card-elevated bg-white overflow-auto flex flex-col">
        <div className="p-6 space-y-6">
          {delivery ? (
            <div className="card-soft bg-accent-success-50 border border-accent-success-200">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-accent-success-100 rounded-full flex items-center justify-center">
                  <FaMapMarkerAlt className="text-accent-success-600 text-sm" />
                </div>
                <h2 className="ml-3 font-semibold text-gray-900 text-h3">Delivery Address</h2>
              </div>
              <div className="space-y-1 text-body">
                <p className="font-medium text-gray-900">{delivery.customer_name}</p>
                <p className="text-neutral-600">{delivery.phone_number}</p>
                <p className="text-neutral-600">{delivery.address}</p>
                <p className="text-neutral-600">{delivery.city}, {delivery.state} {delivery.zip_code}</p>
              </div>
              <button
                onClick={() => navigate('/delivery-details')}
                className="mt-3 text-body text-accent-success-700 font-medium hover:text-accent-success-800 transition-colors"
              >
                Change Address
              </button>
            </div>
          ) : (
            <div className="card-soft bg-primary-50 border border-primary-200">
              <div className="flex items-center mb-2">
                <FaMapMarkerAlt className="text-primary-600 mr-2" />
                <span className="font-semibold text-gray-900 text-h3">Delivery Address Required</span>
              </div>
              <p className="text-body text-neutral-600 mb-3">
                Please add your delivery address to continue
              </p>
              <button
                onClick={() => navigate('/delivery-details')}
                className="btn-secondary bg-primary-100 text-primary-700 hover:bg-primary-200"
              >
                Add Address
              </button>
            </div>
          )}

          {/* Order Items Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-accent-info-100 rounded-full flex items-center justify-center">
                  <FaShoppingBag className="text-accent-info-600 text-sm" />
                </div>
                <h2 className="ml-3 font-semibold text-gray-900 text-h3">Order Items</h2>
              </div>
              <span className="text-body text-neutral-500">{itemsCount} items</span>
            </div>

            <div className="space-y-3">
              {items.map(item => (
                <div
                  key={item.id}
                  className="flex items-center bg-neutral-50 rounded-lg p-3"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-200 flex-shrink-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-neutral-300 flex items-center justify-center">
                        <FaShoppingBag className="text-neutral-500 text-xs" />
                      </div>
                    )}
                  </div>

                  <div className="ml-3 flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate text-body">
                      {item.name}
                    </div>
                    <div className="flex items-center justify-between text-caption text-neutral-500 mt-1">
                      <span>Qty: {item.quantity}</span>
                      {item.price > 0 && (
                        <span>Rs. {item.price.toFixed(0)} each</span>
                      )}
                    </div>
                  </div>

                  <div className="text-body font-semibold text-gray-900 ml-2">
                    Rs. {(item.price * item.quantity).toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary Section */}
          <div className="card-soft bg-accent-info-50">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-accent-info-100 rounded-full flex items-center justify-center">
                <FaReceipt className="text-accent-info-600 text-sm" />
              </div>
              <h2 className="ml-3 font-semibold text-gray-900 text-h3">Order Summary</h2>
            </div>
            
            <div className="space-y-2 text-body">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal ({itemsCount} items)</span>
                <span>Rs. {subTotal?.toFixed(0) || total.toFixed(0)}</span>
              </div>
              {shipping !== undefined && shipping > 0 && (
                <div className="flex justify-between text-neutral-600">
                  <span>Delivery Fee</span>
                  <span>Rs. {shipping.toFixed(0)}</span>
                </div>
              )}
              <div className="border-t border-accent-info-200 pt-2 mt-2">
                <div className="flex justify-between font-semibold text-h3 text-gray-900">
                  <span>Total Amount</span>
                  <span>Rs. {total.toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="card-soft bg-accent-warning-50 border border-accent-warning-200">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-accent-warning-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="text-caption text-accent-warning-800">
                <p className="font-medium mb-1">Delivery Information:</p>
                <p>• Orders are typically delivered within 2-3 business days</p>
                <p>• You will receive a confirmation SMS once your order is confirmed</p>
              </div>
            </div>
          </div>

        </div>

        {/* Sticky Footer with CTA */}
        <div className="sticky bottom-0 bg-white border-t border-neutral-200 p-4">
          <button
            onClick={() =>
              delivery
                ? navigate('/payment', { state: { delivery, total } })
                : navigate('/delivery-details')
            }
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!delivery}
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
