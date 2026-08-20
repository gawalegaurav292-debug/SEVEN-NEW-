import React from 'react';
import { Order } from '../types';
import { Package } from 'lucide-react';
import { BackButton } from '../components/BackButton';

export const Orders: React.FC<{ orders: Order[] }> = ({ orders }) => {
  return (
    <div className="bg-gray-50 pb-24 pt-12 px-6 w-full">
      <div className="mb-6">
        <BackButton className="mb-4" />
        <h2 className="text-3xl font-light">Your Orders</h2>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Package size={48} strokeWidth={1} className="mb-4 opacity-50" />
          <p>No active orders</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
                <div>
                  <p className="font-semibold text-sm">{order.id}</p>
                  <p className="text-xs text-gray-400">{order.date}</p>
                </div>
                <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full uppercase tracking-wide">
                  {order.status}
                </span>
              </div>
              <div className="flex -space-x-3 mb-4 overflow-hidden py-2 pl-1">
                {order.items.map((item, i) => (
                   <img key={i} src={item.image} className="w-10 h-10 rounded-full border-2 border-white object-cover" alt={item.name} />
                ))}
              </div>
              <div className="flex justify-between items-center">
                 <p className="text-sm text-gray-500">{order.items.length} Items</p>
                 <p className="font-bold">${order.total}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};