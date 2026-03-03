const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '..', 'data', 'avtoelon.db');
const connection = new sqlite3.Database(dbPath);

const normalizeParams = (params) => {
  if (typeof params === 'undefined') {
    return [];
  }

  return Array.isArray(params) ? params : [params];
};

const db = {
  run(sql, params) {
    return new Promise((resolve, reject) => {
      connection.run(sql, normalizeParams(params), function onRun(err) {
        if (err) {
          reject(err);
          return;
        }

        resolve({
          lastInsertRowid: this.lastID,
          changes: this.changes,
        });
      });
    });
  },
  get(sql, params) {
    return new Promise((resolve, reject) => {
      connection.get(sql, normalizeParams(params), (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(row);
      });
    });
  },
  all(sql, params) {
    return new Promise((resolve, reject) => {
      connection.all(sql, normalizeParams(params), (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(rows);
      });
    });
  },
  exec(sql) {
    return new Promise((resolve, reject) => {
      connection.exec(sql, (err) => {
        if (err) {
          reject(err);
          return;
        }

        resolve();
      });
    });
  },
};

const createTables = async () => {
  await db.exec(`
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

const seedDefaults = async () => {
  const hasCategory = await db.get('SELECT id FROM categories LIMIT 1');

  if (!hasCategory) {
    const category = await db.run(
      'INSERT INTO categories (name, image_url) VALUES (?, ?)',
      ['Sedan', 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d']
    );

    const car = await db.run(
      `INSERT INTO car_ads
       (category_id, name, price, year, mileage, color, paint_condition, engine_size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [category.lastInsertRowid, 'Toyota Camry', 24500, 2020, 62000, 'Oq', 'Original', 2.5]
    );

    await db.run(
      'INSERT INTO car_images (car_id, image_url, sort_order) VALUES (?, ?, ?)',
      [car.lastInsertRowid, 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341', 0]
    );
    await db.run(
      'INSERT INTO car_images (car_id, image_url, sort_order) VALUES (?, ?, ?)',
      [car.lastInsertRowid, 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7', 1]
    );
  }
};

const initDb = async () => {
  await db.exec('PRAGMA journal_mode = WAL;');
  await db.exec('PRAGMA foreign_keys = ON;');
  await createTables();
  await seedDefaults();
};

module.exports = {
  db,
  initDb,
};
