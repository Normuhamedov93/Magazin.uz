import React from "react";
import { useParams, Link } from "react-router-dom";

const OrderConfirmationPage = () => {
  const { orderId } = useParams(); // URL'dan orderId'ni olamiz

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h1>🎉 Buyurtmangiz qabul qilindi! 🎉</h1>
      <p style={{ fontSize: "1.2rem", margin: "1rem 0" }}>
        Buyurtma raqamingiz:{" "}
        <strong style={{ color: "#007bff" }}>#{orderId}</strong>
      </p>
      <p>Tez orada buyurtmangizni yetkazib berish uchun ishga tushamiz.</p>
      <div style={{ marginTop: "2rem" }}>
        <Link
          to="/orders/my"
          style={{
            marginRight: "1rem",
            textDecoration: "none",
            color: "#007bff",
          }}
        >
          Buyurtmalarimni ko'rish
        </Link>
        <Link to="/" style={{ textDecoration: "none", color: "#28a745" }}>
          Xaridni davom ettirish
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
