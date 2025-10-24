import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState(null); // Sahifani yuklashdagi xato uchun
  const [checkoutError, setCheckoutError] = useState(null); // Buyurtma berishdagi xato uchun
  const [isCheckingOut, setIsCheckingOut] = useState(false); // Buyurtma berish jarayoni
  const { token } = useContext(AuthContext);

  const navigate = useNavigate();
  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/cart`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCartItems(response.data);
    } catch (err) {
      setPageError("Savatchani yuklashda xatolik yuz berdi.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCartItems();
    }
  }, [token]);

  const handleUpdateQuantity = async (mangaId, newQuantity) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/cart/items/${mangaId}`,
        { quantity: newQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Ma'lumotlarni yangilash uchun qayta yuklaymiz
      // Optimallashtirish: Sahifani to'liq qayta yuklash o'rniga, lokal state'ni yangilaymiz.
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.manga_id === mangaId ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (err) {
      console.error("Error updating quantity:", err);
    }
  };

  const handleRemoveItem = async (mangaId) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/cart/items/${mangaId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // Optimallashtirish: O'chirilgan elementni lokal state'dan olib tashlaymiz.
      setCartItems((prevItems) =>
        prevItems.filter((item) => item.manga_id !== mangaId)
      );
    } catch (err) {
      console.error("Error removing item:", err);
    }
  };

  const handleCheckout = async () => {
    setCheckoutError(null); // Har urinishda eski xatoni tozalash
    setIsCheckingOut(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/orders`,
        {}, // Body bo'sh, chunki backend savatchadan oladi
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Buyurtma muvaffaqiyatli bo'lsa, tasdiqlash sahifasiga yo'naltiramiz
      navigate(`/order-confirmation/${response.data.orderId}`);
    } catch (err) {
      // Backend'dan kelgan aniq xato xabarini ko'rsatish
      if (err.response && err.response.data && err.response.data.error) {
        setCheckoutError(err.response.data.error);
      } else {
        setCheckoutError("Buyurtma berishda kutilmagan xatolik yuz berdi.");
      }
      console.error("Error during checkout:", err);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const total = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  if (loading) return <div>Yuklanmoqda...</div>;
  if (pageError) return <div>{pageError}</div>;

  return (
    <div>
      <h1>Xarid Savatchasi</h1>
      {cartItems.length === 0 ? (
        <div>
          <p>Savatchangiz bo'sh.</p>
          <Link to="/">Xaridni davom ettirish</Link>
        </div>
      ) : (
        <div style={{ display: "flex", gap: "2rem" }}>
          <div style={{ flex: 3 }}>
            {cartItems.map((item) => (
              <div
                key={item.manga_id}
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
                    item.cover_image_url ||
                    "https://via.placeholder.com/100x150"
                  }
                  alt={item.title}
                  style={{ width: "100px", marginRight: "1rem" }}
                />
                <div style={{ flex: 1 }}>
                  <h4>{item.title}</h4>
                  <p>{item.price} so'm</p>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      handleUpdateQuantity(
                        item.manga_id,
                        parseInt(e.target.value)
                      )
                    }
                    min="1"
                    style={{
                      width: "50px",
                      textAlign: "center",
                      marginRight: "1rem",
                    }}
                  />
                  <button
                    onClick={() => handleRemoveItem(item.manga_id)}
                    style={{
                      color: "red",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    O'chirish
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              flex: 1,
              border: "1px solid #ccc",
              padding: "1rem",
              borderRadius: "8px",
              height: "fit-content",
            }}
          >
            {checkoutError && (
              <p style={{ color: "red", marginBottom: "1rem" }}>
                {checkoutError}
              </p>
            )}
            <h3>Buyurtma xulosasi</h3>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <p>Jami:</p>
              <p style={{ fontWeight: "bold" }}>
                {total.toLocaleString()} so'm
              </p>
            </div>
            {/* "Buyurtma berish" tugmasi */}
            <button
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "1rem",
                marginTop: "1rem",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
              onClick={handleCheckout}
              disabled={cartItems.length === 0 || isCheckingOut} // Savatcha bo'sh yoki buyurtma jarayonida bo'lsa, tugma nofaol
            >
              {isCheckingOut ? "Buyurtma yuborilmoqda..." : "Buyurtma berish"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
