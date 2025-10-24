import React, { useState, useContext } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate(from, { replace: true }); // Muvaffaqiyatli kirgandan so'ng oldingi sahifaga qaytish
    } catch (err) {
      setError("Email yoki parol noto'g'ri.");
      console.error(err);
    }
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "2rem auto",
        padding: "2rem",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <h2>Tizimga kirish</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: "8px", marginTop: "4px" }}
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="password">Parol</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "8px", marginTop: "4px" }}
          />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button
          type="submit"
          style={{ width: "100%", padding: "10px", fontSize: "1rem" }}
        >
          Kirish
        </button>
      </form>
      <p style={{ textAlign: "center", marginTop: "1rem" }}>
        Hali akkauntingiz yo'qmi? <Link to="/register">Ro'yxatdan o'tish</Link>
      </p>
    </div>
  );
};

export default LoginPage;
