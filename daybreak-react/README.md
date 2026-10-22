# Daybreak News: React template

The original static HTML/CSS/JS template converted to **React 18 + Vite + React Router 6**.
All CSS and class names are unchanged, so the design is identical.

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build in dist/
```

## Routes

| Old file          | Route            | Component                    |
| ----------------- | ---------------- | ---------------------------- |
| login.html        | `/login`         | `pages/LoginPage.jsx`        |
| signup.html       | `/signup`        | `pages/SignupPage.jsx`       |
| dashboard.html    | `/dashboard`     | `pages/DashboardPage.jsx`    |
| article.html?id=7 | `/article/7`     | `pages/ArticlePage.jsx`      |
| saved.html        | `/saved`         | `pages/SavedPage.jsx`        |
| sources.html      | `/sources`       | `pages/SourcesPage.jsx`      |
| research.html     | `/research`      | `pages/ResearchPage.jsx`     |
| settings.html     | `/settings`      | `pages/SettingsPage.jsx`     |
| (new)             | `/insights`      | `pages/InsightsPage.jsx`     |

Pages with the navbar, sidebar and footer render inside `components/AppLayout.jsx`.

## Old script -> new code

| Old JS                    | React replacement                                   |
| ------------------------- | --------------------------------------------------- |
| theme.js                  | `hooks/useTheme.js` (+ inline script in index.html to avoid a flash) |
| sidebar.js, search.js     | state in `components/AppLayout.jsx`, `Sidebar`, `SearchBar` |
| news-feed.js, research.js | `Pager`, `NewsCard`, `hooks/usePageParam.js` (page kept in `#page=N`) |
| auth-form.js              | `hooks/useForm.js` + `lib/validation.js` + `components/FormField.jsx` |
| multi-select.js           | `components/MultiSelect.jsx`                        |
| article/saved/sources/settings.js | the matching page component, using `hooks/useLocalStorage.js` |
| news-data.js              | `data/news.js` (`export const NEWS_ITEMS`)          |

localStorage keys are unchanged (`daybreak:theme`, `:saved`, `:related`, `:sources`, `:prefs`, `:research`).

## Backend (added)

The app now talks to the FastAPI backend in `../backend` (see the main README one level up).
`vite.config.js` proxies `/api` to `http://127.0.0.1:8000` in development.

| Area | Code |
| ---- | ---- |
| API client + token (`localStorage` when "Keep me logged in", else `sessionStorage`) | `lib/api.js`, `lib/token.js` |
| Login state, route guards | `auth/AuthContext.jsx` (`RequireAuth`, `GuestOnly`) |
| Login / signup / settings | the three pages call `/api/auth/*` and `/api/me/*` |
| News feed with category pills | `pages/DashboardPage.jsx`, `components/CategoryTabs.jsx` |
| Story page: similar stories + "You might like" | `pages/ArticlePage.jsx` |
| Time spent per story (visible time only) | `hooks/useReadingTimer.js` |
| Reading insights + history | `pages/InsightsPage.jsx` |
| Saved stories (per account) | `pages/SavedPage.jsx` |

The category list in `data/options.js` (TOPICS) must match `backend/catalog.py` (CATEGORIES).
`data/news.js` (the dummy stories) was removed: stories now come from the API.

## Notes

- `research.css`: the narrow-screen pager overrides are now scoped to `.research .pager…`. Previously each page loaded only its own CSS; with all CSS bundled, unscoped rules would have shrunk the dashboard pager too.
- All signed-in routes are wrapped in `RequireAuth`; `/login` and `/signup` in `GuestOnly`.
