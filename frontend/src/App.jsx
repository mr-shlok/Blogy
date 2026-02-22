import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import BlogLanding from "./pages/BlogLanding";
import BlogEditor from "./pages/BlogEditor";
import PostDetails from "./pages/PostDetails";
import { LingoProviderWrapper } from "lingo.dev/react/client";
import { loadDictionary } from "./lingo/dictionary";
import { AuthProvider } from "./context/AuthContext";
import ChatBot from "./components/ChatBot";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', fontFamily: 'monospace' }}>
          <h1>Error Loading App</h1>
          <p>{this.state.error?.message}</p>
          <pre>{this.state.error?.stack}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="flex items-center justify-center h-screen text-xl">Loading...</div>}>
        <LingoProviderWrapper
          loadDictionary={loadDictionary}
          fallback={<div className="flex items-center justify-center h-screen text-xl">Loading Translations...</div>}
        >
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/blog" element={<BlogLanding />} />
                <Route path="/editor" element={<BlogEditor />} />
                <Route path="/post/:id" element={<PostDetails />} />
              </Routes>
              <ChatBot />
            </BrowserRouter>
          </AuthProvider>
        </LingoProviderWrapper>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
