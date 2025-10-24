import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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

const AdminMangaEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState(0);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [stockQuantity, setStockQuantity] = useState(0);
  const [description, setDescription] = useState("");
  const [selectedGenres, setSelectedGenres] = useState([]);

  const [authors, setAuthors] = useState([]);
  const [allGenres, setAllGenres] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updateError, setUpdateError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Bir vaqtning o'zida bir nechta so'rov yuborish
        const [mangaRes, authorsRes, genresRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/mangas/${id}`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/authors`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/genres`),
        ]);

        const mangaData = mangaRes.data;
        setTitle(mangaData.title);
        setPrice(mangaData.price);
        setCoverImageUrl(mangaData.cover_image_url);
        setAuthorId(mangaData.author_id);
        setStockQuantity(mangaData.stock_quantity);
        setDescription(mangaData.description);

        setAuthors(authorsRes.data);
        setAllGenres(genresRes.data);

        // Mahsulotning janrlarini ID bo'yicha topib, belgilash
        const mangaGenreIds = genresRes.data
          .filter((g) => mangaData.genres.includes(g.name))
          .map((g) => g.id);
        setSelectedGenres(mangaGenreIds);
      } catch (err) {
        setError("Ma'lumotlarni yuklashda xatolik yuz berdi.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleGenreChange = (genreId) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId]
    );
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setUpdateError("");
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/mangas/${id}`,
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
      setUpdateError("Mahsulotni yangilashda xatolik yuz berdi.");
      console.error(err);
    }
  };

  if (loading) return <Spinner animation="border" />;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <Container>
      <Link to="/admin/mangas" className="btn btn-light my-3">
        Orqaga
      </Link>
      <Row className="justify-content-md-center">
        <Col xs={12} md={8}>
          <h1>Mahsulotni Tahrirlash</h1>
          {updateError && <Alert variant="danger">{updateError}</Alert>}
          <Form onSubmit={submitHandler}>
            <Form.Group controlId="title" className="my-2">
              <Form.Label>Nomi</Form.Label>
              <Form.Control
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Form.Group>

            <Form.Group controlId="price" className="my-2">
              <Form.Label>Narxi</Form.Label>
              <Form.Control
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </Form.Group>

            <Form.Group controlId="coverImageUrl" className="my-2">
              <Form.Label>Rasm URL</Form.Label>
              <Form.Control
                type="text"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
              />
            </Form.Group>

            <Form.Group controlId="author" className="my-2">
              <Form.Label>Muallif</Form.Label>
              <Form.Select
                value={authorId}
                onChange={(e) => setAuthorId(e.target.value)}
              >
                <option>Muallifni tanlang</option>
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
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
              />
            </Form.Group>

            <Form.Group controlId="description" className="my-2">
              <Form.Label>Tavsif</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
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
              Yangilash
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminMangaEditPage;
