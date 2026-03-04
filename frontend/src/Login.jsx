import { useState } from "react";
import axios from "axios";

const BACKEND_URL = "http://localhost:5050/";

function Login({ setUser, onClose }) {
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateEmail(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (isRegister) {
      if (!form.name.trim()) return setError("Please enter your name.");
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match!");
        return;
      }

      try {
        await axios.post(`${BACKEND_URL}register`, {
          name: form.name,
          email: form.email,
          password: form.password,
          role: "bidder"
        });
        alert("Registration successful! Please sign in.");
        setIsRegister(false);
      } catch (err) {
        setError(err.response?.data?.error || "Registration failed");
      }
    } else {
      try {
        const res = await axios.post(`${BACKEND_URL}login`, {
          email: form.email,
          password: form.password
        });
        localStorage.setItem("user", JSON.stringify(res.data));
        setUser(res.data);
      } catch (err) {
        setError("Invalid email or password");
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-modal" onClick={onClose}>&times;</button>
        
        <div className="auth-header">
            <h2>{isRegister ? "Create Account" : "Sign In"}</h2>
            <p>{isRegister ? "Join the community to start bidding" : "Welcome back, please login"}</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
        {isRegister && (
            <div className="input-group">
              <label>Full Name</label>
              <input 
                type="text" placeholder="John Doe" required
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
          )}
          
          <div className="input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="name@company.com"
              required
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              required
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
          </div>

          {isRegister && (
            <div className="input-group">
              <label>Confirm Password</label>
              <input 
                type="password" 
                placeholder="••••••••"
                required
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
              />
            </div>
          )}

          <button type="submit" className="btn-auth-submit">
            {isRegister ? "Create my account now" : "Sign In"}
          </button>
        </form>

        <div className="auth-footer">
          {isRegister ? (
            <p>Already have an account? <span onClick={() => setIsRegister(false)}>Click here to sign in</span></p>
          ) : (
            <p>New user? <span onClick={() => setIsRegister(true)}>Create an account</span></p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;