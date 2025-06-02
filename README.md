# Express.js App Setup Guide

This guide will help you set up a simple Node.js project using [Express.js](https://expressjs.com/), [dotenv](https://www.npmjs.com/package/dotenv), and [EJS](https://ejs.co/).

## Prerequisites

- [Node.js](https://nodejs.org/) installed on your machine
- [npm](https://www.npmjs.com/) (comes with Node.js)

## Setup Instructions

1. **Initialize a new Node.js project**

   ```bash
   npm init -y
   ```

2. **Install Express.js**

   ```bash
   npm install express
   ```

3. **Create your main app file**

   ```bash
   touch app.js
   ```

4. **Install dotenv for environment variable management**

   ```bash
   npm install dotenv
   ```

5. **Install EJS for templating**

   ```bash
   npm install ejs
   ```

## Starting the Server

To start your Express server, run:

```bash
node app.js
```

## Next Steps

- Set up your `app.js` with a basic Express server.
- Configure dotenv by creating a `.env` file for your environment variables.
- Use EJS as your view engine for dynamic HTML rendering.

## Example `app.js` (optional)

```js
require('dotenv').config();
const express = require('express');
const app = express();

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('index', { message: 'Hello, world!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

For more details, see the [Express.js documentation](https://expressjs.com/).