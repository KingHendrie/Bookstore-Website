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

// Render with layout, treating missing partials as 404s and rendering 500s for other errors
async function renderWithLayout(res, page, options = {}) {
  const pagePath = path.join(__dirname, 'views/pages', `${page}.ejs`);
  try {
    if (!fs.existsSync(pagePath)) {
      // If the page partial does not exist, render 404
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
    // If there's an error rendering the page, show the 500 error page
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
      // As a last resort, send plain text
      res.send('A server error occurred.');
    }
  }
}

// ----- Main Page Routes -----
app.get('/', (req, res) => {
  renderWithLayout(res, 'home', { title: 'Home' });
});
app.get('/browse', (req, res) => {
  renderWithLayout(res, 'browse', { title: 'Browse' });
});
app.get('/spotlight', (req, res) => {
  renderWithLayout(res, 'spotlight', { title: 'Spotlight' });
});
app.get('/contact', (req, res) => {
  renderWithLayout(res, 'contact', { title: 'Contact' });
});
app.get('/profile', (req, res) => {
  renderWithLayout(res, 'profile', { title: 'Profile' });
});

// ----- 404 Custom Error Handler -----
app.use((req, res, next) => {
  res.status(404);
  renderWithLayout(res, '404', { title: 'Page Not Found' });
});

// ----- 500 Custom Error Handler -----
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500);
  renderWithLayout(res, '500', { title: 'Server Error', error: err });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});