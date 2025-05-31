import { useState } from "react";
import axios from "axios";

export default function Login({ setToken }) {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/login", { mobile, password });
      setToken(res.data.token);
    } catch {
      alert("Login failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-white p-4">
      <input className="border p-2 mb-2 w-full max-w-sm" placeholder="Mobile" value={mobile} onChange={e => setMobile(e.target.value)} />
      <input className="border p-2 mb-2 w-full max-w-sm" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
      <button className="bg-black text-white py-2 px-4 rounded w-full max-w-sm" onClick={handleLogin}>Login</button>
    </div>
  );
}
