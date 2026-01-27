import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import './App.css';

// Connect to the backend we built earlier
const socket = io("http://localhost:5050");

function App() {
  const [items, setItems] = useState([]);
  const [userId] = useState("User_" + Math.floor(Math.random() * 1000));
  const [flashId, setFlashId] = useState(null); // Track which card should flash

  useEffect(() => {
    // 1. Get initial items via REST API
    axios.get("http://localhost:5050/items")
      .then(res => setItems(res.data))
      .catch(err => console.error("Error fetching items:", err));

    // 2. Listen for real-time bid updates
    socket.on("UPDATE_BID", (data) => {
      setItems(prevItems => prevItems.map(item => {
        if (item.id === data.itemId) {
          // Trigger the Green Flash
          setFlashId(data.itemId);
          setTimeout(() => setFlashId(null), 800);
          
          // Update the price and the last bidder
          return { ...item, currentBid: data.newBid, lastBidder: data.bidderId };
        }
        return item;
      }));
    });

    return () => socket.off(); // Cleanup connection on close
  }, []);

  // 3. Function to send a bid to the server
  const placeBid = (id, price) => {
    socket.emit("BID_PLACED", { 
      itemId: id, 
      bidAmount: price + 10, 
      userId 
    });
  };

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '40px' }}>
        <h1>Velocity Auction</h1>
        <p>Welcome, <strong>{userId}</strong></p>
      </header>

      <div className="auction-grid">
        {items.map(item => {
            console.log(item);
          const isWinning = item.lastBidder === userId;
          const isOutbid = item.lastBidder !== userId && item.lastBidder !== 'System';

          return (
            <div key={item.id} className={`card ${flashId === item.id ? 'flash' : ''} ${isOutbid ? 'state-outbid' : ''}`}>
              
              {isWinning && <div className="winning-badge">WINNING</div>}
              
              <h3>{item.title}</h3>
              <div className={`price ${isOutbid ? 'text-outbid' : ''}`}>${item.currentBid}</div>
              
              <Countdown targetTime={Number(item.auctionEndTime)} />

              <button onClick={() => placeBid(item.id, item.currentBid)} disabled={isWinning}>
                {isWinning ? "Highest Bidder" : "Bid +$10"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 4. Countdown Component (We will define this next)
function Countdown({ targetTime }) {
  const [timeLeft, setTimeLeft] = useState(targetTime - Date.now());
    console.log(targetTime);
  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(targetTime - Date.now()), 1000);
    return () => clearInterval(timer);
  }, [targetTime]);

  if (timeLeft <= 0) return <div style={{color: 'red'}}>CLOSED</div>;

  const m = Math.floor((timeLeft % 3600000) / 60000);
  const s = Math.floor((timeLeft % 60000) / 1000);

  return <div className="timer">Ends in: {m}m {s}s</div>;
}

function Timer({ endTime }) {
    const [timeLeft, setTimeLeft] = useState(endTime - Date.now());
  
    useEffect(() => {
      // Update every 1 second
      const interval = setInterval(() => {
        setTimeLeft(endTime - Date.now());
      }, 1000);
  
      return () => clearInterval(interval);
    }, [endTime]);
  
    // If time is up
    if (timeLeft <= 0) {
      return <span style={{ color: '#ef4444', fontWeight: 'bold' }}>CLOSED</span>;
    }
  
    // Convert milliseconds to HH:MM:SS
    const hours = Math.floor(timeLeft / 3600000);
    const minutes = Math.floor((timeLeft % 3600000) / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
  
    // Helper to add a leading zero (e.g., 05 instead of 5)
    const pad = (num) => String(num).padStart(2, '0');
  
    return (
      <span className="timer-display">
        {hours > 0 && `${pad(hours)}:`}{pad(minutes)}:{pad(seconds)}
      </span>
    );
  }

export default App;