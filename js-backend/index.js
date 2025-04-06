require('module-alias/register');
const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const mongoose = require('mongoose');
const { dbConnect } = require('@m/init_mongo.js');
const { accounts } = require('@m/mongo_models.js');
const hash = require('./hash')
const cors = require('cors');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Connect DB
(async () => {
    await dbConnect();
})();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: 'http://localhost:3000', // Your React app's URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }));
app.use(express.json());

/**
 * Utility
 */

app.get('/', async (req, res) => {
    res.json({ message: 'Welcome to the Express API!' });
});

app.post('/data', async (req, res) => {
    const receivedData = req.body;
    console.log('Received JSON:', receivedData);
  
    res.status(200).json({ message: 'JSON received successfully', data: receivedData });
});

/**
 * User auth
 */

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

    const { _id } = await account.save();
    console.log(`Account created: Email: ${email}, id: ${_id}`);

    return res.status(200).json({ message: 'success', email: email, accountId: _id });
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    // Perform login logic here
    console.log(`Login attempt with email: ${email} and password: ${password}`);

    const account = await accounts.findOne({ email: email }).lean();

    if (!account) {
        return res.status(400).json({ message: 'Account does not exist with this email' });
    }

    if (hash(password) != account.password) {
        return res.status(400).json({ message: 'Incorrect password' });
    }

    res.status(200).json({ message: 'success', email: email, accountId: account._id });
});

/**
 * Receipt upload
 */
app.post('/receipt', async (req, res) => {
    const { id, receipt } = req.body;

    console.log(`Receipt upload attempt with id: ${id}`);

    const account = await accounts.findById(id);

    if (!account) {
        return res.status(400).json({ message: `Failed to find account with id ${id}` });
    } else if (!receipt) {
        return res.status(400).json({ message: 'No receipt data provided' });
    }
    
    const purchase = {};
    // await account.save();

    console.log(`Receipt uploaded for account: ${id}`);
    res.status(200).json({ message: 'success', accountId: account._id });
});

app.get('/userdata', async (req, res) => {
    const { id } = req.query;

    console.log(`User data request for id: ${id}`);

    const account = await accounts.findById(id);

    if (!account) {
        return res.status(400).json({ message: `Failed to find account with id ${id}` });
    }

    const { settings, data } = account.populate({
        path: 'data.purchases',
        select: 'total date items receipt',
        populate: {
            path: 'items',
            select: 'name quantity price'
        }
    }).popualte({
        path: 'data.categories',
        select: 'name items subcategories',
        populate: {
            path: 'items',
            select: 'name quantity price'
        }
    }).select('settings data');
    console.log(`User data retrieved for account: ${id}`);
    res.status(200).json({ message: 'success', settings: settings, data: data });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});