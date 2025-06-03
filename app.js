require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const ejs = require('ejs');
const db = require('./db');
const logger = require('./logger');
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

// Helper: Check DB connection
async function checkDbConnection() {
  try {
    await db.raw('SELECT 1');
    logger.info('Successfully connected to MySQL database.');
    return true;
  } catch (err) {
    logger.error('Database connection error: ' + err.stack);
    return err;
  }
}

// Render with layout, handling 404 and 500
async function renderWithLayout(res, page, options = {}) {
  // Check DB connection first if requested
  if (options.requireDb) {
    const dbStatus = await checkDbConnection();
    if (dbStatus !== true) {
      res.status(500);
      logger.error('Could not render due to DB error: ' + dbStatus);
      try {
        const errorBody = await ejs.renderFile(
          path.join(__dirname, 'views/pages', '500.ejs'),
          { ...options, error: dbStatus }
        );
        return res.render('layout', {
          ...options,
          title: 'Database Error',
          body: errorBody
        });
      } catch (errorPageErr) {
        logger.error('Failed to render 500 page: ' + errorPageErr.stack);
        return res.send('A server/database error occurred.');
      }
    }
  }

  const pagePath = path.join(__dirname, 'views/pages', `${page}.ejs`);
  try {
    if (!fs.existsSync(pagePath)) {
      res.status(404);
      logger.warn(`Page not found: ${pagePath}`);
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
    logger.info(`Rendering page: ${page}`);
    res.render('layout', {
      ...options,
      body
    });
  } catch (err) {
    res.status(500);
    logger.error('Error rendering page: ' + err.stack);
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
      logger.error('Failed to render 500 error page: ' + errorPageErr.stack);
      res.send('A server error occurred.');
    }
  }
}

// Example route that requires DB
app.get('/profile', (req, res) => {
  logger.info('Profile page requested');
  renderWithLayout(res, 'profile', { title: 'Profile', requireDb: true });
});

// Catch-all route for generic rendering based on URL path
app.get('*', (req, res, next) => {
  try {
    const segments = req.path.split('/').filter(Boolean);
    const page = segments[0] || 'home';
    const filter = segments.slice(1).join('/') || null;
    logger.info(`Requested page: ${page} Filter: ${filter}`);
    renderWithLayout(res, page, {
      title: capitalize(page),
      filter
    });
  } catch (err) {
    logger.error('Error in catch-all route: ' + err.stack);
    next(err);
  }
});

// 404 handler (fallback)
app.use((req, res) => {
  res.status(404);
  logger.warn('404 - Page not found: ' + req.originalUrl);
  renderWithLayout(res, '404', { title: 'Page Not Found' });
});

// 500 handler
app.use((err, req, res, next) => {
  logger.error('500 - Server error: ' + err.stack);
  res.status(500);
  renderWithLayout(res, '500', { title: 'Server Error', error: err });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});