const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { db, initDb } = require('./db');

initDb();

const app = express();
app.use(express.json());

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Avto Elon API',
      version: '1.0.0',
      description: 'Auto e\'lon platformasi uchun oddiy backend API',
    },
    servers: [{ url: 'http://localhost:3000' }],
    components: {
      schemas: {
        Category: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Sedan' },
            image_url: { type: 'string', example: 'https://example.com/category.jpg' },
          },
        },
        CreateCategoryBody: {
          type: 'object',
          required: ['name', 'image_url'],
          properties: {
            name: { type: 'string', example: 'SUV' },
            image_url: { type: 'string', example: 'https://example.com/suv.jpg' },
          },
        },
        CarListItem: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            category_id: { type: 'integer', example: 1 },
            category_name: { type: 'string', example: 'Sedan' },
            image: { type: 'string', example: 'https://example.com/car.jpg' },
            name: { type: 'string', example: 'Toyota Camry' },
            price: { type: 'number', example: 24500 },
            year: { type: 'integer', example: 2020 },
            mileage: { type: 'integer', example: 62000 },
            color: { type: 'string', example: 'Oq' },
          },
        },
        CarDetail: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Toyota Camry' },
            year: { type: 'integer', example: 2020 },
            color: { type: 'string', example: 'Oq' },
            paint_condition: { type: 'string', example: 'Original' },
            mileage: { type: 'integer', example: 62000 },
            engine_size: { type: 'number', example: 2.5 },
            images: {
              type: 'array',
              items: { type: 'string', example: 'https://example.com/car-detail.jpg' },
            },
          },
        },
      },
    },
    paths: {
      '/health': {
        get: {
          summary: 'Server holatini tekshirish',
          responses: {
            200: {
              description: 'OK',
            },
          },
        },
      },
      '/categories': {
        get: {
          summary: 'Categoriyalarni olish',
          responses: {
            200: {
              description: 'Category list',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Category' },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: 'Yangi category qo\'shish',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateCategoryBody' },
              },
            },
          },
          responses: {
            201: {
              description: 'Category created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Category' },
                },
              },
            },
            400: {
              description: 'Validation error',
            },
          },
        },
      },
      '/cars': {
        get: {
          summary: 'Avto e\'lonlarini olish',
          responses: {
            200: {
              description: 'Car list',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/CarListItem' },
                  },
                },
              },
            },
          },
        },
      },
      '/cars/{id}': {
        get: {
          summary: 'ID orqali avto e\'lon detailini olish',
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          responses: {
            200: {
              description: 'Car detail',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/CarDetail' },
                },
              },
            },
            404: {
              description: 'Not found',
            },
          },
        },
      },
    },
  },
  apis: [],
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/categories', (req, res) => {
  const categories = db
    .prepare('SELECT id, name, image_url FROM categories ORDER BY id DESC')
    .all();

  res.json(categories);
});

app.post('/categories', (req, res) => {
  const { name, image_url: imageUrl } = req.body;

  if (!name || !imageUrl) {
    return res.status(400).json({
      message: 'name va image_url majburiy',
    });
  }

  const result = db
    .prepare('INSERT INTO categories (name, image_url) VALUES (?, ?)')
    .run(name, imageUrl);

  const created = db
    .prepare('SELECT id, name, image_url FROM categories WHERE id = ?')
    .get(result.lastInsertRowid);

  return res.status(201).json(created);
});

app.get('/cars', (req, res) => {
  const cars = db
    .prepare(
      `SELECT
        ca.id,
        ca.category_id,
        c.name AS category_name,
        ci.image_url AS image,
        ca.name,
        ca.price,
        ca.year,
        ca.mileage,
        ca.color
      FROM car_ads ca
      INNER JOIN categories c ON c.id = ca.category_id
      LEFT JOIN car_images ci ON ci.car_id = ca.id
      AND ci.sort_order = (
        SELECT MIN(sort_order)
        FROM car_images
        WHERE car_id = ca.id
      )
      ORDER BY ca.id DESC`
    )
    .all();

  res.json(cars);
});

app.get('/cars/:id', (req, res) => {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    return res.status(400).json({ message: 'id raqam bo\'lishi kerak' });
  }

  const car = db
    .prepare(
      `SELECT
        id,
        name,
        year,
        color,
        paint_condition,
        mileage,
        engine_size
      FROM car_ads
      WHERE id = ?`
    )
    .get(id);

  if (!car) {
    return res.status(404).json({ message: 'Avto e\'lon topilmadi' });
  }

  const images = db
    .prepare('SELECT image_url FROM car_images WHERE car_id = ? ORDER BY sort_order ASC, id ASC')
    .all(id)
    .map((row) => row.image_url);

  return res.json({ ...car, images });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Server xatoligi' });
});

module.exports = app;
