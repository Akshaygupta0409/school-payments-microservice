import express from 'express';
import cors from 'cors';
import 'express-async-errors';

import connectDB from './config/db.js';
import indexRouter from './routes/index.js';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import ordersRouter from './routes/orders.js';
import paymentsRouter from './routes/payments.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect DB
connectDB();

// Routes
app.use('/', indexRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
//app.use('/api/orders', ordersRouter);
app.use('/api/payments', paymentsRouter);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server Error' });
});

export default app;
