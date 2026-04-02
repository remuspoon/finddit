import 'dotenv/config';
import express from 'express';
import clickRouter from './src/click.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(clickRouter);

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
  });
}

export default app;
