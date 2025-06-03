require('dotenv').config();

const express = require('express');
const path = require('path');
const ejs = require('ejs');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public'));

app.use((req, res, next) => {
   res.locals.activePath = req.path;
   next();
});

async function renderWithLayout(res, page, options = {}) {
   try {
      const body = await ejs.renderFile(
         path.join(__dirname, 'views/pages', `${page}.ejs`),
         options
      );
      res.render('layout', {
         ...options,
         body
      });
   } catch (err) {
      res.status(500).send('Error rendering page');
   }
}

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
   console.log(`Server is running on http://localhost:${PORT}`);
});