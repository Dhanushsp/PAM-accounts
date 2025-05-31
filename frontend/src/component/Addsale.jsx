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
    <div className="popup">
      <h2>Add Sale</h2>
      <input
        type="text"
        value={customerName}
        onChange={e => setCustomerName(e.target.value)}
        placeholder="Customer Name"
      />
      <ul>
        {filteredCustomers.map(c => (
          <li key={c._id} onClick={() => {
            setSelectedCustomer(c);
            setCustomerName(c.name);
            setCurrentCredit(c.credit);
          }}>
            {c.name}
          </li>
        ))}
      </ul>
      {selectedCustomer && (
        <>
          <p>Current Credit: ₹{currentCredit.toFixed(2)}</p>
          <label>
            Sale Type:
            <select value={saleType} onChange={e => setSaleType(e.target.value)}>
              <option value="kg">KG</option>
              <option value="pack">Pack</option>
            </select>
          </label>
          <Select
            isMulti
            options={products.map(p => ({
              value: p._id,
              label: p.productName,
              price: p.pricePerKg
            }))}
            onChange={handleProductChange}
          />
          {productDetails.map((item, index) => (
            <div key={item.productId}>
              <p>{item.productName}</p>
              <input
                type="number"
                value={item.quantity}
                onChange={e => handleQuantityChange(index, e.target.value)}
                placeholder="Quantity"
              />
              <input
                type="number"
                value={item.price}
                onChange={e => handlePriceChange(index, e.target.value)}
                placeholder="Price"
              />
            </div>
          ))}
          <p>Total Price: ₹{totalPrice.toFixed(2)}</p>
          <label>
            Payment Method:
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
              <option value="cash">Cash</option>
              <option value="online">Online Payment</option>
              <option value="credit">Credit</option>
            </select>
          </label>
          <input
            type="number"
            value={amountReceived}
            onChange={e => setAmountReceived(parseFloat(e.target.value) || 0)}
            placeholder="Amount Received"
          />
          <p>Updated Credit: ₹{updatedCredit.toFixed(2)}</p>
          <button onClick={handleSubmit}>Add Sale</button>
        </>
      )}
      <button onClick={onClose}>Close</button>
    </div>
  );
};

