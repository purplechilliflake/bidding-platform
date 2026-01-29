import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import './App.css';

// const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const BACKEND_URL = "https://bidding-platform-eqba.onrender.com/";
const socket = io(BACKEND_URL);

function App() {
  const [items, setItems] = useState([]);
  const [userId] = useState("User_" + Math.floor(Math.random() * 1000));
  const [flashId, setFlashId] = useState(null);

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
          return { ...item, currentBid: data.newBid, lastBidder: data.bidderId };
        }
        return item;
      }));
    });

    return () => socket.off();
  }, []);

  // Modified to take the total new bid amount
  const handleBid = (id, newTotalBid) => {
    socket.emit("BID_PLACED", { itemId: id, bidAmount: newTotalBid, userId });
  };

  return (
    <div className="app-container">
      <header className="main-header">
        <div className="header-left">
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
          <div className="balance-card">
            <span className="label">Balance Available</span>
            <span className="amount">$150,000</span>
          </div>

          <div className="profile-section">
            <div className="user-meta">
              <span className="pro-tag">{userId}</span>
              <span className="account-type">Pro Account</span>
            </div>
            <div className="avatar-circle">
              <i className="fa-solid fa-user"></i>
            </div>
          </div>
        </div>
      </header>

      <div className="dashboard">
      <div className="auction-grid">
  {Array.isArray(items) ? (
    items.map(item => (
      <AuctionCard 
        key={item.id} 
        item={item} 
        currentUser={{ id: userId }} 
        onBid={handleBid}
        isFlashing={flashId === item.id}
      />
    ))
  ) : (
    <p>Loading items or invalid data format...</p>
  )}
</div>
      </div>
    </div>
  );
}

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
  const isHighestBidder = item.lastBidder === currentUser.id;
  const isOutbid = !isHighestBidder && item.lastBidder !== 'System' && !isAuctionOver;

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
      {/* Timer removed from here */}
    </div>
    
    <p className="item-desc">{item.description || "Premium collector's item."}</p>

    {/* NEW: Container for Price and Timer */}
    <div className="bid-and-timer-row">
        <div className="current-bid-section">
            <p className="bid-label">Current Bid</p>
            <p className="bid-price">${item.currentBid.toLocaleString()}</p>
        </div>

        {/* Timer moved here */}
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