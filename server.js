const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const db = require('./db');
const path = require('path');

const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'views')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('public'));
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true
}));

// Home page (only accessible when logged in)
app.get('/', (req, res) => {
    if (!req.session.loggedin) {
        return res.redirect('/login');
    }
    // db.query('SELECT * FROM products', (err, result) => {
    //     if (err) throw err;
    //     console.log(result);
    //     res.render('home', { user: req.session.username, products: result });
    // });
    //res.render('home', { user: req.session.username });
    db.query('SELECT * FROM products', (err, result) => {
    if (err) {
        console.error('Error fetching products:', err);
        return res.status(500).send('Error fetching products');
    }

    console.log('Products fetched:', result);

    res.render('home', { user: req.session.username, products: result });
});
});

// Registration Page
app.get('/register', (req, res) => {
    res.render('register');
});

// Handle Registration
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.send('Please fill out all fields');
    }

    // Check if the username already exists in the database
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            return res.send('Username already exists, please choose another.');
        }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Insert user into the database
        db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err, result) => {
            if (err) {
                console.error(err);
                return res.send('Error occurred during registration');
            }
            res.redirect('/login');
        });
    });
});


// Route to display product details based on ID
app.get('/product/:id', (req, res) => {
    const productId = req.params.id;  // Get product ID from URL
    const query = 'SELECT * FROM products WHERE id = ?';  // Query to get product by ID

    db.query(query, [productId], (err, results) => {
        if (err) {
            console.error('Error fetching product:', err);
            res.status(500).send('Error fetching product');
        } else if (results.length === 0) {
            res.status(404).send('Product not found');
        } else {
            const product = results[0];  // Get the single product from the result set
            res.render('product', { product });  // Pass the product to the product.ejs view
        }
    });
});


// Login Page
app.get('/login', (req, res) => {
    res.render('login');
});

// Handle Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.send('Please fill out all fields');
    }

    // Check if user exists in database
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) throw err;

        if (results.length === 0) {
            return res.send('User not found');
        }

        const user = results[0];

        // Check password match
        if (!bcrypt.compareSync(password, user.password)) {
            return res.send('Incorrect password');
        }

        // Set session
        req.session.loggedin = true;
        req.session.username = username;
        res.redirect('/');
    });
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Server listening
app.listen(2018, () => {
    console.log('Server started on http://localhost:2018');
});
