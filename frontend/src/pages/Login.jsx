import { useState } from "react";
import axios from "axios";

export default function Login({ setToken }) {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");

    const BACKEND_URL = import.meta.env.VITE_API_BASE_URL;

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${BACKEND_URL}/api/login`, { mobile, password });
      setToken(res.data.token);
    } catch {
      alert("Login failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-4">
  <div className="w-full max-w-sm bg-white p-6 rounded-xl shadow">
    <h2 className="text-xl font-semibold text-gray-800 mb-4">Login</h2>
    <input
      className="w-full mb-3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
      placeholder="Mobile"
      value={mobile}
      onChange={e => setMobile(e.target.value)}
    />
    <input
      type="password"
      className="w-full mb-4 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
      placeholder="Password"
      value={password}
      onChange={e => setPassword(e.target.value)}
    />
    <button
      className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition"
      onClick={handleLogin}
    >
      Login
    </button>
  </div>
</div>

  );
}
