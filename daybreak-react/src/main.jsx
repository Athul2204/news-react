import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './auth/AuthContext';

/* Same cascade order the HTML pages used; mobile.css must stay last. */
import './styles/tokens.css';
import './styles/components.css';
import './styles/navbar.css';
import './styles/sidebar.css';
import './styles/news.css';
import './styles/article.css';
import './styles/signup.css';
import './styles/saved.css';
import './styles/research.css';
import './styles/settings.css';
import './styles/sources.css';
import './styles/insights.css';
import './styles/mobile.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
