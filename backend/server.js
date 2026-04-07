require('dotenv').config({ override: true });
require('express-async-errors'); // Handles async errors without try-catch blocks in controllers
const cors = require("cors");
const express = require('express');
const app = express();
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const setupSocketIO = require('./config/socketIO');

// --- Routers ---
const authRouter = require('./routes/authRoutes');
const jobsRouter = require('./routes/jobRoutes'); // <-- NEW IMPORT: Job Routes
const userRouter = require('./routes/userRoutes');
const applicationRouter = require('./routes/applicationRoutes');
const analyticsRouter = require('./routes/analyticsRoutes'); // <-- NEW IMPORT: Analytics Routes
const adminRouter = require('./routes/adminRoutes'); // <-- NEW IMPORT: Admin Routes
const testimonialRouter = require('./routes/testimonialRoutes'); // <-- NEW IMPORT: Testimonial Routes
const notificationRouter = require('./routes/notificationRoutes'); // <-- NEW IMPORT: Notification Routes
const contactRouter = require('./routes/contactRoutes'); // <-- NEW IMPORT: Contact Routes
const chatRouter = require('./routes/chatRoutes'); // <-- NEW IMPORT: Chat Routes
const messageRouter = require('./routes/messageRoutes');
const aiRouter = require('./routes/aiRoutes'); // AI/chat helper routes

const { CustomAPIError, UnauthenticatedError, BadRequestError, NotFoundError } = require('./errors');
// --- Middleware ---
const authenticateUser = require('./middleware/auth'); // <-- NEW IMPORT: JWT Authentication Middleware

const express = require("express");


// ✅ ADD HERE
app.use(cors());

app.use(express.json());

// your routes here
// app.use("/api", require("./routes/..."));

// ✅ ADD THIS AT END
// const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



// Import HTTP status codes
const StatusCodes = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
};

// Get port from environment variable or use fallback
const PORT = process.env.PORT || 5000;
const FALLBACK_PORT = process.env.FALLBACK_PORT || 5001;
const API_BASE =
    process.env.API_BASE ||
    process.env.REACT_APP_API_URL ||
    'http://localhost:5001/api/v1'; // use 5001
// Connect to MongoDB
connectDB();

// Middleware for parsing JSON
app.use(express.json());

// CORS configuration
const corsOptions = {
    origin: true, // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    credentials: true,
    maxAge: 86400 // 24 hours
};

// Apply CORS configuration
app.use(cors(corsOptions));

// Serve static files from uploads directory
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/v1/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware to handle 404 for static files specifically
app.use('/uploads', (req, res, next) => {
    const filePath = path.join(__dirname, 'uploads', req.path);
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // File does not exist, return a transparent pixel to prevent CORB for image requests
            if (req.path.match(/\.(jpeg|jpg|gif|png|svg)$/i)) {
                res.writeHead(200, {
                    'Content-Type': 'image/gif',
                    'Content-Length': '43' // Length of a 1x1 transparent GIF
                });
                // A 1x1 transparent GIF
                res.end(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
                return;
            }
        }
        next(); // File exists or is not an image, proceed to express.static
    });
});
app.use('/api/v1/uploads', (req, res, next) => {
    const filePath = path.join(__dirname, 'uploads', req.path.replace('/api/v1', ''));
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            if (req.path.match(/\.(jpeg|jpg|gif|png|svg)$/i)) {
                res.writeHead(200, {
                    'Content-Type': 'image/gif',
                    'Content-Length': '43'
                });
                res.end(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
                return;
            }
        }
        next();
    });
});

// Routes
// Health Check
app.get('/', (req, res) => {
    res.status(StatusCodes.OK).json({ msg: 'RojgarSathi API is running smoothly.' });
});

// Public Route (Authentication)
app.use('/api/v1/auth', authRouter);
app.use('/api/auth', authRouter);
app.use('/auth', authRouter);

// Protected Routes (Jobs and User Profiles)
// Remove authenticateUser middleware from /api/v1/jobs route to allow public GET access
app.use('/api/v1/jobs', jobsRouter); // <-- UPDATED ROUTE

// User profile routes (protected)
app.use('/api/v1/user', authenticateUser, userRouter);

// Admin routes (protected)
app.use('/api/v1/admin', authenticateUser, adminRouter);

// Job applications routes (protected)
app.use('/api/v1/applications', authenticateUser, applicationRouter);

// Analytics routes (protected)
app.use('/api/v1/analytics', authenticateUser, analyticsRouter);

// Notification routes (protected)
app.use('/api/v1/notifications', authenticateUser, notificationRouter);

// Testimonial routes (public)
app.use('/api/v1/testimonials', testimonialRouter);

// Contact routes (public for POST, admin for others)
app.use('/api/v1/contacts', contactRouter);

// Chat routes (protected)
app.use('/api/v1/chat', chatRouter);

// Media messaging upload route
app.use('/api/messages', messageRouter);

// AI helper routes (public)
app.use('/api/ai', aiRouter);

// Basic 404 Handler
app.use((req, res) => {
    res.status(StatusCodes.NOT_FOUND).json({ msg: 'Route not found' });
});

// Basic Error Handler (Centralized)
app.use((err, req, res, next) => {
    console.error(err); // Log the full error for debugging

    let customError = {
        statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
        msg: err.message || 'Something went wrong, please try again later.',
    };

    // Handle custom API errors
    if (err instanceof CustomAPIError) {
        customError.statusCode = err.statusCode;
        customError.msg = err.message;
    } else if (err instanceof UnauthenticatedError) {
        customError.statusCode = err.statusCode;
        customError.msg = err.message;
    } else if (err instanceof BadRequestError) {
        customError.statusCode = err.statusCode;
        customError.msg = err.message;
    } else if (err instanceof NotFoundError) {
        customError.statusCode = err.statusCode;
        customError.msg = err.message;
    }

    // Handle Mongoose duplicate key error (e.g., for unique email)
    if (err.code && err.code === 11000) {
        customError.msg = `Duplicate value entered for ${Object.keys(err.keyValue)} field, please choose another value.`;
        customError.statusCode = StatusCodes.BAD_REQUEST;
    }

    const { statusCode, msg } = customError;
    res.status(statusCode).json({ msg });
});

const fs = require('fs');

const startServer = async () => {
    try {
        // Create upload directories if they don't exist
        const uploadDir = path.join(__dirname, 'uploads');
        const photosDir = path.join(uploadDir, 'photos');
        const resumesDir = path.join(uploadDir, 'resumes');
        const imageDir = path.join(uploadDir, 'images');
        const videoDir = path.join(uploadDir, 'videos');
        const audioDir = path.join(uploadDir, 'audio');
        const docsDir = path.join(uploadDir, 'docs');
        const backupsDir = path.join(__dirname, 'backups');

        [uploadDir, photosDir, resumesDir, imageDir, videoDir, audioDir, docsDir, backupsDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`Created directory: ${dir}`);
            }
        });

        // Create HTTP server from Express app
        const server = http.createServer(app);

        // Initialize Socket.IO
        const io = socketIO(server, {
            cors: {
                origin: process.env.FRONTEND_URL || '*',
                methods: ['GET', 'POST'],
                allowedHeaders: ['Content-Type', 'Authorization'],
                credentials: true
            },
            transports: ['websocket', 'polling']
        });

        // Setup Socket.IO event handlers
        setupSocketIO(io);

        // Try to start server on primary port first
        server.listen(PORT, () => {
            console.log(`Server is listening on port ${PORT}...`);
            console.log(`API is available at http://localhost:${PORT}`);
            console.log(`WebSocket ready on ws://localhost:${PORT}`);
        }).on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.log(`Port ${PORT} is busy, trying alternate port ${FALLBACK_PORT}...`);
                server.close();
                
                // Try fallback port
                const fallbackHttpServer = http.createServer(app);
                const fallbackIO = socketIO(fallbackHttpServer, {
                    cors: {
                        origin: process.env.FRONTEND_URL || '*',
                        methods: ['GET', 'POST'],
                        allowedHeaders: ['Content-Type', 'Authorization'],
                        credentials: true
                    },
                    transports: ['websocket', 'polling']
                });
                setupSocketIO(fallbackIO);

                fallbackHttpServer.listen(FALLBACK_PORT, () => {
                    console.log(`Server is listening on alternate port ${FALLBACK_PORT}...`);
                    console.log(`API is available at http://localhost:${FALLBACK_PORT}`);
                    console.log(`WebSocket ready on ws://localhost:${FALLBACK_PORT}`);
                }).on('error', (err) => {
                    console.error('Failed to start server:', err);
                    process.exit(1);
                });
            } else {
                console.error('Failed to start server:', err);
                process.exit(1);
            }
        });
    } catch (error) {
        console.log('Failed to start server:', error);
    }
};

startServer();
