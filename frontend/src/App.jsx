import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import './App.css';

const socket = io("http://localhost:5050");

function App() {
  const [items, setItems] = useState([]);
  const [userId] = useState("User_" + Math.floor(Math.random() * 1000));
  const [flashId, setFlashId] = useState(null);

  useEffect(() => {
    axios.get("http://localhost:5050/items")
      .then(res => setItems(res.data))
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

  const placeBid = (id, currentPrice) => {
    socket.emit("BID_PLACED", { itemId: id, bidAmount: currentPrice + 10, userId });
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
          {items.map(item => (
            <AuctionCard 
              key={item.id} 
              item={item} 
              currentUser={{ id: userId }} 
              onBid={placeBid}
              isFlashing={flashId === item.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const AuctionCard = ({ item, currentUser, onBid, isFlashing }) => {
  const [timeLeft, setTimeLeft] = useState(Number(item.auctionEndTime) - Date.now());
  const prevBidderRef = useRef(item.lastBidder);

  // Update internal ref when item changes
  useEffect(() => {
    if (item.lastBidder !== currentUser.id && item.lastBidder !== 'System') {
        // This is a simplified way to detect if I WAS the winner and just lost it
    }
    prevBidderRef.current = item.lastBidder;
  }, [item.lastBidder, currentUser.id]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(Number(item.auctionEndTime) - Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [item.auctionEndTime]);

  const isAuctionOver = timeLeft <= 0;
  const isHighestBidder = item.lastBidder === currentUser.id;
  // Outbid: Someone else leads, but last bid wasn't 'System'
  const isOutbid = !isHighestBidder && item.lastBidder !== 'System' && !isAuctionOver;

  const formatTime = (ms) => {
    if (ms <= 0) return "0:00";
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${s < 10 ? '0' + s : s}`;
  };

  return (
    <div className={`auction-card ${isAuctionOver ? 'is-over' : ''}`}>
      {/* Badges */}
      <div className="badge-container">
        {isHighestBidder && !isAuctionOver && (
          <span className="badge bg-green">WINNING</span>
        )}
        {isOutbid && (
          <span className="badge bg-red">OUTBID</span>
        )}
        {isAuctionOver && (
          <span className="badge bg-slate">CLOSED</span>
        )}
      </div>

      <div className="img-wrapper">
        <img 
          src={item.imageUrl || `https://picsum.photos/seed/${item.id}/400/300`} 
          alt={item.title} 
          className="item-img" 
        />
      </div>

      <div className={`card-body ${isFlashing ? 'flash-effect' : ''}`}>
        <div className="card-header">
          <h3 className="item-title">{item.title}</h3>
          <div className={`timer-container ${timeLeft < 60000 ? 'timer-urgent' : 'timer-normal'}`}>
            <span style={{ fontSize: '0.8rem' }}>⏱</span>
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>
        
        <p className="item-desc">{item.description || "Premium collector's item. Verified and authenticated."}</p>

        <div className="card-footer">
          <div>
            <p className="bid-label">Current Bid</p>
            <p className="bid-price">${item.currentBid.toLocaleString()}</p>
          </div>
          
          <button
            onClick={() => onBid(item.id, item.currentBid)}
            disabled={isAuctionOver || isHighestBidder}
            className={`btn ${
              isAuctionOver 
                ? 'btn-closed' 
                : isHighestBidder 
                  ? 'btn-lead' 
                  : 'btn-bid'
            }`}
          >
            {isAuctionOver ? 'Closed' : isHighestBidder ? 'You Lead' : 'Bid +$10'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;