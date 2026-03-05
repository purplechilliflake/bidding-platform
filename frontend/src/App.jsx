import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import './styles/Variables.css';
import './styles/Header.css';
import './styles/AuctionCard.css';
import './styles/Auth.css';
import './styles/Seller.css';
import Login from "./Login";
import AuctionCard from './components/AuctionCard';
import SellerDashboard from './components/SellerDashboard';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
// const BACKEND_URL = "https://bidding-platform-eqba.onrender.com/items";
// const BACKEND_URL = "http://localhost:5050/";
const socket = io(BACKEND_URL);

function App() {
  const [items, setItems] = useState([]);
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user"))
  );
  const [flashId, setFlashId] = useState(null);
  const [balance, setBalance] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [view, setView] = useState('market');
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user) {
      setBalance(user.wallet || 0);
    }
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setBalance(0);
    setShowDropdown(false);
    setView('market');
  };

  useEffect(() => {
    axios.get(`${BACKEND_URL}items`)
      .then(res => {setItems(res.data);
    console.log(`${BACKEND_URL}items`);
  })
      .catch(err => console.error("Error:", err));

      socket.on("UPDATE_BID", (data) => {
        setItems(prev => prev.map(item => {
          if (item.id === data.itemId) {
            setFlashId(data.itemId);
            setTimeout(() => setFlashId(null), 800);
            return { ...item, currentBid: Number(data.newBid), lastBidder: data.bidderId };
          }
          return item;
        }));
      });
  
      socket.on("UPDATE_WALLET", (data) => {
        if (user && data.user.email === user.email) {
          setBalance(data.newBalance);
        }
      });

      socket.on("NEW_ITEM_ADDED", (newItem) => {
        const formattedItem = {
          ...newItem,
          currentBid: Number(newItem.currentBid),
          auctionEndTime: Number(newItem.auctionEndTime)
        };  
        setItems(prev => [formattedItem, ...prev]); 
      });
  
      return () => {
        socket.off("UPDATE_BID");
        socket.off("UPDATE_WALLET");
        socket.off("NEW_ITEM_ADDED");
        socket.off("error");
      };
    }, [user]);

  const handleBid = (id, newTotalBid) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    socket.emit("BID_PLACED", { itemId: id, bidAmount: newTotalBid, user: { email: user.email } });
  };

  return (
    <div className="app-container">
      {showLoginModal && (
        <Login 
          setUser={(userData) => {
            setUser(userData);
            setShowLoginModal(false);
          }} 
          onClose={() => setShowLoginModal(false)} 
        />
      )}

      <header className="main-header">
        <div className="header-left" onClick={() => setView('market')} style={{cursor: 'pointer'}}>
          <div className="logo-wrapper">
            <i className="fa-solid fa-coins"></i>
            <h1>PENNY<span>SOCIAL</span></h1>
          </div>

          <p className="tagline">
            <span className="status-dot"></span>
            Real-time bidding engine active.
          </p>

        </div>

        <div className="header-right">
          {user ? (
            <>
              <div className="balance-card">
                <span className="label">Balance Available</span>
                <span className="amount">${balance.toLocaleString()}</span>
              </div>
              <div className="profile-section" ref={dropdownRef}>
                <div className="user-meta">
                  <span className="pro-tag">{user.name || user.email}</span>
                  <span className="account-type">{user.role === 'seller' ? 'Seller Account' : 'Pro Bidder'}</span>
                </div>

                <div className="avatar-circle" onClick={() => setShowDropdown(!showDropdown)}>
                  {user.name ? user.name.charAt(0).toUpperCase() : <i className="fa-solid fa-user"></i>}
                </div>

                {showDropdown && (
                  <div className="dropdown-menu">
                    <div className="dropdown-header">
                      <div className="name-row">
                        <strong>{user.name}</strong>
                        <small className="role-tag">{user.role}</small>
                      </div>
                      <span className="user-email-text">{user.email}</span>
                    </div>
                    
                    <div className="dropdown-actions">
                      <button 
                        className="view-dashboard-btn" 
                        onClick={() => { 
                          setView('seller');
                          setShowDropdown(false); 
                        }}
                      >
                        Go to Seller Dashboard →
                      </button>
                    </div>

                    <hr />
                    
                    <button onClick={handleLogout} className="dropdown-item logout-red">
                      <i className="fa-solid fa-right-from-bracket"></i> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button className="login-trigger-btn" onClick={() => setShowLoginModal(true)}>
              Login
            </button>
          )}
        </div>
      </header>

      <main className="dashboard">
        {view === 'market' ? (
          <div className="auction-grid">
          {items.map(item => (
            <AuctionCard 
              key={item.id} 
              item={item} 
              currentUser={{ id: user?.email }} 
              onBid={handleBid}
              isFlashing={flashId === item.id}  
            />
          ))}
          </div>
          ) : (
            <SellerDashboard 
            user={user} 
            items={items.filter(i => i.seller === user.email)} 
            onBack={() => setView('market')} 
          />
        )}
      </main>
    </div>
  );
}

export default App;