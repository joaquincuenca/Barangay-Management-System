const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// MongoDB connection
mongoose.connect('mongodb+srv://joaquin:Q6FIRHk3mR75VbsY@cluster0.dxizzqg.mongodb.net/database?retryWrites=true&w=majority&appName=Cluster0')
.then(() => {
    console.log("database connected");
})
.catch(() => {
    console.log("database failed");
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
}));
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS as templating engine
app.set('view engine', 'ejs');

// User Schema and Model
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    lastname: { type: String, required: true },
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// Routes
app.get('/', (req, res) => {
    res.render('index', { isLogin: req.session.loggedIn });
});

app.get('/about', (req, res) => {
    res.render('about', { isLogin: req.session.loggedIn });
});

app.get('/services', (req, res) => {
    res.render('services', { isLogin: req.session.loggedIn });
});

app.get('/login', (req, res) => {
    res.render('login', { error: null, isLogin: req.session.loggedIn });
});

app.get('/signup', (req, res) => {
    res.render('signup', { isLogin: req.session.loggedIn });
});

app.get('/dashboard', (req, res) => {
    if (req.session.loggedIn) {
        res.render('dashboard', { isLogin: req.session.loggedIn });
    } else {
        res.redirect('/login');
    }
});

// Route handler for /employer
app.get('/employer', (req, res) => {
    res.render("employer.ejs");
});


app.get('/employee',(req, res) =>{
    res.render("employee.ejs");
});




app.post('/signup', async (req, res) => {
    const { name, lastname, username, email, password } = req.body;
    try {
        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('signup', { taken: "Email is already taken.", isLogin: req.session.loggedIn });
        }

        // If email does not exist, create a new user
        const newUser = new User({ name, lastname, username, email, password });
        await newUser.save();
        res.render('login', { error: null, isLogin: req.session.loggedIn });
    } catch (error) {
        console.error(error);
        res.render('signup', { taken: "An error occurred. Please try again.", isLogin: req.session.loggedIn });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username, password });
        if (user) {
            req.session.loggedIn =  true;
            res.redirect('/'); // Redirects to index.ejs on successful login
        } else {
            res.render('login', { error: 'Incorrect username or password', isLogin: req.session.loggedIn });
        }
    } catch (error) {
        res.render('login', { error: 'An error occurred. Please try again.', isLogin: req.session.loggedIn });
    }
});

// Sign out route
app.get('/signout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.redirect('/dashboard');
        }
        res.redirect('/');
    });
});



// Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
