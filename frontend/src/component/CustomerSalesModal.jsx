// components/CustomerSalesModal.jsx
import React from 'react';
import { FaEdit } from 'react-icons/fa';

const CustomerSalesModal = ({ customer, onClose, onEditSale, onRefresh }) => {
  if (!customer) return null;

  console.log('Customer data in modal:', customer);
  console.log('Customer sales:', customer.sales);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-xs sm:max-w-2xl rounded-2xl shadow-xl p-4 sm:p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-blue-700">Sales History: {customer.name}</h2>
          <div className="flex gap-2">
            {onRefresh && (
              <button 
                onClick={onRefresh} 
                className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                title="Refresh sales history"
              >
                ↻ Refresh
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-black text-2xl font-bold focus:outline-none" aria-label="Close">&times;</button>
          </div>
        </div>

        {customer.sales && customer.sales.length > 0 ? (
          <div className="space-y-4">
            {customer.sales
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((sale) => (
                <div key={sale._id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b pb-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500">
                      {sale.date ? new Date(sale.date).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Date not available'} - {sale.saleType.toUpperCase()}
                    </p>
                    <ul className="text-sm text-gray-700 list-disc list-inside">
                      {sale.products.map((product) => (
                        <li key={product._id}>
                          {product.productName} - Qty: {product.quantity}, Price: ₹{product.price}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-gray-600 mt-1">
                      Total: ₹{sale.totalPrice} | Received: ₹{sale.amountReceived} | Method: {sale.paymentMethod}
                    </p>
                  </div>
                  <button onClick={() => onEditSale(sale)} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-semibold mt-2 sm:mt-0">
                    <span>Edit</span>
                    <FaEdit />
                  </button>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-gray-600">No sales history available.</p>
        )}

        <div className="mt-4 text-right text-blue-700 font-bold">
          Current Credit: ₹{customer.credit}
        </div>
      </div>
    </div>
  );
};

export default CustomerSalesModal;
