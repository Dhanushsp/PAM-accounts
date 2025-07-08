// AddCustomerPopup.jsx
import { useState } from "react";
import axios from "axios";

export default function AddCustomerPopup({ token, onClose, onCustomerAdded }) {
  const [form, setForm] = useState({ name: '', contact: '', credit: '' });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/customers`,
        form,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: token,
          },
        }
      );
      alert(res.data.message || 'Customer added!');
      onCustomerAdded(); // Refresh customer list
      onClose(); // Close popup
    } catch (err) {
      console.error(err);
      alert('Failed to add customer.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white p-4 sm:p-6 rounded-2xl w-full max-w-xs sm:max-w-sm shadow-xl relative overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-400 hover:text-black text-2xl font-bold focus:outline-none"
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-xl mb-4 font-bold text-blue-700 text-center">Add Customer</h2>
        <input
          type="text"
          name="name"
          placeholder="Name"
          className="w-full mb-3 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-800 bg-gray-50"
          onChange={handleChange}
          value={form.name}
        />
        <input
          type="text"
          name="contact"
          placeholder="Contact"
          className="w-full mb-3 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-800 bg-gray-50"
          onChange={handleChange}
          value={form.contact}
        />
        <input
          type="number"
          name="credit"
          placeholder="Credit Amount"
          className="w-full mb-3 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-800 bg-gray-50"
          onChange={handleChange}
          value={form.credit}
        />
        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg mt-2 transition active:scale-95"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
