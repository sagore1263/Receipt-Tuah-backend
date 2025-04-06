require('./init')();

const express = require('express');
const { accounts, receipts, purchases, items, categories, subcategories } = require('@m/mongo_models.js');
const hash = require('./hash')
const cors = require('cors');
const dateConvert = require('./dateConvert.js');
const initCategories = require('@m/init_categories.js');

const app = express();
const PORT = process.env.MONGO_PORT || 3001;

const purchasePopulate = [
    {
        path: 'items',
        select: '-purchase -__v'
    },
    {
        path: 'receipt',
        select: '-__v'
    }
];

app.use(cors({
    origin: '*', // Your React app's URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }));
app.use(express.json({ limit: '10mb' }));

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
        // username: email.split('@')[0],
        password: hash(password),
    });

    const { _id } = await account.save();
    // Give new account categories and subcategories
    await initCategories(_id);
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
    
    const { Date, Time, Merchant, Location, Items, Total, Tax, Other } = purchase.receipt;
    const new_purchase = {};
    const receipt = await new receipts({
        data: purchase.imageBytes,
        mimeType: purchase.mimeType,
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
    const subcategoryUpdates = [];
    const categoryNames = Items.map(item => item.category);
    const subcategoryNames = Items.map(item => item.subcategory);
    const categoryDocs = await categories.find({ account: id, name: { $in: [...new Set(categoryNames)] } });
    const subcategoryDocs = await subcategories.find({ account: id, name: { $in: [...new Set(subcategoryNames)] } });
    const itemsToInsert = [];

    for (const item of Items ?? []) {
        // ok for item categories to be null
        const category = categoryDocs.filter(category => category?.name == item.category)[0];
        const subcategory = subcategoryDocs.filter(subcategory => subcategory?.name == item.subcategory)[0];
        const new_item = await new items({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            category: category?._id,
            subcategory: subcategory?._id,
            purchase: _id
        }).save();
        categoryUpdates.push({
            updateOne: {
                filter: { _id: category?._id },
                update: { $push: { items: new_item._id } }
            }
        });
        subcategoryUpdates.push({
            updateOne: {
                filter: { _id: subcategory?._id },
                update: { $push: { items: new_item._id } }
            }
        });
        itemsToInsert.push(new_item._id);
    }
    await categories.bulkWrite(categoryUpdates);
    await subcategories.bulkWrite(subcategoryUpdates);
    await purchases.findByIdAndUpdate(_id, { $push: { items: { $each: itemsToInsert } } });

    account.data.purchases.push(_id);
    await account.save();

    console.log(`Receipt uploaded for account: ${id}`);
    res.status(200).json({ message: 'success', accountId: account._id });
});

/**
 * Return fully populated user data
 */
app.get('/userdata', async (req, res) => {
    const { id } = req.query;

    console.log(`User data request for id: ${id}`);

    const account = await accounts.findById(id);

    if (!account) {
        return res.status(400).json({ message: `Failed to find account with id ${id}` });
    }

    // Populate the account with purchases and categories
    const { settings, data } = await account.populate([
        {
            path: 'data.purchases',
            select: '-account -_id',
            populate: purchasePopulate
        },
        {
            path: 'data.categories',
            select: '-account -_id',
            populate: [
                {
                    path: 'items',
                    select: 'name quantity price -_id'
                },
                {
                    path: 'subcategories',
                    select: 'name items',
                    populate: {
                        path: 'items',
                        select: 'name quantity price -_id'
                    }
                }
            ]
        }
    ]);
    console.log(`User data retrieved for account: ${id}`);
    res.status(200).json({ message: 'success', settings: settings, data: data });
});

/**
 * Get receipt by id, deprecated
 */
app.get('/getreceipt', async (req, res) => {
    const { id } = req.query;

    console.log(`Receipt request for id: ${id}`);

    const receipt = await receipts.findById(id);

    if (!receipt) {
        return res.status(400).json({ message: `Failed to find receipt with id ${id}` });
    }

    console.log(`Receipt retrieved for id: ${id}`);
    res.status(200).json({ message: 'success', receipt: receipt });
});

const ONE_DAY = 86400000;
/**
 * Get purchases before date, exclusive
 */
app.get('/purchasesBeforeDate', async (req, res) => {
    const { id, date } = req.query;

    console.log(`Purchases before date for: ${id}`);

    let unixdate;
    try {
        unixdate = dateConvert(date);
    } catch {
        return res.status(400).json({ message: `Invalid date param: ${date}` });
    }

    const account = await accounts.findById(id);

    if (!account) {
        return res.status(400).json({ message: `Failed to find account with id ${id}` });
    }

    const result = await purchases.find({ account: id, date: { $lt: unixdate } }).lean().populate(purchasePopulate);

    res.status(200).json({ message: 'success', purchases: result });
});
/**
 * Get purchases between 2 dates, inclusive
 */
app.get('/purchasesBetweenDates', async (req, res) => {
    const { id, date1, date2 } = req.query;

    console.log(`Purchases between dates for: ${id}`);
    let unixdate1;
    let unixdate2;
    try {
        unixdate1 = dateConvert(date1);
        unixdate2 = dateConvert(date2) + ONE_DAY;
    } catch {
        return res.status(400).json({ message: `Invalid date param(s): ${date1}, ${date2}` });
    }

    const account = await accounts.findById(id);

    if (!account) {
        return res.status(400).json({ message: `Failed to find account with id ${id}` });
    }

    const result = await purchases.find({ account: id, date: { $gt: unixdate1, $lt: unixdate2 } }).lean().populate(purchasePopulate);

    res.status(200).json({ message: 'success', purchases: result });
});
/**
 * Get purchases after date, exclusive
 */
app.get('/purchasesAfterDate', async (req, res) => {
    const { id, date } = req.query;

    console.log(`Purchases after date for: ${id}`);

    let unixdate;
    try {
        unixdate = dateConvert(date) + ONE_DAY;
    } catch {
        return res.status(400).json({ message: `Invalid date param: ${date}` });
    }

    const account = await accounts.findById(id);

    if (!account) {
        return res.status(400).json({ message: `Failed to find account with id ${id}` });
    }

    const result = await purchases.find({ account: id, date: { $gt: unixdate } }).lean().populate(purchasePopulate);

    res.status(200).json({ message: 'success', purchases: result });
});

/**
 * Get purchases within X days
 */
app.get('/recentPurchases', async (req, res) => {
    const { id, days } = req.query;

    console.log(`Recent purchases for: ${id}`);

    if (Number.isNaN(Number(days))) {
        return res.status(400).json({ message: `Invalid days param: ${days}` });
    }

    const account = await accounts.findById(id);

    if (!account) {
        return res.status(400).json({ message: `Failed to find account with id ${id}` });
    }

    const unixdate = Date.now() - (Number(days) * ONE_DAY);

    const result = await purchases.find({ account: id, date: { $gt: unixdate } }).lean().populate(purchasePopulate);

    res.status(200).json({ message: 'success', purchases: result });
});

/**
 * Get items by category
 */
app.get('/itemsByCategory', async (req, res) => {
    const { id, category } = req.query;

    console.log(`Purchases by category for: ${id}`);

    const account = await accounts.findById(id);
    const categoryDoc = await categories.findOne({ name: category });

    if (!account) {
        return res.status(400).json({ message: `Failed to find account with id ${id}` });
    } else if (!categoryDoc) {
        return res.status(400).json({ message: `Category ${category} does not exist` });
    }

    let result = await items.aggregate([
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'category'
          }
        },
        { $unwind: '$category' },
        { $match: { 'category.name': category, 'category.account': id } }
    ]);
    // result = await result.populate();

    res.status(200).json({ message: 'success', items: result });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});