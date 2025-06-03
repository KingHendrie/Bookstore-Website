require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const ejs = require('ejs');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public'));

// Middleware: Make activePath available to all views for nav highlighting
app.use((req, res, next) => {
  res.locals.activePath = req.path;
  next();
});

// Helper: Capitalize for page titles
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Render with layout, handling 404 and 500
async function renderWithLayout(res, page, options = {}) {
  const pagePath = path.join(__dirname, 'views/pages', `${page}.ejs`);
  try {
    if (!fs.existsSync(pagePath)) {
      res.status(404);
      const body = await ejs.renderFile(
        path.join(__dirname, 'views/pages', '404.ejs'),
        options
      );
      return res.render('layout', {
        ...options,
        title: 'Page Not Found',
        body
      });
    }
    const body = await ejs.renderFile(pagePath, options);
    res.render('layout', {
      ...options,
      body
    });
  } catch (err) {
    res.status(500);
    try {
      const errorBody = await ejs.renderFile(
        path.join(__dirname, 'views/pages', '500.ejs'),
        { ...options, error: err }
      );
      res.render('layout', {
        ...options,
        title: 'Server Error',
        body: errorBody
      });
    } catch (errorPageErr) {
      res.send('A server error occurred.');
    }
  }
}

// Catch-all route for generic rendering based on URL path
app.get('*', (req, res, next) => {
  try {
    const segments = req.path.split('/').filter(Boolean);
    const page = segments[0] || 'home';
    const filter = segments.slice(1).join('/') || null;

    renderWithLayout(res, page, {
      title: capitalize(page),
      filter
    });
  } catch (err) {
    console.error('Error in catch-all route:', err);
    next(err);
  }
});

// 404 handler (fallback — rarely reached if using generic route)
app.use((req, res) => {
  res.status(404);
  renderWithLayout(res, '404', { title: 'Page Not Found' });
});

// 500 handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500);
  renderWithLayout(res, '500', { title: 'Server Error', error: err });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});