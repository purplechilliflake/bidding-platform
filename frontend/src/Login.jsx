import { useState } from "react";
import axios from "axios";

const BACKEND_URL = "http://localhost:5050/";

function Login({ setUser }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "bidder"
  });

  const handleSubmit = async () => {
    if (isRegister) {
      await axios.post(`${BACKEND_URL}register`, form);
      alert("Registered! Now login.");
      setIsRegister(false);
    } else {
      const res = await axios.post(`${BACKEND_URL}login`, {
        email: form.email,
        password: form.password
      });

      localStorage.setItem("user", JSON.stringify(res.data));
      setUser(res.data);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>{isRegister ? "Register" : "Login"}</h2>

      {isRegister && (
        <>
          <input placeholder="Name"
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
          <br />
          <select
            onChange={e => setForm({ ...form, role: e.target.value })}
          >
            <option value="bidder">Bidder</option>
            <option value="seller">Seller</option>
          </select>
          <br />
        </>
      )}

      <input placeholder="Email"
        onChange={e => setForm({ ...form, email: e.target.value })}
      />
      <br />

      <input type="password" placeholder="Password"
        onChange={e => setForm({ ...form, password: e.target.value })}
      />
      <br />

      <button onClick={handleSubmit}>
        {isRegister ? "Register" : "Login"}
      </button>

      <p onClick={() => setIsRegister(!isRegister)} style={{ cursor: "pointer" }}>
        {isRegister ? "Already have account? Login" : "Create account"}
      </p>
    </div>
  );
}

export default Login;