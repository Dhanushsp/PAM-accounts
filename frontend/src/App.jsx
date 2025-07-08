import React from "react";
import { useState } from "react";
import Login from "./pages/Login";
import Home from "./pages/Home";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 p-2 sm:p-4 md:p-8 font-sans">
      {token
        ? <Home token={token} />
        : <Login setToken={(t) => { localStorage.setItem("token", t); setToken(t); }} />}
    </div>
  );
}

export default App;
