# Blogy - Frontend Application

The modern React frontend for Blogy - an AI-powered multilingual blog platform. Built with Vite, React Router, and Tailwind CSS for optimal performance and user experience.

## 🌟 Features

### Content Creation
- **Rich Text Editor** (TipTap) - Format posts with bold, italic, links, and more
- **Real-time Preview** - See changes as you type
- **Draft Management** - Auto-save drafts locally
- **Multiple Language Support** - Create posts in any of 8 languages

### Content Discovery
- **Blog Landing Page** - Browse all published posts
- **Spotlight Stories** - Horizontal carousel of featured posts
- **Post Details View** - Full post with metadata
- **Language Filtering** - Filter posts by language

### User Engagement
- **Voice Support** - Text-to-speech for posts (Listen button)
- **Share Button** - Native browser share API
- **Bookmark Feature** - Save posts to local storage
- **Comment System** - Reader feedback and discussions

### User Experience
- **Responsive Design** - Mobile, tablet, desktop optimized
- **Smooth Animations** - Framer Motion and GSAP animations
- **Custom Cursor** - Interactive magic wand cursor
- **Language Selector** - Switch between 8+ languages
- **Scroll Animations** - GSAP-powered scroll effects
- **Smooth Scrolling** - Lenis library integration

### Dashboard
- **Create Tab** - Write and publish new posts
- **My Posts Tab** - Manage personal posts (edit/delete)
- **All Posts Tab** - Browse entire platform
- **Profile Section** - View account information
- **Statistics** - Track posts and languages

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19 | UI Framework |
| Vite | 7.3+ | Build tool & dev server |
| React Router | 7.13+ | Client routing |
| Tailwind CSS | 3.4+ | Styling |
| Supabase JS | 2.93+ | Auth & database |
| Framer Motion | 12+ | Animations |
| GSAP | 3.12+ | Scroll animations |
| Lenis | Latest | Smooth scrolling |
| TipTap | Latest | Rich text editor |
| Lucide React | Latest | Icons |
| Lingo.dev | Latest | Translations |
| Axios | 1.13+ | HTTP client |

## 📋 Prerequisites

- **Node.js** v18+ and npm v10+
- **Supabase** account with project created
- **Lingo.dev** API key

## 🚀 Getting Started

### Installation

```bash
cd frontend
npm install
```

### Environment Setup

Create `.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:3001
```

### Development Server

```bash
npm run dev
```

Starts at [http://localhost:5173](http://localhost:5173)

### Production Build

```bash
npm run build
```

Output: `dist/` folder

## 📁 Project Structure

```
src/
├── components/
│   ├── AuthModal.jsx         # Login/signup modal
│   ├── ChatBot.jsx           # AI assistant component
│   ├── Grammy.jsx            # Grammar assistant
│   ├── LanguageSelector.jsx  # Language switcher
│   └── PremiumBackground.jsx # Animated background
│
├── pages/
│   ├── Home.jsx              # Landing page with animations
│   ├── Dashboard.jsx         # User dashboard (posts, create)
│   ├── BlogLanding.jsx       # Blog posts listing
│   ├── PostDetails.jsx       # Individual post view
│   ├── BlogEditor.jsx        # Post editor
│   ├── Login.jsx             # Login page
│   └── Signup.jsx            # Signup page
│
├── context/
│   └── AuthContext.jsx       # Authentication context
│
├── lib/
│   ├── supabase.js          # Supabase client
│   ├── ai.js                # AI utilities
│   └── lingo.js             # Translation utilities
│
├── locales/
│   ├── en.json              # English translations
│   ├── es.json              # Spanish translations
│   ├── fr.json              # French translations
│   ├── de.json              # German translations
│   ├── hi.json              # Hindi translations
│   ├── ja.json              # Japanese translations
│   ├── zh.json              # Chinese translations
│   └── ar.json              # Arabic translations
│
├── lingo/
│   ├── dictionary.js        # Language dictionary
│   └── meta.json            # i18n metadata
│
├── App.jsx                  # Main app component
├── main.jsx                 # Entry point
└── index.css               # Global styles
```

## 📄 Page Components

### Home (Home.jsx)
- **Scrollytelling**: 6-scene scroll animation sequence
- **Features Section**: Adaptive Context, Instant Mastery, Zero Friction
- **Testimonial**: Creator spotlight with profile
- **CTA Section**: Call-to-action for getting started
- **Responsive**: Works on all device sizes

### Dashboard (Dashboard.jsx)
- **Sidebar Navigation**: Create, My Posts, All Posts
- **Post Management**: View, edit, delete posts
- **Statistics Panel**: Total posts, languages, account info
- **Responsive Sidebar**: Collapse/expand on mobile

### Blog Landing (BlogLanding.jsx)
- **Hero Section**: About the platform
- **Post Grid**: All published posts
- **Language Filter**: Posts filtered by selected language
- **Post Cards**: Title, snippet, language, date
- **Empty State**: Message when no posts exist

### Post Details (PostDetails.jsx)
- **Full Post View**: Complete post content
- **Metadata**: Author, date, language, word count
- **AI Features**: Summary, insights, document reader
- **Comments**: Discussion section
- **Reader Mode**: Interactive reading experience

### Blog Editor (BlogEditor.jsx)
- **Rich Text Editor**: Format posts with TipTap
- **Language Selection**: Choose post language
- **AI Assist**: Grammar, tone, hashtags help
- **Asset Upload**: Attach files and links
- **Preview**: See post as it will appear

## 🎨 Styling

### Tailwind CSS Configuration
- Custom color scheme with indigo accent
- Responsive breakpoints: sm, md, lg, xl
- Glass-morphism effects
- Gradient utilities

### Global Styles (index.css)
- Custom scrollbar styling
- Spotlight cards animations
- Card hover effects
- Responsive typography

## 🔐 Authentication Flow

1. **User Registration** → Create account in Supabase
2. **Email Verification** → Confirm email address
3. **Login** → Auth context manages session
4. **Protected Routes** → Dashboard, Editor require auth
5. **Session Persistence** → Automatic on page reload
6. **Logout** → Clear session and redirect to home

## 🌍 Multilingual Support

### Supported Languages
- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Hindi (hi)
- Japanese (ja)
- Chinese (zh)
- Arabic (ar)

### Translation Implementation
- **Lingo.dev**: Real-time API translation
- **Locale Switching**: Dynamic language selection
- **Content Translation**: Posts auto-translate to selected language
- **UI Translation**: All UI text translated

## 📦 Key Dependencies

### UI & Animations
- **Framer Motion**: Page transitions, component animations
- **GSAP**: Scroll-triggered animations, parallax effects
- **Lenis**: Smooth scrolling experience
- **Lucide React**: Icon library (100+ icons)

### Forms & Input
- **TipTap**: Rich text editor with extensions
- **React Hook Form**: Form handling (optional)

### HTTP & Data
- **Axios**: HTTP client for API calls
- **Supabase JS**: Real-time database and auth

### Development
- **Vite**: Lightning-fast build tool
- **ESLint**: Code quality checking

## 🧪 Development Commands

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Platforms

**Vercel** (Recommended)
```bash
npm install -g vercel
vercel
```

**Netlify**
```bash
npm run build
# Upload dist/ folder to Netlify
```

**GitHub Pages**
```bash
npm run build
# Push dist/ to gh-pages branch
```

**Other Platforms**
- AWS Amplify
- Firebase Hosting
- Azure Static Web Apps

### Environment Variables in Production
Set these on your hosting platform:
```
VITE_SUPABASE_URL=your_production_url
VITE_SUPABASE_ANON_KEY=your_production_key
VITE_API_BASE_URL=https://your-backend-url.com
```

## 🎯 Key Features Deep Dive

### Spotlight Stories
- Horizontal scrolling carousel of featured posts
- Center 3 cards displayed bold and dark
- Side cards fade with reduced opacity
- Smooth scroll-triggered animations with GSAP
- Responsive on all devices

### Custom Cursor
- Magic wand SVG icon cursor
- Sparkle particles on mouse movement
- Blue particles in scrollytelling section
- Golden particles in blog section
- Smooth tracking and animations

### Scroll Animations
- **GSAP ScrollTrigger** for scroll-based animations
- **Parallax effects** on images
- **Fade in/out** on scroll
- **Scale transformations** during scroll
- **Text reveal** animations

### Voice Support
- Web Speech API integration
- Text-to-speech for post content
- Play/pause/stop controls
- Language-aware voice selection
- Real-time playback

### Share Feature
- Native browser sharing (Web Share API)
- Fallback to clipboard copy
- Share post title, snippet, URL
- Mobile and desktop compatible

### Bookmark System
- Client-side localStorage management
- Persistent across sessions
- Visual indicator for bookmarked posts
- Quick bookmark toggle

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 1024px (md-lg)
- **Desktop**: > 1024px (xl)

### Mobile Optimizations
- Touch-friendly button sizes
- Collapsible sidebar
- Stack layout for posts
- Optimized form inputs
- Full-width content

## 🔌 API Integration

### Backend Endpoints Used
- `POST /api/translate` - Content translation
- `GET /api/health` - Server health check

### Supabase Integration
- **Authentication**: Email/password
- **Database**: Posts, users, metadata
- **Real-time**: Subscriptions to data changes

## 📊 Performance Optimization

- **Code Splitting**: Vite automatic chunking
- **Lazy Loading**: React.lazy for routes
- **Image Optimization**: Unsplash with sizing
- **Caching**: Browser cache for assets
- **Minification**: Production build optimization

## 🤝 Contributing

1. Create a feature branch
2. Follow existing code style
3. Add meaningful commit messages
4. Test on multiple devices/browsers
5. Create pull request with description

## 📚 Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vite.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [React Router](https://reactrouter.com)
- [Supabase Docs](https://supabase.com/docs)
- [Lingo.dev API](https://lingo.dev)
- [GSAP Docs](https://gsap.com)
- [Framer Motion](https://www.framer.com/motion)

## 📝 License

MIT License - Open source and free to use

---

**Transform your writing into a global experience.**

For backend setup, see [Backend README](../backend/README.md)
For project overview, see [Main README](../README.md)
