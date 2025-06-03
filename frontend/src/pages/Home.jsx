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
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-700 tracking-wide">
          PAM<span className="text-indigo-500">-Accounts</span>
        </h1>
        <button
          onClick={handleLogout}
          className="bg-gradient-to-br from-red-900 via-red-800 to-black text-white px-4 py-2 rounded-md shadow-sm transition"
        >
          Logout
        </button>
      </div>


      {/* Search & Sort */}
      <div className="mb-4 space-y-2">
        <input
          className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-blue-200"
          placeholder="🔍 Search by customer name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {['Recent', 'Oldest', 'Credit'].map((type) => (
            <button
              key={type}
              onClick={() => setSort(type.toLowerCase())}
              className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-100 transition text-sm shadow-sm"
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden divide-y">
        {customers.map((c) => (
          <div
            key={c._id}
            className="flex justify-between items-center px-4 py-3 cursor-pointer hover:bg-gray-100"
            onClick={() => fetchCustomerDetails(c._id)}
          >
            <div>
              <p className="text-base font-semibold text-gray-800">{c.name}</p>
              <p className="text-sm text-gray-500">
                {new Date(c.lastPurchase).toLocaleDateString()}
              </p>
            </div>
            <p className="text-gray-700 font-medium">₹{c.credit}</p>
          </div>
        ))}
      </div>

      {/* Bottom Action Buttons */}
      <div className="fixed bottom-4 left-0 w-full px-4">
        <div className="flex justify-between gap-3">
          <button
            onClick={() => setShowSalesPopup(true)}
            className="flex-1 bg-green-600 text-white py-2 rounded-md shadow hover:bg-indigo-700 transition"
          >
            + Sale
          </button>
          <button
            onClick={() => setShowProductPopup(true)}
            className="flex-1 bg-blue-600 text-white py-2 rounded-md shadow hover:bg-blue-700 transition"
          >
            + Product
          </button>
          <button
            onClick={() => setShowPopup(true)}
            className="flex-1 bg-indigo-600 text-white py-2 rounded-md shadow hover:bg-green-700 transition"
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
