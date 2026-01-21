import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, ShoppingBag, Receipt } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCoupon } from '../hooks/useCoupon';
import { AppliedCoupon } from '../types/coupon';
import CouponInput from './CouponInput';
import ProductDeliverabilityCard from './ProductDeliverabilityCard';
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
  const { appliedCoupon, applyCoupon, removeCoupon } = useCoupon();
  const [displayTotal, setDisplayTotal] = useState(0);
  const [cartId, setCartId] = useState<number | null>(null);

  useEffect(() => {
    const state = location.state as CheckoutLocationState | undefined;
    if (state?.delivery) {
      setDelivery(state.delivery);
      setCartId(state.delivery.cart);
    } else {
      setDelivery(null);
      setCartId(null);
    }
  }, [location.state]);

  // Update display total based on applied coupon
  useEffect(() => {
    if (appliedCoupon) {
      setDisplayTotal(appliedCoupon.finalAmount);
    } else {
      setDisplayTotal(total);
    }
  }, [appliedCoupon, total]);

  const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
    <Navbar/>
    <div className="min-h-screen bg-neutral-50 flex items-start justify-center p-4 pt-24 md:pt-10">
      <div className="w-full max-w-lg min-h-[600px] bg-white rounded-xl border border-neutral-200 shadow-sm overflow-auto flex flex-col">
        <div className="p-6 space-y-6">
          {delivery ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <MapPin className="text-green-600" size={16} />
                </div>
                <span className="font-semibold text-gray-900 text-lg">Delivery Address</span>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-gray-900">{delivery.customer_name}</p>
                <p className="text-neutral-600">{delivery.phone_number}</p>
                <p className="text-neutral-600">{delivery.address}</p>
                <p className="text-neutral-600">{delivery.city}, {delivery.state} {delivery.zip_code}</p>
              </div>
              <button
                onClick={() => navigate('/delivery-details')}
                className="mt-3 text-green-700 font-medium hover:text-green-800 transition-colors"
              >
                Change Address
              </button>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center mb-3">
                <MapPin className="text-blue-600 mr-3" size={20} />
                <span className="font-semibold text-gray-900 text-lg">Delivery Address Required</span>
              </div>
              <p className="text-neutral-600 mb-4">
                Please add your delivery address to continue
              </p>
              <button
                onClick={() => navigate('/delivery-details')}
                className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors font-medium"
              >
                Add Address
              </button>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <ShoppingBag className="text-blue-600" size={16} />
                </div>
                <h2 className="ml-3 font-semibold text-gray-900 text-lg">Order Items</h2>
              </div>
              <span className="text-neutral-500">{itemsCount} items</span>
            </div>

            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="space-y-2">
                  <div
                    className="flex items-center bg-neutral-50 rounded-xl p-4 border border-neutral-100"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-neutral-200 flex-shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-neutral-300 flex items-center justify-center">
                          <ShoppingBag className="text-neutral-500" size={16} />
                        </div>
                      )}
                    </div>

                    <div className="ml-4 flex-1 min-w-0">
                      <div className="font-medium text-gray-900 line-clamp-2">
                        {item.name}
                      </div>
                      <div className="flex items-center justify-between text-sm text-neutral-500 mt-1">
                        <span>Qty: {item.quantity}</span>
                        {item.price > 0 && (
                          <span>Rs. {item.price.toLocaleString()} each</span>
                        )}
                      </div>
                    </div>

                    <div className="text-lg font-semibold text-gray-900 ml-4">
                      Rs. {(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>

                  {/* Deliverability Info */}
                  <ProductDeliverabilityCard
                    productId={item.product.id}
                    productName={item.name}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Coupon Section */}
          {cartId && (
            <CouponInput
              cartId={cartId}
              cartTotal={total}
              appliedCoupon={appliedCoupon}
              onCouponApplied={(coupon: AppliedCoupon) => {
                // Update display total when coupon is applied
                setDisplayTotal(coupon.finalAmount);
              }}
              onCouponRemoved={() => {
                removeCoupon();
                setDisplayTotal(total);
              }}
            />
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Receipt className="text-blue-600" size={16} />
              </div>
              <h2 className="ml-3 font-semibold text-gray-900 text-lg">Order Summary</h2>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal ({itemsCount} items)</span>
                <span>Rs. {(subTotal || total).toLocaleString()}</span>
              </div>
              {shipping !== undefined && shipping > 0 && (
                <div className="flex justify-between text-neutral-600">
                  <span>Delivery Fee</span>
                  <span>Rs. {shipping.toLocaleString()}</span>
                </div>
              )}
              {appliedCoupon && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Coupon Discount ({appliedCoupon.code})</span>
                  <span className="text-lg">-Rs. {appliedCoupon.discountAmount.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}</span>
                </div>
              )}
              <div className={`border-t ${appliedCoupon ? 'border-green-200' : 'border-blue-200'} pt-3 mt-3`}>
                <div className={`flex justify-between font-bold text-lg ${appliedCoupon ? 'text-green-900' : 'text-gray-900'}`}>
                  <span>Total Amount</span>
                  <span>Rs. {displayTotal.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="text-sm text-orange-800">
                <p className="font-medium mb-2">Delivery Information:</p>
                <p className="mb-1">• Orders are typically delivered within 2-3 business days</p>
                <p>• You will receive a confirmation SMS once your order is confirmed</p>
              </div>
            </div>
          </div>

        </div>

        <div className="sticky bottom-0 bg-white border-t border-neutral-200 p-4">
          <button
            onClick={() =>
              delivery
                ? navigate('/payment', { 
                    state: { 
                      delivery, 
                      total: displayTotal,
                      originalTotal: total,
                      couponCode: appliedCoupon?.code,
                      discountAmount: appliedCoupon?.discountAmount,
                    } 
                  })
                : navigate('/delivery-details')
            }
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              delivery
                ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow-md'
                : 'bg-neutral-100 text-neutral-500 cursor-not-allowed'
            }`}
            disabled={!delivery}
          >
            {delivery 
              ? `Proceed to Payment • Rs. ${displayTotal.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}` 
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
