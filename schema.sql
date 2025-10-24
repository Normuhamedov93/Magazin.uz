-- schema.sql

-- `updated_at` ustunini avtomatik yangilash uchun funksiya (PostgreSQL uchun)
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Mualliflar jadvali
CREATE TABLE authors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    bio TEXT
);

-- Janrlar jadvali
CREATE TABLE genres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Mangalar jadvali
CREATE TABLE mangas (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author_id INTEGER REFERENCES authors(id) ON DELETE SET NULL, -- Muallif o'chirilganda manga saqlanib qoladi
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    cover_image_url VARCHAR(255),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Mangalar va Janrlar o'rtasidagi bog'liqlik uchun jadval (Ko'pga-ko'p aloqa)
CREATE TABLE manga_genres (
    manga_id INTEGER REFERENCES mangas(id) ON DELETE CASCADE,
    genre_id INTEGER REFERENCES genres(id) ON DELETE CASCADE,
    PRIMARY KEY (manga_id, genre_id)
);

-- Foydalanuvchilar jadvali
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Parol heshini saqlash uchun
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Buyurtmalar jadvali
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Xarid savatchasi jadvali (har bir foydalanuvchiga bitta)
CREATE TABLE carts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- `carts` jadvalidagi `updated_at` ustunini yangilash uchun trigger
CREATE TRIGGER set_carts_timestamp
BEFORE UPDATE ON carts
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();


-- Savatchadagi mahsulotlar jadvali
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    manga_id INTEGER NOT NULL REFERENCES mangas(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0) DEFAULT 1,
    UNIQUE (cart_id, manga_id) -- Bir savatchaga bir xil mahsulotni ikki marta qo'shishni oldini oladi
);

-- Buyurtma tarkibidagi mahsulotlar jadvali
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    manga_id INTEGER REFERENCES mangas(id),
    quantity INTEGER NOT NULL,
    price_per_item NUMERIC(10, 2) NOT NULL
);

-- Qidiruvni tezlashtirish uchun indekslar
CREATE INDEX idx_mangas_title ON mangas(title);
CREATE INDEX idx_users_username ON users(username);

-- Jadvallarni test ma'lumotlari bilan to'ldirish (ixtiyoriy)
INSERT INTO authors (name) VALUES ('Hajime Isayama'), ('Masashi Kishimoto');
INSERT INTO genres (name) VALUES ('Action'), ('Shounen'), ('Fantasy'), ('Drama');
INSERT INTO mangas (title, author_id, description, price, stock_quantity) VALUES
('Attack on Titan', 1, 'A story of humanity fighting against giant titans.', 120000.00, 50),
('Naruto', 2, 'A young ninja seeks recognition from his peers.', 110000.00, 100);
INSERT INTO manga_genres (manga_id, genre_id) VALUES (1, 1), (1, 2), (1, 3), (1, 4), (2, 1), (2, 2);
