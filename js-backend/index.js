require('module-alias/register');
const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const mongoose = require('mongoose');
const { dbConnect } = require('@m/init_mongo.js');
const { accounts, receipts, purchases, items, categories } = require('@m/mongo_models.js');
const hash = require('./hash')
const cors = require('cors');
const dateConvert = require('./dateConvert.js');

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
    const { id, purchase } = req.body;

    console.log(`Receipt upload attempt with id: ${id}`);

    const account = await accounts.findById(id);

    if (!account) {
        return res.status(400).json({ message: `Failed to find account with id ${id}` });
    } else if (!purchase) {
        return res.status(400).json({ message: 'No purchase data provided' });
    }
    
    const { Date, Time, Merchant, Location, Items, Category, Subcategory, Total, Tax, Other } = purchase.receipt;
    const new_purchase = {};
    const receipt = await new receipts({
        data: purchase.imageBytes,
        size: purchase.imageSize,
        mode: purchase.imageMode
    }).save();
    new_purchase.date = dateConvert(Date, Time);
    new_purchase.merchant = Merchant;
    new_purchase.location = Location;
    new_purchase.tax = Tax;
    new_purchase.total = Total;
    new_purchase.receipt = receipt._id; // Can just set to the object, but this is more explicit
    new_purchase.account = id;
    new_purchase.items = [];
    const { _id } = await new purchases(new_purchase).save();

    const categoryUpdates = [];
    const categoryNames = Items.map(item => item.category);
    const categoryDocs = await categories.find({ name: { $in: [...new Set(categoryNames)] } });
    const itemsToInsert = [];

    for (const item of Items) {
        const category = categoryDocs.filter(category => category.name == item.category)[0];
        const new_item = await new items({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            category: category,
            purchase: _id
        }).save();
        categoryUpdates.push({
            updateOne: {
                filter: { _id: category._id },
                update: { $push: { items: new_item._id } }
            }
        });
        itemsToInsert.push(new_item._id);
    }
    await categories.bulkWrite(categoryUpdates);
    await purchases.findByIdAndUpdate(_id, { $push: { items: { $each: itemsToInsert } } });

    account.data.purchases.push(_id);
    await account.save();

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

    await account.populate({
        path: 'data.purchases',
        select: 'total date items receipt',
        populate: {
            path: 'items',
            select: 'name quantity price'
        }
    });
    const { settings, data } = await account.populate({
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