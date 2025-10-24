import React, { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import AuthContext from "../context/AuthContext";

const OrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!token) return;
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/orders/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setOrder(response.data);
      } catch (err) {
        setError(
          "Buyurtmani yuklashda xatolik yuz berdi yoki bu buyurtmani ko'rishga ruxsatingiz yo'q."
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id, token]);

  if (loading) return <div>Yuklanmoqda...</div>;
  if (error) return <div>{error}</div>;
  if (!order) return <div>Buyurtma topilmadi.</div>;

  return (
    <div>
      <h1>Buyurtma #{order.id}</h1>
      <div
        style={{
          marginBottom: "1rem",
          padding: "1rem",
          border: "1px solid #eee",
          borderRadius: "8px",
        }}
      >
        <p>
          <strong>Sana:</strong> {new Date(order.created_at).toLocaleString()}
        </p>
        <p>
          <strong>Status:</strong>{" "}
          <span style={{ fontWeight: "bold", color: "#007bff" }}>
            {order.status}
          </span>
        </p>
        <p>
          <strong>Jami summa:</strong>{" "}
          {Number(order.total_amount).toLocaleString()} so'm
        </p>
      </div>

      <h2>Buyurtma tarkibi</h2>
      <div>
        {order.items.map((item, index) => (
          <div
            key={item.manga_id} // 'index' o'rniga noyob 'manga_id' dan foydalanish
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "1rem",
              borderBottom: "1px solid #eee",
              paddingBottom: "1rem",
            }}
          >
            <img
              src={
                item.cover_image_url || "https://via.placeholder.com/100x150"
              }
              alt={item.title}
              style={{
                width: "80px",
                marginRight: "1rem",
                borderRadius: "4px",
              }}
            />
            <div style={{ flex: 1 }}>
              <h4>
                <Link to={`/manga/${item.manga_id}`}>{item.title}</Link>
              </h4>
              <p>Narxi: {Number(item.price_per_item).toLocaleString()} so'm</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p>Soni: {item.quantity}</p>
              <p style={{ fontWeight: "bold" }}>
                Jami: {(item.price_per_item * item.quantity).toLocaleString()}{" "}
                so'm
              </p>
            </div>
          </div>
        ))}
      </div>
      <Link to="/orders/my">Barcha buyurtmalarga qaytish</Link>
    </div>
  );
};

export default OrderDetailPage;
