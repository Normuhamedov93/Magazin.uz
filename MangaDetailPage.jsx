import React, { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthContext from "../context/AuthContext";

const MangaDetailPage = () => {
  const { id } = useParams(); // URL'dan 'id' parametrini olamiz
  const [manga, setManga] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(""); // Foydalanuvchiga xabar ko'rsatish uchun
  const [isError, setIsError] = useState(false); // Xabar turi (xato yoki muvaffaqiyat)
  const [isAdding, setIsAdding] = useState(false); // Savatchaga qo'shish jarayoni

  const { isAuthenticated, token } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchManga = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/mangas/${id}`
        );
        setManga(response.data);
      } catch (err) {
        setError(
          "Manga topilmadi yoki ma'lumotlarni yuklashda xatolik yuz berdi."
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchManga();
  }, [id]); // Bu effekt 'id' o'zgarganda qayta ishga tushadi

  if (loading) return <div>Yuklanmoqda...</div>;
  if (error)
    return (
      <div>
        {error} <Link to="/">Bosh sahifaga qaytish</Link>
      </div>
    );
  if (!manga) return <div>Manga topilmadi.</div>;

  const handleAddToCart = async () => {
    setMessage(""); // Har bosganda eski xabarni tozalash
    setIsError(false);
    setIsAdding(true);

    if (!isAuthenticated) {
      // Agar foydalanuvchi tizimga kirmagan bo'lsa, login sahifasiga yo'naltiramiz
      navigate("/login");
      return;
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/cart/items`,
        {
          manga_id: manga.id,
          quantity: 1, // Hozircha 1 dona qo'shamiz
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessage("Mahsulot savatchaga muvaffaqiyatli qo'shildi!");
      setIsError(false);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setMessage(err.response.data.error);
      } else {
        setMessage(
          "Savatchaga qo'shishda kutilmagan xatolik yuz berdi. Iltimos, qayta urinib ko'ring."
        );
      }
      setIsError(true);
      console.error("Error adding to cart:", err);
    } finally {
      setIsAdding(false); // Jarayon tugagach, tugmani yana faollashtirish
    }
  };

  return (
    <div style={{ display: "flex", gap: "30px" }}>
      <div style={{ flex: "0 0 300px" }}>
        <img
          src={manga.cover_image_url || "https://via.placeholder.com/300x450"}
          alt={manga.title}
          style={{ width: "100%", borderRadius: "8px" }}
        />
      </div>
      <div>
        <h1>{manga.title}</h1>
        <h3>
          Muallif:{" "}
          <Link to={`/author/${manga.author_id}`}>{manga.author_name}</Link>
        </h3>
        <p>
          <strong>Janrlar:</strong>{" "}
          {manga.genres.map((genre, index) => (
            <React.Fragment key={genre.id}>
              <Link to={`/?genre=${genre.id}`}>{genre.name}</Link>
              {index < manga.genres.length - 1 ? ", " : ""}
            </React.Fragment>
          ))}
        </p>
        <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#2c3e50" }}>
          Narxi: {Number(manga.price).toLocaleString()} so'm
        </p>
        <p>
          <strong>Omborda:</strong>{" "}
          {manga.stock_quantity > 0
            ? `${manga.stock_quantity} dona mavjud`
            : "Mavjud emas"}
        </p>
        <hr style={{ margin: "20px 0" }} />
        <h4>Tavsif</h4>
        <p>{manga.description}</p>
        {/* Keyingi bosqichda bu tugma ishlaydigan bo'ladi */}
        <button
          disabled={manga.stock_quantity === 0 || isAdding}
          onClick={handleAddToCart}
          style={{
            padding: "10px 20px",
            fontSize: "1rem",
            cursor:
              manga.stock_quantity > 0 && !isAdding ? "pointer" : "not-allowed",
          }}
        >
          {isAdding ? "Qo'shilmoqda..." : "Savatchaga qo'shish"}
        </button>
        {message && (
          <p style={{ marginTop: "1rem", color: isError ? "red" : "green" }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default MangaDetailPage;
