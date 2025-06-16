import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Auth middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    // Allow health check without auth
    if (req.path === '/health' || req.path === '/') {
        return next();
    }

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Access token required' 
        });
    }

    // Check if token matches our API key
    const validToken = process.env.API_TOKEN || 'your-secret-api-token-here';
    
    if (token !== validToken) {
        return res.status(403).json({ 
            success: false, 
            message: 'Invalid token' 
        });
    }

    next();
};

// Apply auth middleware to all routes except health check
app.use(authenticateToken);

// Health check
app.get('/health', (req, res) => {
    console.log('Health check called');
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'development',
        auth: 'Token required for API endpoints'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.status(200).json({ 
        message: 'API Ruum is running!',
        timestamp: new Date().toISOString(),
        endpoints: [
            'GET /health - Health check (no auth)',
            'POST /api/chatgpt - ChatGPT Vision API (requires Bearer token)'
        ],
        auth: 'Use Bearer token in Authorization header'
    });
});

// Import routes only after basic setup
try {
    const { default: chatgptRoute } = await import("./routes/sendChatGpt.js");
    app.use("/api", chatgptRoute);
    console.log("✅ ChatGPT route loaded");
} catch (error) {
    console.error("❌ Failed to load ChatGPT route:", error.message);
}

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 8080;

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🏥 Health: http://0.0.0.0:${PORT}/health`);
    console.log(`🔐 API Token: ${process.env.API_TOKEN || 'NOT SET'}`);
});

server.on('error', (error) => {
    console.error('❌ Server error:', error);
    process.exit(1);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM received');
    server.close(() => process.exit(0));
});