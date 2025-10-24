import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Container, Row, Col, Card, Form, ListGroup } from "react-bootstrap";
import Paginate from "../components/Paginate";

// Debounce uchun custom hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const HomePage = () => {
  const [mangas, setMangas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("");
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);

  const debouncedSearchTerm = useDebounce(searchTerm, 500); // 500ms kutiladi

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/genres`
        );
        setGenres(data);
      } catch (err) {
        console.error("Janrlarni yuklab bo'lmadi", err);
      }
    };

    const fetchMangas = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/mangas`,
          {
            params: {
              search: debouncedSearchTerm,
              page: page,
              genre: selectedGenre,
            }, // So'rovga parametr qo'shamiz
          }
        );
        setMangas(response.data.mangas);
        setPageCount(response.data.pageCount);
      } catch (err) {
        setError("Ma'lumotlarni yuklashda xatolik yuz berdi.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGenres();
    fetchMangas();
  }, [debouncedSearchTerm, page, selectedGenre]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo(0, 0); // Yangi sahifaga o'tganda tepaga scroll qilish
  };

  const handleGenreSelect = (genreId) => {
    setSelectedGenre(genreId);
    setPage(1); // Filtr o'zgarganda birinchi sahifaga qaytish
  };

  return (
    <Container>
      <Row>
        <Col md={3}>
          <h4>Janrlar</h4>
          <ListGroup>
            <ListGroup.Item
              action
              active={!selectedGenre}
              onClick={() => handleGenreSelect("")}
            >
              Barchasi
            </ListGroup.Item>
            {genres.map((genre) => (
              <ListGroup.Item
                key={genre.id}
                action
                active={genre.id === selectedGenre}
                onClick={() => handleGenreSelect(genre.id)}
              >
                {genre.name}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Col>
        <Col md={9}>
          <Row className="align-items-center my-4">
            <Col>
              <h1>Manga Katalogi</h1>
            </Col>
            <Col md="auto">
              <Form.Control
                type="text"
                placeholder="Manga qidirish..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1); // Qidiruv boshlanganda birinchi sahifaga o'tish
                }}
              />
            </Col>
          </Row>

          {loading && <div>Yuklanmoqda...</div>}
          {error && <div>{error}</div>}
          {!loading && !error && (
            <>
              <Row>
                {mangas.length > 0 ? (
                  mangas.map((manga) => (
                    <Col
                      key={manga.id}
                      sm={12}
                      md={6}
                      lg={4}
                      xl={4}
                      className="mb-4"
                    >
                      <Card className="h-100">
                        <Link to={`/manga/${manga.id}`}>
                          <Card.Img
                            variant="top"
                            src={
                              manga.cover_image_url ||
                              "https://via.placeholder.com/150"
                            }
                          />
                        </Link>
                        <Card.Body>
                          <Link
                            to={`/manga/${manga.id}`}
                            style={{ textDecoration: "none", color: "inherit" }}
                          >
                            <Card.Title as="div">
                              <strong>{manga.title}</strong>
                            </Card.Title>
                          </Link>
                          <Card.Text as="h5">
                            {Number(manga.price).toLocaleString()} so'm
                          </Card.Text>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))
                ) : (
                  <p>Qidiruv natijasida hech narsa topilmadi.</p>
                )}
              </Row>
              <div className="d-flex justify-content-center my-4">
                <Paginate
                  pages={pageCount}
                  page={page}
                  onPageChange={handlePageChange}
                />
              </div>
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default HomePage;
