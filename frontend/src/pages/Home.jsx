import { useEffect, useState } from "react";
import axios from "axios";
import AddCustomerPopup from "../component/AddCustomerPopup";
import AddProductPopup from "../component/AddProductPopup";
import AddSale from "../component/Addsale";

export default function Home({ token }) {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");
  const [showPopup, setShowPopup] = useState(false);
  const [showProductPopup, setShowProductPopup] = useState(false);
  const [showSalesPopup, setShowSalesPopup] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchCustomers = async () => {
    const res = await axios.get(`${BACKEND_URL}/api/customers?search=${search}&sort=${sort}`, {
      headers: { Authorization: token },
    });
    setCustomers(res.data);
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, sort]);

  return (
    <div className="p-4 bg-white min-h-screen">
      <input
        className="w-full border p-2 mb-2"
        placeholder="Search by name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="flex gap-2 mb-4">
        <button onClick={() => setSort("recent")} className="border px-3 py-1">Recent</button>
        <button onClick={() => setSort("oldest")} className="border px-3 py-1">Oldest</button>
        <button onClick={() => setSort("credit")} className="border px-3 py-1">Credit</button>
      </div>

      <div>
        {customers.map(c => (
          <div key={c._id} className="flex justify-between items-center p-3 border-b">
            <div>
              <p className="font-bold">{c.name}</p>
              <p className="text-sm text-gray-500">{new Date(c.lastPurchase).toLocaleDateString()}</p>
            </div>
            <p className="font-semibold text-black">₹{c.credit}</p>
          </div>
        ))}
      </div>

      <div className="fixed bottom-4 left-0 w-full flex justify-around">
        <button onClick={()=> setShowSalesPopup(true)} className="bg-black text-white px-4 py-2 rounded">+ Sale</button>
        <button onClick={() => setShowProductPopup(true)} className="bg-black text-white px-4 py-2 rounded">+ Product</button>
        <button onClick={() => setShowPopup(true)} className="bg-gray-800 text-white px-4 py-2 rounded">+ Customer</button>
      </div>

      {showPopup && (
        <AddCustomerPopup
          token={token}
          onClose={() => setShowPopup(false)}
          onCustomerAdded={fetchCustomers}
        />
      )}

      {showProductPopup && (
        <AddProductPopup
          token={token}
          onClose={() => setShowProductPopup(false)}
        />
      )}

      {showSalesPopup && (
        <AddSale
          token={token}
          onClose={() => setShowSalesPopup(false)}
        />
      )}
    </div>
  );
}
