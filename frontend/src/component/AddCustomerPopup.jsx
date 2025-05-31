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
      <div className="bg-gray-900 p-6 rounded-xl w-96 shadow-lg relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-400 hover:text-white text-xl"
        >
          &times;
        </button>
        <h2 className="text-xl mb-4 font-semibold text-white">Add Customer</h2>
        <input
          type="text"
          name="name"
          placeholder="Name"
          className="w-full mb-3 p-2 rounded bg-gray-800 text-white"
          onChange={handleChange}
          value={form.name}
        />
        <input
          type="text"
          name="contact"
          placeholder="Contact"
          className="w-full mb-3 p-2 rounded bg-gray-800 text-white"
          onChange={handleChange}
          value={form.contact}
        />
        <input
          type="number"
          name="credit"
          placeholder="Credit Amount"
          className="w-full mb-3 p-2 rounded bg-gray-800 text-white"
          onChange={handleChange}
          value={form.credit}
        />
        <button
          onClick={handleSubmit}
          className="w-full bg-gradient-to-r from-white via-gray-300 to-gray-400 text-black font-semibold py-2 rounded-xl hover:opacity-90"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
