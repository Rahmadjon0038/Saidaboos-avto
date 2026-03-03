const app = require('./src/app');
const { initDb } = require('./src/db');

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  await initDb();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Swagger docs: http://localhost:${PORT}/docs`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
