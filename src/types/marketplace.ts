import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaHome, FaMapMarkerAlt } from 'react-icons/fa';
import { useCart } from '../context/CartContext';


export interface Delivery {
  id?: number;
  cartId: number;
  customerName: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  createdAt?: string;
  updatedAt?: string;
}

export function deliveryFromJson(json: any): Delivery {
  return {
    id: json.id ?? undefined,
    cartId: json.cart ?? -1,
    customerName: json.customer_name,
    phoneNumber: json.phone_number,
    address: json.address,
    city: json.city,
    state: json.state,
    zipCode: json.zip_code,
    latitude: json.latitude != null ? Number(json.latitude) : undefined,
    longitude: json.longitude != null ? Number(json.longitude) : undefined,
    createdAt: json.created_at ?? undefined,
    updatedAt: json.updated_at ?? undefined,
  };
}

export function deliveryToJson(delivery: Delivery): any {
  return {
    cart: delivery.cartId,
    customer_name: delivery.customerName,
    phone_number: delivery.phoneNumber,
    address: delivery.address,
    city: delivery.city,
    state: delivery.state,
    zip_code: delivery.zipCode,
    latitude: delivery.latitude,
    longitude: delivery.longitude,
  };
}

interface LocationState {
  delivery?: Delivery;
}

