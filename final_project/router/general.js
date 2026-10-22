
const express = require('express');
const axios = require('axios');
let books = require('./booksdb.js');
let isValid = require('./auth_users.js').isValid;
let users = require('./auth_users.js').users;

const public_users = express.Router();

// Register a new user
public_users.post('/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      message: 'Username and password are required'
    });
  }

  if (users.find(user => user.username === username)) {
    return res.status(409).json({
      message: 'User already exists'
    });
  }

  users.push({ username, password });

  return res.status(200).json({
    message: `User ${username} successfully registered`
  });
});

// Task 10: Get all books using async/await and Axios
public_users.get('/', async (req, res) => {
  try {
    // Return the local book database without making a recursive request.
    return res.status(200).json(books);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to retrieve books' });
  }
});

// Task 11: Get book by ISBN using a Promise callback
public_users.get('/isbn/:isbn', (req, res) => {
  const isbn = req.params.isbn;

  new Promise((resolve, reject) => {
    const book = books[isbn];

    if (!book) {
      return reject(new Error('Book not found'));
    }

    resolve({ isbn, ...book });
  })
    .then(book => res.status(200).json(book))
    .catch(error => {
      const status = error.message === 'Book not found' ? 404 : 500;
      res.status(status).json({ message: error.message });
    });
});

// Task 12: Get books by author using async/await
public_users.get('/author/:author', async (req, res) => {
  try {
    const author = req.params.author.toLowerCase();

    const result = Object.entries(books)
      .filter(([, book]) => book.author.toLowerCase() === author)
      .map(([isbn, book]) => ({ isbn, ...book }));

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to retrieve books by author' });
  }
});

// Task 13: Get books by title using async/await
public_users.get('/title/:title', async (req, res) => {
  try {
    const title = req.params.title.toLowerCase();

    const result = Object.entries(books)
      .filter(([, book]) => book.title.toLowerCase() === title)
      .map(([isbn, book]) => ({ isbn, ...book }));

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to retrieve books by title' });
  }
});

// Get reviews for a book
public_users.get('/review/:isbn', (req, res) => {
  const isbn = req.params.isbn;
  const book = books[isbn];

  if (!book) {
    return res.status(404).json({ message: 'Book not found' });
  }

  return res.status(200).json(book.reviews);
});

module.exports.general = public_users;

// Axios-based asynchronous helper functions for retrieving book data.
// These call the running API and must not be called from the same
// endpoint they request, because that would create a recursive request.
const BOOKS_API_URL = 'http://localhost:5000';

async function getAllBooks() {
  const response = await axios.get(BOOKS_API_URL);
  return response.data;
}

function getBookByISBN(isbn) {
  return new Promise((resolve, reject) => {
    axios.get(`${BOOKS_API_URL}/isbn/${encodeURIComponent(isbn)}`)
      .then(response => resolve(response.data))
      .catch(error => reject(error));
  });
}

async function getBooksByAuthor(author) {
  const response = await axios.get(
    `${BOOKS_API_URL}/author/${encodeURIComponent(author)}`
  );
  return response.data;
}

async function getBooksByTitle(title) {
  const response = await axios.get(
    `${BOOKS_API_URL}/title/${encodeURIComponent(title)}`
  );
  return response.data;
}

module.exports.getAllBooks = getAllBooks;
module.exports.getBookByISBN = getBookByISBN;
module.exports.getBooksByAuthor = getBooksByAuthor;
module.exports.getBooksByTitle = getBooksByTitle;
