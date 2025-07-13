import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';

export default function AddSale({ onClose, onSaleAdded, onSetSortToRecent }) {
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
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Update: Helper to get price based on sale type
  const getProductPrice = (product, type) => {
    if (type === 'kg') return product.pricePerKg;
    return product.pricePerPack;
  };

  // Update: When products are fetched, keep both pricePerKg and pricePerPack
  useEffect(() => {
    const token = localStorage.getItem("token");

    axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/customers`, {
      headers: { Authorization: token }
    })
      .then((res) => {
        setCustomers(res.data);
      });

    axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products`, {
      headers: { Authorization: token }
    })
      .then(res => {
        setProducts(res.data);
      })
      .catch(err => console.error(err));
  }, []);

  // Update: When saleType changes, update all productDetails prices
  useEffect(() => {
    setProductDetails(prevDetails => prevDetails.map(item => {
      const product = products.find(p => p._id === item.productId);
      if (!product) return item;
      return {
        ...item,
        price: getProductPrice(product, saleType)
      };
    }));
    // eslint-disable-next-line
  }, [saleType]);

  // Update: When products are selected, auto-fill price based on saleType
  const handleProductChange = selectedOptions => {
    setSelectedProducts(selectedOptions);
    const details = selectedOptions.map(option => {
      const product = products.find(p => p._id === option.value);
      return {
        productId: option.value,
        productName: option.label,
        quantity: 0,
        price: product ? getProductPrice(product, saleType) : 0
      };
    });
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

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      setError('Please select a customer');
      return;
    }
    
    if (productDetails.length === 0) {
      setError('Please select at least one product');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const saleData = {
        customerId: selectedCustomer._id,
        saleType,
        products: productDetails,
        totalPrice,
        paymentMethod,
        amountReceived,
        updatedCredit,
        date: new Date(saleDate)
      };

      const token = localStorage.getItem("token");

      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/sales`, saleData, {
        headers: { Authorization: token }
      });

      alert('Sale added successfully!');
      onClose();
      // Set sort to recent and refresh the customer list
      if (onSetSortToRecent) {
        onSetSortToRecent();
      }
      // Add a small delay to ensure sort state is updated before fetching
      setTimeout(() => {
      if (onSaleAdded) {
        onSaleAdded();
      }
      }, 100);
    } catch (err) {
      console.error('Error adding sale:', err);
      setError(err.response?.data?.error || 'Failed to add sale. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ensure total price is always quantity * price for each product
  useEffect(() => {
    const total = productDetails.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);
    }, 0);
    setTotalPrice(total);
  }, [productDetails]);

  // Restore customer filtering for auto-suggest
  useEffect(() => {
    const filtered = customers.filter(c =>
      c.name.toLowerCase().includes(customerName.toLowerCase())
    );
    setFilteredCustomers(filtered);
  }, [customerName, customers]);

  // Correctly calculate updatedCredit
  useEffect(() => {
    if (selectedCustomer) {
      setUpdatedCredit(
        parseFloat(selectedCustomer.credit) + (parseFloat(totalPrice) - parseFloat(amountReceived || 0))
      );
    } else {
      setUpdatedCredit(totalPrice - amountReceived);
    }
  }, [selectedCustomer, totalPrice, amountReceived]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-xs sm:max-w-lg rounded-2xl p-4 sm:p-6 space-y-6 max-h-[90vh] overflow-y-auto relative">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold text-blue-700">Add Sale</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black text-2xl font-bold focus:outline-none" aria-label="Close">&times;</button>
        </div>
        {/* Customer Search */}
        <input
          type="text"
          value={customerName}
          onChange={e => setCustomerName(e.target.value)}
          placeholder="Search Customer"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 mb-2"
        />
        {filteredCustomers.length > 0 && (
          <ul className="bg-white border rounded-lg max-h-40 overflow-y-auto mb-2">
            {filteredCustomers.map(c => (
              <li
                key={c._id}
                onClick={() => {
                  setSelectedCustomer(c);
                  setCustomerName(c.name);
                  setCurrentCredit(c.credit);
                }}
                className="px-4 py-2 hover:bg-blue-50 cursor-pointer rounded"
              >
                {c.name}
              </li>
            ))}
          </ul>
        )}
        {selectedCustomer && (
          <>
            <p className="text-sm text-gray-600 mb-2">Current Credit: ₹{currentCredit.toFixed(2)}</p>
            <div className="space-y-4">
              {/* Sale Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Sale Date</label>
                <input
                  type="date"
                  value={saleDate}
                  onChange={e => setSaleDate(e.target.value)}
                  className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
                />
              </div>
              
              {/* Sale Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Sale Type</label>
                <select
                  value={saleType}
                  onChange={e => setSaleType(e.target.value)}
                  className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
                >
                  <option value="kg">KG</option>
                  <option value="pack">Pack</option>
                </select>
              </div>
              {/* Product Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Products</label>
                <div className="rounded-lg border border-gray-300">
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
              </div>
              {/* Product Inputs */}
              {productDetails.map((item, index) => (
                <div key={item.productId} className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <p className="text-gray-700 font-medium">{item.productName}</p>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={e => handleQuantityChange(index, e.target.value)}
                    placeholder="Quantity"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                  />
                  <input
                    type="number"
                    value={item.price}
                    onChange={e => handlePriceChange(index, e.target.value)}
                    placeholder="Price"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
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
              
              {error && <div className="text-red-500 text-sm text-center">{error}</div>}
              
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded-lg transition active:scale-95"
              >
                {isSubmitting ? 'Adding Sale...' : 'Add Sale'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

