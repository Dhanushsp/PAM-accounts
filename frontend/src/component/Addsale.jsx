import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';

export default function AddSale({ onClose }) {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [currentCredit, setCurrentCredit] = useState(0);
  const [saleType, setSaleType] = useState('kg');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productDetails, setProductDetails] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState(0);
  const [updatedCredit, setUpdatedCredit] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");

    // Fetch customers and products from the backend
    axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/customers`, {
      headers: { Authorization: token }
    })
      .then((res) => {
        console.log(res.data); // 👈 CHECK THIS IN CONSOLE
        setCustomers(res.data); // Make sure this is an array
      });

    axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products`, {
      headers: { Authorization: token }
    })
      .then(res => {
        console.log("Products from API:", res.data); // <== This should be an array of product objects
        setProducts(res.data);
      })
      .catch(err => console.error(err));

  }, []);



  useEffect(() => {
    // Filter customers based on input
    const filtered = customers.filter(c =>
      c.name.toLowerCase().includes(customerName.toLowerCase())
    );
    setFilteredCustomers(filtered);
  }, [customerName, customers]);

  useEffect(() => {
    // Calculate total price
    const total = productDetails.reduce((sum, item) => {
      return sum + (item.quantity * item.price);
    }, 0);
    setTotalPrice(total);
  }, [productDetails]);

  useEffect(() => {
    // Calculate updated credit
    const difference = totalPrice - amountReceived;
    const newCredit = selectedCustomer ? selectedCustomer.credit + difference : difference;
    setUpdatedCredit(newCredit);
  }, [amountReceived, totalPrice, selectedCustomer]);

  const handleProductChange = selectedOptions => {
    setSelectedProducts(selectedOptions);
    const details = selectedOptions.map(option => ({
      productId: option.value,
      productName: option.label,
      quantity: 0,
      price: option.price
    }));
    setProductDetails(details);
  };

  const handleQuantityChange = (index, value) => {
    const details = [...productDetails];
    details[index].quantity = parseFloat(value) || 0;
    setProductDetails(details);
  };

  const handlePriceChange = (index, value) => {
    const details = [...productDetails];
    details[index].price = parseFloat(value) || 0;
    setProductDetails(details);
  };

  const handleSubmit = () => {
    const saleData = {
      customerId: selectedCustomer._id,
      saleType,
      products: productDetails,
      totalPrice,
      paymentMethod,
      amountReceived,
      updatedCredit
    };

    const token = localStorage.getItem("token");

    axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/sales`, saleData, {
      headers: { Authorization: token }
    })
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
  <div className="bg-white w-full max-w-xl rounded-xl shadow-xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
    <div className="flex justify-between items-center">
      <h2 className="text-lg font-semibold text-gray-800">Add Sale</h2>
      <button onClick={onClose} className="text-gray-400 hover:text-black text-xl">&times;</button>
    </div>

    {/* Customer Search */}
    <input
      type="text"
      value={customerName}
      onChange={e => setCustomerName(e.target.value)}
      placeholder="Search Customer"
      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring"
    />
    {filteredCustomers.length > 0 && (
      <ul className="bg-white border rounded-lg shadow max-h-40 overflow-y-auto">
        {filteredCustomers.map(c => (
          <li
            key={c._id}
            onClick={() => {
              setSelectedCustomer(c);
              setCustomerName(c.name);
              setCurrentCredit(c.credit);
            }}
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
          >
            {c.name}
          </li>
        ))}
      </ul>
    )}

    {selectedCustomer && (
      <>
        <p className="text-sm text-gray-600">Current Credit: ₹{currentCredit.toFixed(2)}</p>

        <div className="space-y-4">
          {/* Sale Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Sale Type</label>
            <select
              value={saleType}
              onChange={e => setSaleType(e.target.value)}
              className="w-full mt-1 border rounded-lg"
            >
              <option value="kg">KG</option>
              <option value="pack">Pack</option>
            </select>
          </div>

          {/* Product Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Products</label>
            <Select
              isMulti
              options={products.map(p => ({
                value: p._id,
                label: p.productName,
                price: p.pricePerPack
              }))}
              onChange={handleProductChange}
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </div>

          {/* Product Inputs */}
          {productDetails.map((item, index) => (
            <div key={item.productId} className="p-4 bg-gray-50 rounded-lg space-y-2">
              <p className="text-gray-700 font-medium">{item.productName}</p>
              <input
                type="number"
                value={item.quantity}
                onChange={e => handleQuantityChange(index, e.target.value)}
                placeholder="Quantity"
                className="w-full px-3 py-2 border rounded"
              />
              <input
                type="number"
                value={item.price}
                onChange={e => handlePriceChange(index, e.target.value)}
                placeholder="Price"
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          ))}

          <p className="text-gray-800 font-semibold">Total Price: ₹{totalPrice.toFixed(2)}</p>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
              className="w-full border rounded-lg"
            >
              <option value="cash">Cash</option>
              <option value="online">Online Payment</option>
              <option value="credit">Credit</option>
            </select>
          </div>

          <input
            type="number"
            value={amountReceived}
            onChange={e => setAmountReceived(parseFloat(e.target.value) || 0)}
            placeholder="Amount Received"
            className="w-full px-4 py-2 border rounded"
          />

          <p className="text-sm text-gray-600">Updated Credit: ₹{updatedCredit.toFixed(2)}</p>

          <button
            onClick={handleSubmit}
            className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition"
          >
            Add Sale
          </button>
        </div>
      </>
    )}
  </div>
</div>


  );
};

