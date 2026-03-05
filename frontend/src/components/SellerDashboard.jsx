import React, { useState } from 'react';
import axios from 'axios';

// const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
// const BACKEND_URL = "https://bidding-platform-eqba.onrender.com/items";
// const BACKEND_URL = "http://localhost:5050/";

const isProduction = true; 

const BACKEND_URL = isProduction 
  ? "https://bidding-platform-eqba.onrender.com/" 
  : "http://localhost:5050/";

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

export default SellerDashboard;  