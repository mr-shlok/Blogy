# Blogy - Backend Server

Express.js backend for Blogy - an AI-powered multilingual blog platform. Provides translation APIs, content management, and serves the frontend application.

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Environment Setup

Create `.env` file:

```env
PORT=3001
LINGO_API_KEY=your_lingo_api_key
XAI_API_KEY=your_xai_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Start Development

```bash
npm run dev
```

Server runs on `http://localhost:3001`

## 📋 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 3001) | No |
| `LINGO_API_KEY` | Lingo.dev API key for translations | Yes* |
| `XAI_API_KEY` | xAI/Grok API key for AI features | Yes* |
| `SUPABASE_URL` | Supabase project URL | Optional |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Optional |

*Required if using corresponding features

## 📦 Dependencies

### Core Framework
- **express** v4.18+ - Web server framework
- **cors** - Cross-Origin Resource Sharing middleware
- **dotenv** - Environment variable loader

### Translation & AI
- **lingo.dev** - Multi-language translation SDK
- **langchain** v0.3+ - AI framework
- **@langchain/core** - LangChain core utilities
- **@langchain/xai** - xAI/Grok integration

### Development
- **nodemon** v3.0+ - Auto-reload development server

## 📁 Project Structure

```
backend/
├── server.js              # Main Express application
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables (not in git)
├── .env.example          # Example env template
├── .gitignore            # Git ignore rules
├── README.md             # This file
│
└── supabase/             # Database migrations
    ├── supabase_setup.sql     # Initial database schema
    └── add-metadata-column.sql # Additional migrations
```

## 🔌 API Endpoints

### Translation Service

#### POST `/api/translate`

Translate content between languages using Lingo.dev.

**Request:**
```json
{
  "content": "Hello, world!",
  "sourceLang": "en",
  "targetLang": "es"
}
```

**Response (Success):**
```json
{
  "translatedContent": "¡Hola, mundo!"
}
```

**Response (Error):**
```json
{
  "error": "Missing required parameters: content, sourceLang, targetLang"
}
```

**Status Codes:**
- `200` - Translation successful
- `400` - Missing or invalid parameters
- `500` - Server error or service unavailable

**Notes:**
- Returns original content if source and target languages match
- Requires `LINGO_API_KEY` configured
- Supports all 8 languages: en, es, fr, de, hi, ja, zh, ar

### Health Check

#### GET `/api/health`

Check server health and status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-22T12:00:00Z"
}
```

## 🧪 Development Commands

### Development Mode (Auto-reload)
```bash
npm run dev
```
Uses Nodemon to restart server on file changes.

### Production Mode
```bash
npm start
```
Runs server normally without auto-reload.

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 18+ | Runtime |
| Express | 4.18+ | Web framework |
| Lingo.dev | Latest | Translation API |
| LangChain | 0.3+ | AI framework |
| xAI | Integration | LLM provider |
| Supabase | SDK | Database & Auth |

## 🔐 CORS Configuration

Currently enabled for all origins (`*`). For production:

```javascript
const cors = require('cors');
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS || 'http://localhost:3001',
  credentials: true
}));
```

## 📖 Services

### Translation Service (Lingo.dev)

Handles content translation between languages:

```javascript
const engine = new LingoDotDevEngine({ 
  apiKey: process.env.LINGO_API_KEY 
});

const translation = await engine.translateContent(
  content, 
  sourceLang, 
  targetLang
);
```

**Supported Languages:**
- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Hindi (hi)
- Japanese (ja)
- Chinese (zh)
- Arabic (ar)

### AI Service (LangChain + xAI)

Integrates with xAI's Grok model for AI features:

```javascript
import { ChatXAI } from '@langchain/xai';

const model = new ChatXAI({
  apiKey: process.env.XAI_API_KEY,
  model: 'grok-2-1212',
  temperature: 0.7
});
```

## 🗄️ Database Setup

### Supabase Configuration

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your credentials:
   - Project URL → `SUPABASE_URL`
   - Anon Key → `SUPABASE_ANON_KEY`

### Database Migrations

Run these SQL migrations in Supabase SQL Editor:

**1. Initial Setup** (`supabase_setup.sql`)
- Creates base tables and schema
- Sets up authentication
- Defines posts table
- Sets up user profiles

**2. Additional Columns** (`add-metadata-column.sql`)
- Adds metadata JSON column
- Extends existing tables
- Creates indexes for performance

## 🚀 Deployment

### Hosting Options

#### Railway (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Connect and deploy
railway link
railway up
```

#### Render
1. Connect GitHub repository
2. Create new Web Service
3. Set environment variables
4. Deploy

#### Heroku (Legacy)
```bash
# Deploy directly from git
git push heroku main
```

#### AWS EC2
```bash
# Install Node.js on EC2 instance
curl https://deb.nodesource.com/setup_18.x | sudo bash
sudo apt install nodejs

# Install PM2 for process management
npm install -g pm2

# Start app
pm2 start server.js
pm2 save
pm2 startup
```

### Environment Variables in Production

Set these on your hosting platform dashboard:
```
PORT=3001
LINGO_API_KEY=<your_key>
XAI_API_KEY=<your_key>
SUPABASE_URL=<your_url>
SUPABASE_ANON_KEY=<your_key>
NODE_ENV=production
```

### Production Best Practices

1. **Use PM2** for process management and auto-restart
2. **Enable HTTPS** with SSL certificates
3. **Set up monitoring** with error tracking
4. **Implement rate limiting** for API endpoints
5. **Use environment variables** for all secrets
6. **Enable CORS restrictions** for production domain
7. **Add request logging** with Winston or similar
8. **Set up health checks** for monitoring

## 📊 Middleware Stack

### Built-in Middleware
- **CORS** - Enable cross-origin requests
- **express.json()** - Parse JSON request bodies
- **express.urlencoded()** - Parse URL-encoded data

### Security Considerations
- Never commit `.env` files
- Use environment variables for secrets
- Validate all inputs
- Implement rate limiting
- Use HTTPS in production

## 🔄 Request/Response Flow

### Translation Request Flow
1. Frontend sends POST to `/api/translate`
2. Backend validates required fields
3. Lingo.dev API translates content
4. Backend returns translated content
5. Frontend displays translated post

### Error Handling
- Invalid parameters → 400 Bad Request
- Missing API keys → 500 Server Error
- Service unavailable → 503 Service Unavailable
- Invalid language codes → 400 Bad Request

## 📝 API Documentation

### Request Headers
```
Content-Type: application/json
```

### Response Headers
```
Content-Type: application/json
```

### Error Response Format
```json
{
  "error": "Error message describing what went wrong"
}
```

## 🧪 Testing

### Test Translation Endpoint
```bash
curl -X POST http://localhost:3001/api/translate \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello",
    "sourceLang": "en",
    "targetLang": "es"
  }'
```

### Test Health Check
```bash
curl http://localhost:3001/api/health
```

## 📊 Performance Optimization

- **Caching** - Implement response caching for frequently translated phrases
- **Connection Pooling** - Use connection pools for database
- **Load Balancing** - Use load balancer in production
- **CDN** - Serve static assets via CDN

## 🔐 Security Checklist

- [ ] Environment variables never committed to git
- [ ] CORS properly configured for production
- [ ] API keys rotated regularly
- [ ] Input validation on all endpoints
- [ ] Rate limiting implemented
- [ ] HTTPS enabled in production
- [ ] Error messages don't leak sensitive info
- [ ] Request logging configured

## 📚 Resources

- [Express.js Documentation](https://expressjs.com)
- [Lingo.dev API Docs](https://lingo.dev/docs)
- [LangChain Documentation](https://js.langchain.com)
- [xAI API Guide](https://docs.xai.com)
- [Supabase Documentation](https://supabase.com/docs)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides)

## 🤝 Contributing

1. Follow Express.js conventions
2. Add error handling to new endpoints
3. Document new API endpoints
4. Test endpoints before pushing
5. Update this README if adding features

## 📝 License

MIT License - Open source and free to use

---

**Powering global content translation and delivery.**

For frontend setup, see [Frontend README](../frontend/README.md)
For project overview, see [Main README](../README.md)
