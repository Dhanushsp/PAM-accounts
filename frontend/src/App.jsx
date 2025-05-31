import { useState } from "react";
import Login from "./pages/Login";
import Home from "./pages/Home";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  return token
    ? <Home token={token} />
    : <Login setToken={(t) => { localStorage.setItem("token", t); setToken(t); }} />;
}

export default App;
