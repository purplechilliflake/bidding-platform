import React, { useState } from 'react';
import axios from 'axios';

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
          <section className="seller-form-card">
            <h3>List New Product</h3>
            <form onSubmit={handlePost} className="auth-form">
              <label>Product Title</label>
              <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              
              <label>Starting Price ($)</label>
              <input type="number" required value={form.startPrice} onChange={e => setForm({...form, startPrice: e.target.value})} />
  
              <label>Duration</label>
              <div className="duration-inputs">
                <div><input type="number" placeholder="0" value={form.days} onChange={e => setForm({ ...form, days: e.target.value })} /> <small>Days</small></div>
                <div><input type="number" placeholder="0" value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} /> <small>Hrs</small></div>
                <div><input type="number" placeholder="0" value={form.mins} onChange={e => setForm({ ...form, mins: e.target.value })} /> <small>Mins</small></div>
              </div>
  
              <label>Description</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              
              <button type="submit" className="btn-auth-submit">Create Auction</button>
            </form>
          </section>
  
          <section className="my-items-list">
            <h3>Your Active Auctions</h3>
            {items.length === 0 ? <p>No items posted yet.</p> : (
              items.map(item => {
                const realBids = (item.history || []).filter(bid => 
                    bid && 
                    bid.bidderName && 
                    bid.bidderName !== "No bids yet" && 
                    bid.bidderName !== "System"
                );

                const winnerName = item.lastBidderName && item.lastBidderName !== "System" 
                  ? item.lastBidderName 
                  : "No bids yet";

                return (
                  <div key={item.id} className="seller-item-card">
                    <div className="seller-item-row">
                      <div className="item-info">
                        <strong>{item.title}</strong>
                        <span className="current-bid-text">Current: ${Number(item.currentBid || 0).toLocaleString()}</span>
                      </div>
                      <div className="item-status">
                        <span className="leader-badge">
                          {realBids.length > 0 ? `Winning: ${winnerName}` : "No bids yet"}
                        </span>
                      </div>
                    </div>

                    <div className="seller-history-box">
                      <h5>Bid History</h5>
                      <div className="mini-history-list">
                        {realBids.length > 0 ? (
                          realBids.map((bid, index) => (
                            <div key={index} className="mini-history-item">
                              <span className="bidder-name">{bid?.bidderName || "Anonymous"}</span>
                              <span className="bid-amt">
                                ${Number(bid?.bidAmount || 0).toLocaleString()}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="no-bids-small">Waiting for first bid...</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </section>
        </div>
      </div>
    );
};

export default SellerDashboard;