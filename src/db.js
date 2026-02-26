const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '..', 'data', 'avtoelon.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const createTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      image_url TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS car_ads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      year INTEGER NOT NULL,
      mileage INTEGER NOT NULL,
      color TEXT NOT NULL,
      paint_condition TEXT NOT NULL,
      engine_size REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS car_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      car_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (car_id) REFERENCES car_ads(id) ON DELETE CASCADE
    );
  `);
};

const seedDefaults = () => {
  const hasCategory = db.prepare('SELECT id FROM categories LIMIT 1').get();

  if (!hasCategory) {
    const insertCategory = db.prepare(
      'INSERT INTO categories (name, image_url) VALUES (?, ?)'
    );
    const category = insertCategory.run(
      'Sedan',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d'
    );

    const insertCar = db.prepare(
      `INSERT INTO car_ads
       (category_id, name, price, year, mileage, color, paint_condition, engine_size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const car = insertCar.run(
      category.lastInsertRowid,
      'Toyota Camry',
      24500,
      2020,
      62000,
      'Oq',
      'Original',
      2.5
    );

    const insertImage = db.prepare(
      'INSERT INTO car_images (car_id, image_url, sort_order) VALUES (?, ?, ?)'
    );

    insertImage.run(
      car.lastInsertRowid,
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341',
      0
    );
    insertImage.run(
      car.lastInsertRowid,
      'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7',
      1
    );
  }
};

const initDb = () => {
  createTables();
  seedDefaults();
};

module.exports = {
  db,
  initDb,
};
