// AddProductPopup.jsx
import { useState, useEffect } from "react";
import axios from "axios";

export default function AddProductPopup({ token, onClose }) {
  const [form, setForm] = useState({
    productName: '',
    pricePerPack: '',
    kgsPerPack: '',
    pricePerKg: ''
  });

  useEffect(() => {
    const { pricePerPack, kgsPerPack } = form;
    if (pricePerPack && kgsPerPack && !isNaN(pricePerPack) && !isNaN(kgsPerPack)) {
      const perKg = parseFloat(pricePerPack) / parseFloat(kgsPerPack);
      setForm((prev) => ({
        ...prev,
        pricePerKg: perKg.toFixed(2)
      }));
    }
  }, [form.pricePerPack, form.kgsPerPack]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/addproducts`,
        form,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: token
          }
        }
      );
      alert(res.data.message || "Product added!");
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to add product.");
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
        <h2 className="text-xl mb-4 font-bold text-blue-700 text-center">Add Product</h2>
        <input
          type="text"
          name="productName"
          placeholder="Product Name"
          className="w-full mb-3 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-800 bg-gray-50"
          onChange={handleChange}
          value={form.productName}
        />
        <input
          type="number"
          name="pricePerPack"
          placeholder="Price per Pack"
          className="w-full mb-3 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-800 bg-gray-50"
          onChange={handleChange}
          value={form.pricePerPack}
        />
        <input
          type="number"
          name="kgsPerPack"
          placeholder="Kgs per Pack"
          className="w-full mb-3 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-800 bg-gray-50"
          onChange={handleChange}
          value={form.kgsPerPack}
        />
        <input
          type="number"
          name="pricePerKg"
          placeholder="Price per Kg"
          className="w-full mb-3 px-4 py-2 rounded-lg border border-gray-200 bg-gray-100 text-gray-500"
          value={form.pricePerKg}
          readOnly
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
