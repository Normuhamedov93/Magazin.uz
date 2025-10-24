import React, { useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  Form,
  Button,
  Container,
  Row,
  Col,
  Spinner,
  Alert,
} from "react-bootstrap";
import AuthContext from "../../context/AuthContext";

const AdminMangaCreatePage = () => {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [description, setDescription] = useState("");
  const [selectedGenres, setSelectedGenres] = useState([]);

  const [authors, setAuthors] = useState([]);
  const [allGenres, setAllGenres] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [authorsRes, genresRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/authors`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/genres`),
        ]);
        setAuthors(authorsRes.data);
        setAllGenres(genresRes.data);
      } catch (err) {
        setError("Ma'lumotlarni yuklashda xatolik yuz berdi.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleGenreChange = (genreId) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId]
    );
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/mangas`,
        {
          title,
          price,
          cover_image_url: coverImageUrl,
          author_id: authorId,
          stock_quantity: stockQuantity,
          description,
          genre_ids: selectedGenres,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      navigate("/admin/mangas");
    } catch (err) {
      setError("Mahsulotni yaratishda xatolik yuz berdi.");
      console.error(err);
    }
  };

  if (loading) return <Spinner animation="border" />;

  return (
    <Container>
      <Link to="/admin/mangas" className="btn btn-light my-3">
        Orqaga
      </Link>
      <Row className="justify-content-md-center">
        <Col xs={12} md={8}>
          <h1>Yangi Mahsulot Yaratish</h1>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={submitHandler}>
            <Form.Group controlId="title" className="my-2">
              <Form.Label>Nomi</Form.Label>
              <Form.Control
                type="text"
                placeholder="Manga nomini kiriting"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group controlId="price" className="my-2">
              <Form.Label>Narxi</Form.Label>
              <Form.Control
                type="number"
                placeholder="Narxini kiriting"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group controlId="coverImageUrl" className="my-2">
              <Form.Label>Rasm URL</Form.Label>
              <Form.Control
                type="text"
                placeholder="Rasm manzilini kiriting"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
              />
            </Form.Group>

            <Form.Group controlId="author" className="my-2">
              <Form.Label>Muallif</Form.Label>
              <Form.Select
                value={authorId}
                onChange={(e) => setAuthorId(e.target.value)}
                required
              >
                <option value="">Muallifni tanlang</option>
                {authors.map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group controlId="stockQuantity" className="my-2">
              <Form.Label>Zaxirada</Form.Label>
              <Form.Control
                type="number"
                placeholder="Zaxira sonini kiriting"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group controlId="description" className="my-2">
              <Form.Label>Tavsif</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Tavsifni kiriting"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Form.Group>

            <Form.Group controlId="genres" className="my-2">
              <Form.Label>Janrlar</Form.Label>
              <div>
                {allGenres.map((genre) => (
                  <Form.Check
                    key={genre.id}
                    type="checkbox"
                    inline
                    label={genre.name}
                    value={genre.id}
                    checked={selectedGenres.includes(genre.id)}
                    onChange={() => handleGenreChange(genre.id)}
                  />
                ))}
              </div>
            </Form.Group>

            <Button type="submit" variant="primary" className="my-3">
              Yaratish
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminMangaCreatePage;
