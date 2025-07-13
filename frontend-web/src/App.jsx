import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  const handleLogout = () => {
    setToken(null);
  };

  if (!token) {
    return <Login setToken={setToken} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Main Content */}
      <main style={{ flex: 1, background: 'var(--color-bg)', minHeight: '100vh' }}>
        <Home token={token} onLogout={handleLogout} />
      </main>
    </div>
  );
}
