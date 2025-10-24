import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { Table, Button, Row, Col } from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";
import AuthContext from "../../context/AuthContext";

const AdminMangaListPage = () => {
  const [mangas, setMangas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useContext(AuthContext);

  const fetchMangas = async () => {
    try {
      setLoading(true);
      // Admin uchun barcha mahsulotlarni olish (paginatsiyasiz)
      // Backend'da bu endpoint'ni paginatsiya bilan ham ishlasa bo'ladi, hozircha oddiy usul
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/mangas`,
        {
          params: { page: 1, limit: 100 }, // Vaqtinchalik limit
        }
      );
      setMangas(data.mangas);
    } catch (err) {
      setError("Mahsulotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMangas();
  }, []);

  const deleteHandler = async (id) => {
    if (window.confirm("Haqiqatan ham bu mahsulotni o'chirmoqchimisiz?")) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/mangas/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Ro'yxatni yangilash
        fetchMangas();
      } catch (err) {
        console.error("O'chirishda xatolik", err);
        alert("Mahsulotni o'chirishda xatolik yuz berdi.");
      }
    }
  };

  if (loading) return <p>Yuklanmoqda...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <>
      <Row className="align-items-center">
        <Col>
          <h1>Mahsulotlar</h1>
        </Col>
        <Col className="text-end">
          <LinkContainer to="/admin/manga/create">
            <Button className="my-3">
              <i className="fas fa-plus"></i> Yangi Mahsulot Qo'shish
            </Button>
          </LinkContainer>
        </Col>
      </Row>
      <Table striped bordered hover responsive className="table-sm">
        <thead>
          <tr>
            <th>ID</th>
            <th>NOMI</th>
            <th>NARXI</th>
            <th>ZAXIRADA</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {mangas.map((manga) => (
            <tr key={manga.id}>
              <td>{manga.id}</td>
              <td>{manga.title}</td>
              <td>{Number(manga.price).toLocaleString()} so'm</td>
              <td>{manga.stock_quantity}</td>
              <td>
                <LinkContainer to={`/admin/manga/${manga.id}/edit`}>
                  <Button variant="light" className="btn-sm mx-1">
                    <i className="fas fa-edit"></i>
                  </Button>
                </LinkContainer>
                <Button
                  variant="danger"
                  className="btn-sm"
                  onClick={() => deleteHandler(manga.id)}
                >
                  <i className="fas fa-trash"></i>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
};

export default AdminMangaListPage;
