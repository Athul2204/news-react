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

## Connect your backend

- **Login / signup / password**: the `onSubmit` in `LoginPage`, `SignupPage`, `SettingsPage` (throw an `Error` to show a message).
- **News / research / sources**: swap the imports from `src/data/*` for API calls.
- **Search**: submitting the search bar fires a `daybreak:search` event on `document` (as before). Listen for it or replace `SearchBar`'s submit handler with a navigation.
- **Collaboration / Blogging**: placeholder sidebar links (`#`); add routes in `App.jsx` and `Sidebar.jsx`.

## Notes

- `research.css`: the narrow-screen pager overrides are now scoped to `.research .pager…`. Previously each page loaded only its own CSS; with all CSS bundled, unscoped rules would have shrunk the dashboard pager too.
- There is no auth guard yet (as in the original). Wrap the `AppLayout` route in a protected-route component once you have real login.
