require('module-alias/register');
const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const mongoose = require('mongoose');
const { dbConnect } = require('@m/init_mongo.js');
const { accounts } = require('@m/mongo_models.js');
const hash = require('./hash')

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Connect DB
(async () => {
    await dbConnect();
})();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', async (req, res) => {
    res.json({ message: 'Welcome to the Express API!' });
});

app.post('/data', async (req, res) => {
    const receivedData = req.body;
    console.log('Received JSON:', receivedData);
  
    res.status(200).json({ message: 'JSON received successfully', data: receivedData });
});

app.post('/signup', async (req, res) => {
    const { email, password } = req.body;
    // Perform login logic here
    console.log(`Login attempt with email: ${email} and password: ${password}`);

    const exists = !!await accounts.findOne({ email: email });

    if (exists) {
        return res.status(400).json({ message: 'Account already exists with this email' });
    }

    const account = new accounts({
        email: email,
        username: email.split('@')[0],
        password: hash(password),
    });

    await account.save();
    console.log('Account created: ', email);

    return res.status(200).json({ message: 'Signup successful', email });
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    // Perform login logic here
    console.log(`Login attempt with email: ${email} and password: ${password}`);

    const account = await accounts.findOne({ email: email });

    if (!account) {
        return res.status(400).json({ message: 'Account does not exist with this email' });
    }

    if (hash(password) != account.password) {
        return res.status(400).json({ message: 'Incorrect password' });
    }

    res.status(200).json({ message: 'Login successful', email });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});