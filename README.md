# Blogy - AI-Powered Multilingual Blog Platform

A modern, full-stack blog platform that empowers creators to write once and reach readers across 100+ languages. Blogy combines real-time AI translation, interactive storytelling, and a seamless writing experience to break language barriers and build borderless communities.

**Write Once. Read in Any Language.**

## 🌟 Key Features

### Content Creation & Management
- ✍️ **Rich Text Editor** - Create blog posts with TipTap editor featuring formatting tools
- 📝 **Draft & Publish** - Save drafts and publish when ready
- 🔄 **Edit & Update** - Modify published posts anytime
- 🗑️ **Delete Posts** - Remove content with confirmation

### Multilingual & Translation
- 🌍 **8+ Languages** - Support for English, Spanish, French, German, Hindi, Japanese, Chinese, Arabic
- 🤖 **AI-Powered Translation** - Real-time translation using Lingo.dev
- 📖 **Language Selector** - Switch between languages dynamically
- 🔀 **Automatic Content Translation** - Posts automatically translated to selected language

### Discovery & Engagement
- ⭐ **Spotlight Stories** - Featured posts with horizontal scrolling carousel
- 📚 **Blog Landing** - Browse all published posts with language filtering
- 💬 **Voice Support** - Text-to-speech functionality for posts
- 🎯 **Search & Filter** - Find posts by language and date
- ❤️ **Bookmarks** - Save posts locally for later reading (localStorage)
- 📤 **Share** - Native share functionality for social media
- 🔊 **Listen** - Audio experience for blog content

### User Experience
- 📱 **Responsive Design** - Perfect experience on desktop, tablet, and mobile
- ✨ **Smooth Animations** - Framer Motion animations and transitions
- 🎨 **Dark-Light Mode Cards** - Center cards display bold, side cards fade on scroll
- 🖱️ **Custom Cursor** - Interactive magic wand cursor effect
- ⚡ **Smooth Scrolling** - Lenis smooth scroll library for enhanced navigation
- 🎭 **Scroll Animations** - GSAP scroll-triggered animations

### User Dashboard
- 👤 **Profile Management** - View user account details
- 📊 **Post Analytics** - Track total posts and languages
- ✨ **Creation Mode** - Dedicated interface for writing new posts
- 📖 **My Posts View** - Manage all personal blog posts
- 🌐 **All Posts View** - Browse entire blog platform

### Security & Authentication
- 🔐 **Supabase Auth** - Email/password authentication
- 🔑 **Session Management** - Secure user sessions
- 🛡️ **Protected Routes** - Dashboard and editor access restricted to authenticated users

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 19** | UI Framework |
| **Vite 7.3+** | Build tool & dev server |
| **Tailwind CSS 3.4+** | Styling & responsive design |
| **React Router 7.13+** | Client-side routing |
| **Framer Motion 12+** | Animations & interactions |
| **GSAP 3.12+** | Advanced scroll animations |
| **Lenis** | Smooth scrolling library |
| **Supabase JS 2.93+** | Authentication & database |
| **TipTap** | Rich text editor |
| **Lucide React** | Icon library |
| **Lingo.dev** | Translation service |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js 18+** | Runtime environment |
| **Express 4.18+** | Web framework |
| **Lingo.dev SDK** | Translation API |
| **Supabase SDK** | Database & authentication |
| **LangChain 0.3+** | AI integration framework |
| **Nodemon 3.0+** | Development auto-reload |

## 📋 Prerequisites

Before starting, ensure you have:
- **Node.js** v18 or higher
- **npm** v10+ or **pnpm** v10+
- **Supabase** account (free tier available)
- **Lingo.dev** API key (for translation)
- **xAI** API key (optional, for AI features)

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/mr-shlok/Blogy.git
cd Blogy
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `.env` file:
```env
PORT=3001
LINGO_API_KEY=your_lingo_api_key
XAI_API_KEY=your_xai_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

Start backend:
```bash
npm run dev
```

### 3. Frontend Setup
In a new terminal:
```bash
cd frontend
npm install
```

Create `.env.local` file:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:3001
```

Start frontend:
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📚 Detailed Documentation

- **[Frontend README](./frontend/README.md)** - Setup, components, and features
- **[Backend README](./backend/README.md)** - API endpoints and server configuration

## 🌐 Supported Languages

| Language | Code |
|----------|------|
| English | en |
| Spanish | es |
| French | fr |
| German | de |
| Hindi | hi |
| Japanese | ja |
| Chinese | zh |
| Arabic | ar |

## 📁 Project Structure

```
Blogy/
├── frontend/                    # React + Vite frontend
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   ├── pages/              # Page components (Home, Dashboard, etc.)
│   │   ├── context/            # React context (Auth)
│   │   ├── lib/                # Utilities and API clients
│   │   ├── locales/            # i18n language files
│   │   ├── lingo/              # Lingo SDK configuration
│   │   └── index.css           # Global styles
│   ├── public/                 # Static assets
│   ├── vite.config.js          # Vite configuration
│   ├── tailwind.config.js      # Tailwind configuration
│   └── package.json
│
├── backend/                     # Express.js backend
│   ├── server.js               # Main server file
│   ├── supabase/               # Database migrations
│   │   ├── supabase_setup.sql
│   │   └── add-metadata-column.sql
│   └── package.json
│
└── README.md                    # This file
```

## 🏗️ Core Features Breakdown

### Home Page
- Landing page with scroll animations
- Feature highlights (Adaptive Context, Instant Mastery, Zero Friction)
- Testimonial section with creator profile
- CTA buttons for getting started
- Blog landing page navigation

### Dashboard
- **Create Tab**: Write new posts with rich text editor
- **My Posts Tab**: View and manage personal posts
- **All Posts Tab**: Browse entire blog platform
- **Statistics**: Display total posts and supported languages
- **Profile**: User account information
- **Post Management**: Edit and delete functionality

### Blog Pages
- **Blog Landing**: Featured posts in grid layout
- **Post Details**: Full post view with metadata and interactions
- **Spotlight Stories**: Horizontal scrolling carousel of featured posts
  - Center 3 cards displayed dark/bold
  - Side cards fade with reduced opacity
  - Smooth scroll animations

### Interactive Features
- **Voice Support**: Text-to-speech for posts
- **Share Button**: Native browser sharing API
- **Bookmark**: Local storage for bookmarks
- **Read More**: Navigate between posts

## 🔌 API Endpoints (Backend)

### Translation
- `POST /api/translate` - Translate content between languages

### Health Check
- `GET /api/health` - Server status

## 🧪 Development Commands

### Frontend
```bash
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Production build
npm run lint     # ESLint check
npm run preview  # Preview production build
```

### Backend
```bash
npm run dev      # Development with auto-reload
npm start        # Production server
```

## 🚀 Deployment

### Frontend
```bash
cd frontend
npm run build
# Deploy dist/ folder to:
# - Vercel
# - Netlify
# - GitHub Pages
# - AWS Amplify
```

### Backend
```bash
cd backend
npm install
npm start
# Deploy to:
# - Railway
# - Render
# - Heroku
# - AWS EC2
```

Update `VITE_API_BASE_URL` in frontend to match deployed backend URL.

## 📖 Supported Routes

### Frontend Routes
- `/` - Home page
- `/login` - User login
- `/signup` - User registration
- `/dashboard` - User dashboard (protected)
- `/editor` - Blog editor (protected)
- `/blog` - Blog landing page
- `/post/:id` - Individual post view

## 🔐 Environment Variables Guide

### Backend (.env)
```env
# Server
PORT=3001

# Translation Service
LINGO_API_KEY=sk_...

# AI Service
XAI_API_KEY=xai_...

# Database
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJ...
```

### Frontend (.env.local)
```env
# Supabase
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJ...

# Backend API
VITE_API_BASE_URL=http://localhost:3001
```

## 💡 Performance Features

- **Scroll Animations**: GSAP-powered smooth animations triggered by scroll position
- **Image Optimization**: Unsplash images with proper sizing and optimization
- **Code Splitting**: Vite automatic code splitting for faster load times
- **Lazy Loading**: React lazy components for better performance
- **Smooth Scrolling**: Lenis library for smooth scroll experience
- **Custom Cursor**: GPU-accelerated cursor animations

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📞 Support & Resources

- **Supabase**: [https://supabase.com/docs](https://supabase.com/docs)
- **Lingo.dev**: [https://lingo.dev](https://lingo.dev)
- **React**: [https://react.dev](https://react.dev)
- **Vite**: [https://vite.dev](https://vite.dev)
- **Tailwind CSS**: [https://tailwindcss.com](https://tailwindcss.com)
- **GSAP**: [https://gsap.com](https://gsap.com)

## 📝 License

This project is open source and available under the MIT License.

---

**Made for the Global Creator Community** 🌍

Transform your writing into a borderless experience. Write once, reach everywhere.

**Get Started:** [Quick Start Guide](#-quick-start) | **Docs:** [Frontend](./frontend/README.md) | [Backend](./backend/README.md)
