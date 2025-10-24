import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import { Link } from "react-router-dom";

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) return;
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/orders/my`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setOrders(response.data);
      } catch (err) {
        setError("Buyurtmalarni yuklashda xatolik yuz berdi.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token]);

  if (loading) return <div>Yuklanmoqda...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h1>Buyurtmalarim</h1>
      {orders.length === 0 ? (
        <p>Siz hali buyurtma bermagansiz.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #333" }}>
              <th style={{ padding: "8px", textAlign: "left" }}>Buyurtma ID</th>
              <th style={{ padding: "8px", textAlign: "left" }}>Sana</th>
              <th style={{ padding: "8px", textAlign: "left" }}>Jami Summa</th>
              <th style={{ padding: "8px", textAlign: "left" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} style={{ borderBottom: "1px solid #ccc" }}>
                <td style={{ padding: "8px" }}>
                  <Link to={`/orders/${order.id}`}>#{order.id}</Link>
                </td>
                <td style={{ padding: "8px" }}>
                  {new Date(order.created_at).toLocaleDateString()}
                </td>
                <td style={{ padding: "8px" }}>
                  {order.total_amount.toLocaleString()} so'm
                </td>
                <td style={{ padding: "8px" }}>{order.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MyOrdersPage;
