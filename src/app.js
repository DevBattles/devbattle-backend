import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import router from './routes/index.js';

const app = express();

// Hide X-Powered-By header (Helmet also handles this, but good practice to explicitly disable)
app.disable('x-powered-by');

// Use helmet for setting secure HTTP headers
app.use(helmet());

// Configure CORS
app.use(cors({
  origin: '*', // Replace with specific domains in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Use compression to reduce payload sizes
app.use(compression());

// Parse JSON bodies with limit to guard against body-size payload attacks (DOS)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Configure request rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    error: { details: 'Rate limit exceeded' },
  },
});
app.use(limiter);

// Custom request logger
app.use(requestLogger);

// Mount application routes
app.use(router);

// Handle 404 Route Not Found
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.url}`,
    error: { details: 'Endpoint does not exist' }
  });
});

// Global Error Middleware
app.use(errorHandler);

export default app;
