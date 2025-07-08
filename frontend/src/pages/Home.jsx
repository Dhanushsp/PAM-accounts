// Home.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AddCustomerPopup from '../component/AddCustomerPopup';
import AddProductPopup from '../component/AddProductPopup';
import AddSale from '../component/Addsale';
import CustomerSalesModal from '../component/CustomerSalesModal';

export default function Home({ token }) {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('recent');
  const [showPopup, setShowPopup] = useState(false);
  const [showProductPopup, setShowProductPopup] = useState(false);
  const [showSalesPopup, setShowSalesPopup] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const BACKEND_URL = import.meta.env.VITE_API_BASE_URL;

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/customers?search=${search}&sort=${sort}`, {
        headers: { Authorization: token },
      });
      setCustomers(res.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchCustomerDetails = async (customerId) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/customers/${customerId}`, {
        headers: { Authorization: token },
      });
      setSelectedCustomer(res.data);
    } catch (error) {
      console.error('Error fetching customer details:', error);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, sort]);

  return (
    <div className="p-2 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-200 min-h-screen relative">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-700 tracking-wide text-center sm:text-left">
          PAM<span className="text-blue-600">-Accounts</span>
        </h1>
        <button
          onClick={handleLogout}
          className="bg-gradient-to-br from-red-600 via-red-500 to-red-800 text-white px-4 py-2 rounded-lg shadow-md hover:scale-105 active:scale-95 transition"
        >
          Logout
        </button>
      </div>

      {/* Search & Sort */}
      <div className="mb-4 space-y-2">
        <input
          className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          placeholder="🔍 Search by customer name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
          {['Recent', 'Oldest', 'Credit'].map((type) => (
            <button
              key={type}
              onClick={() => setSort(type.toLowerCase())}
              className={`px-4 py-2 rounded-lg text-sm shadow-sm border transition font-medium ${sort === type.toLowerCase() ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-blue-100'}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-xl shadow divide-y overflow-hidden mb-24">
        {customers.length === 0 && (
          <div className="text-center text-gray-400 py-8">No customers found.</div>
        )}
        {customers.map((c) => (
          <div
            key={c._id}
            className="flex justify-between items-center px-4 py-3 cursor-pointer hover:bg-blue-50 active:bg-blue-100 transition"
            onClick={() => fetchCustomerDetails(c._id)}
          >
            <div>
              <p className="text-base font-semibold text-gray-800">{c.name}</p>
              <p className="text-xs text-gray-500">{new Date(c.lastPurchase).toLocaleDateString()}</p>
            </div>
            <p className="text-blue-700 font-bold text-lg">₹{c.credit}</p>
          </div>
        ))}
      </div>

      {/* Bottom Action Buttons */}
      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-blue-100 via-white to-transparent px-4 py-3 z-20 border-t border-blue-200">
        <div className="flex justify-between gap-2">
          <button
            onClick={() => setShowSalesPopup(true)}
            className="flex-1 bg-green-600 hover:bg-green-700 active:scale-95 text-white py-2 rounded-lg shadow font-semibold transition"
          >
            + Sale
          </button>
          <button
            onClick={() => setShowProductPopup(true)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white py-2 rounded-lg shadow font-semibold transition"
          >
            + Product
          </button>
          <button
            onClick={() => setShowPopup(true)}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white py-2 rounded-lg shadow font-semibold transition"
          >
            + Customer
          </button>
        </div>
      </div>

      {/* Popups */}
      {showPopup && (
        <AddCustomerPopup
          token={token}
          onClose={() => setShowPopup(false)}
          onCustomerAdded={fetchCustomers}
        />
      )}
      {showProductPopup && (
        <AddProductPopup token={token} onClose={() => setShowProductPopup(false)} />
      )}
      {showSalesPopup && <AddSale token={token} onClose={() => setShowSalesPopup(false)} />}
      {/* Customer Sales Modal */}
      {selectedCustomer && (
        <CustomerSalesModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onEditSale={(sale) => {
            // Implement edit functionality here
            console.log('Edit sale:', sale);
          }}
        />
      )}
    </div>
  );
}
