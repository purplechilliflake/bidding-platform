import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import './App.css';
import Login from "./Login";

// const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
// const BACKEND_URL = "https://bidding-platform-eqba.onrender.com/";
const BACKEND_URL = "http://localhost:5050/";
const socket = io(BACKEND_URL);

function App() {
  const [items, setItems] = useState([]);
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user"))
  );
  // const email = user?.email;
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
                    <div className="dropdown-header clickable-header" onClick={() => { setView('seller');
                  setShowDropdown(false); }}>
                       <strong>{user.name}</strong>
                       <span>{user.email}</span>
                       <small className="role-tag">{user.role}</small>
                    <p className="view-link">Go to Seller Dashboard →</p>
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

  const SellerDashboard = ({ user, items, onBack }) => {
  const [form, setForm] = useState({ title: "", startPrice: "", days: 0, hours: 0, mins: 0, description: "" });

  const handlePost = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BACKEND_URL}items`, { ...form, sellerEmail: user.email });
      alert("Item Posted!");
      setForm({ title: "", startPrice: "", days: 0, hours: 0, mins: 0, description: "" });
      onBack(); 
    } catch (err) {
      alert("Error posting item");
    }
  };

  return (
    <div className="seller-container">
      <div className="seller-header">
        <h2>Seller Control Center</h2>
        <button className="btn-secondary" onClick={onBack}>← Back to Marketplace</button>
      </div>

      <div className="seller-layout">
        {/* Left Side: Form */}
        <section className="seller-form-card">
          <h3>List New Product</h3>
          <form onSubmit={handlePost} className="auth-form">
            <label>Product Title</label>
            <input required onChange={e => setForm({...form, title: e.target.value})} />
            
            <label>Starting Price ($)</label>
            <input type="number" required onChange={e => setForm({...form, startPrice: e.target.value})} />

            <label>Duration</label>
            <div className="duration-inputs">
              <div><input type="number" placeholder="Days" value={form.days} onChange={e => setForm({ ...form, days: e.target.value })} /> <small>Days</small></div>
              <div><input type="number" placeholder="Hrs" value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} /> <small>Hrs</small></div>
              <div><input type="number" placeholder="Mins" value={form.mins} onChange={e => setForm({ ...form, mins: e.target.value })} /> <small>Mins</small></div>
            </div>

            <label>Description</label>
            <textarea onChange={e => setForm({...form, description: e.target.value})} />
            
            <button type="submit" className="btn-auth-submit">Create Auction</button>
          </form>
        </section>

        {/* Right Side: My Active Items Tracking */}
        <section className="my-items-list">
          <h3>Your Active Auctions</h3>
          {items.length === 0 ? <p>No items posted yet.</p> : (
            items.map(item => (
              <div key={item.id} className="seller-item-row">
                <div className="item-info">
                  <strong>{item.title}</strong>
                  <span>Current Bid: ${Number(item.currentBid).toLocaleString()}</span>
                </div>
                <div className="item-status">
                  <span className="bidder-email">Leader: {item.lastBidder}</span>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
};

const AuctionCard = ({ item, currentUser, onBid, isFlashing }) => {
  const [timeLeft, setTimeLeft] = useState(Number(item.auctionEndTime) - Date.now());
  const [customAmount, setCustomAmount] = useState('');
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(Number(item.auctionEndTime) - Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [item.auctionEndTime]);

  const isAuctionOver = timeLeft <= 0;
  const isHighestBidder = currentUser?.id && item.lastBidder === currentUser.id;
  const isOutbid = currentUser?.id && !isHighestBidder && item.lastBidder !== 'System' && !isAuctionOver;

  const formatTime = (ms) => {
    if (ms <= 0) return "0:00";
  
    const s = Math.floor((ms / 1000) % 60);
    const m = Math.floor((ms / (1000 * 60)) % 60);
    const h = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const d = Math.floor(ms / (1000 * 60 * 60 * 24));
  
    const pad = (num) => num.toString().padStart(2, '0');
  
    if (d > 0) {
      return `${d}d ${h}:${pad(m)}:${pad(s)}`;
    } else if (h > 0) {
      return `${h}:${pad(m)}:${pad(s)}`;
    } else {
      return `${m}:${pad(s)}`;
    }
  };

  const handleCustomBid = (e) => {
    e.preventDefault();
    const val = parseFloat(customAmount);
    if (val) {
      onBid(item.id, val + item.currentBid);
      setCustomAmount('');
    } else {
      alert("Enter a positive value.");
    }
  };

  return (
    <div className={`auction-card ${isAuctionOver ? 'is-over' : ''}`}>
    <div className="badge-container">
      {isHighestBidder && !isAuctionOver && <span className="badge bg-green">WINNING</span>}
      {isOutbid && <span className="badge bg-red">OUTBID</span>}
      {isAuctionOver && <span className="badge bg-slate">CLOSED</span>}
    </div> 

    <div className="img-wrapper">
      <img src={item.imageUrl || `https://picsum.photos/seed/${item.id}/400/300`} alt={item.title} className="item-img" />
    </div>

    <div className={`card-body ${isFlashing ? 'flash-effect' : ''}`}>
      <div className="card-header">
        <h3 className="item-title">{item.title}</h3>
      </div>
      
      <p className="item-desc">{item.description || "Premium collector's item."}</p>

      {/* Container for Price and Timer */}
      <div className="bid-and-timer-row">
          <div className="current-bid-section">
              <p className="bid-label">Current Bid</p>
              <p className="bid-price">${item.currentBid.toLocaleString()}</p>
          </div>

          <div className={`timer-container-new ${timeLeft < 60000 ? 'timer-urgent' : 'timer-normal'}`}>
              <span style={{ fontSize: '0.9rem' }}>⏱</span>
              <span>{formatTime(timeLeft)}</span>
          </div>
      </div>

      {/* Bidding Controls */}
      {!isAuctionOver && !isHighestBidder && (
        <div className="bid-controls">
          <div className="preset-grid">
            {[5, 10, 20, 50].map(increment => (
              <button 
                key={increment} 
                className="btn-preset"
                onClick={() => onBid(item.id, item.currentBid + increment)}
              >
                ${increment}
              </button>
            ))}
          </div>
          
          <form className="custom-bid-form" onSubmit={handleCustomBid}>
            <div className="input-wrapper">
              <input 
                type="number" 
                placeholder="Enter Amount" 
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="custom-input"
              />
            </div>
            <button type="submit" className="btn-bid-submit">Bid</button>
          </form>
        </div>
      )}

      <div className="card-footer-status">
          {isAuctionOver ? (
              <button className="btn btn-closed" disabled>Auction Closed</button>
          ) : isHighestBidder ? (
              <button className="btn btn-lead" disabled>You are leading</button>
          ) : null}
      </div>
    </div>
  </div>
  );
};

export default App;