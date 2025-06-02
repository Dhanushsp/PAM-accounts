// components/CustomerSalesModal.jsx
import React from 'react';
import { FaEdit } from 'react-icons/fa';

const CustomerSalesModal = ({ customer, onClose, onEditSale }) => {
  if (!customer) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Sales History: {customer.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-lg font-bold">&times;</button>
        </div>

        {customer.sales && customer.sales.length > 0 ? (
          <div className="space-y-4">
            {customer.sales
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((sale) => (
                <div key={sale._id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="text-sm text-gray-600">
                      {new Date(sale.date).toLocaleDateString()} - {sale.saleType.toUpperCase()}
                    </p>
                    <ul className="text-sm text-gray-700 list-disc list-inside">
                      {sale.products.map((product) => (
                        <li key={product._id}>
                          {product.productName} - Qty: {product.quantity}, Price: ₹{product.price}
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm text-gray-700">
                      Total: ₹{sale.totalPrice} | Received: ₹{sale.amountReceived} | Method: {sale.paymentMethod}
                    </p>
                  </div>
                  <button onClick={() => onEditSale(sale)} className="text-blue-600 hover:text-blue-800">
                    <FaEdit />
                  </button>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-gray-600">No sales history available.</p>
        )}

        <div className="mt-4 text-right text-gray-800 font-semibold">
          Current Credit: ₹{customer.credit}
        </div>
      </div>
    </div>
  );
};

export default CustomerSalesModal;
