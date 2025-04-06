require('./init')();

const express = require('express');
const { accounts, receipts, purchases, items, categories, subcategories } = require('@m/mongo_models.js');
const hash = require('./hash')
const cors = require('cors');
const dateConvert = require('./dateConvert.js');
const initCategories = require('@m/init_categories.js');

const app = express();
const PORT = process.env.MONGO_PORT || 3001;

const itemCategoryPop = [
    {
        path: 'category',
        select: 'name -_id',
    },
    {
        path: 'subcategory',
        select: 'name -_id',
    }
];
const purchasePopulate = [
    {
        path: 'items',
        select: '-purchase -__v -_id',
        populate: itemCategoryPop
    }
];

const purchasePopulateImage = [
    {
        path: 'items',
        select: '-purchase -__v -_id',
        populate: itemCategoryPop
    },
    {
        path: 'receipt',
        select: '-__v -_id'
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

    console.log(`Receipt upload attempt with id: ${id}\nReceipt data: ${JSON.stringify(purchase.receipt, null, 4)}`);

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
    const categoryNames = Items.map(item => item.Category);
    const subcategoryNames = Items.map(item => item.SubCategory);
    const categoryDocs = await categories.find({ account: id, name: { $in: [...new Set(categoryNames)] } });
    const subcategoryDocs = await subcategories.find({ account: id, name: { $in: [...new Set(subcategoryNames)] } });
    const itemsToInsert = [];

    for (const item of Items ?? []) {
        // ok for item categories to be null
        const category = categoryDocs.filter(category => category?.name == item.Category)[0];
        const subcategory = subcategoryDocs.filter(subcategory => subcategory?.name == item.SubCategory)[0];
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
    const { id, image } = req.query;

    console.log(`User data request for id: ${id}`);

    const account = await accounts.findById(id);

    if (!account) {
        return res.status(400).json({ message: `Failed to find account with id ${id}` });
    }

    // Populate the account with purchases and categories
    const { settings, data } = await account.populate([
        {
            path: 'data.purchases',
            select: '-account -__v -_id',
            populate: image ? purchasePopulateImage : purchasePopulate
        },
        {
            path: 'data.categories',
            select: '-account -__v -_id',
            populate: [
                {
                    path: 'items',
                    select: 'name purchase quantity price -_id'
                },
                {
                    path: 'subcategories',
                    select: 'name items -_id',
                    populate: {
                        path: 'items',
                        select: 'name purchase quantity price -_id'
                    }
                }
            ]
        }
    ]);
    const lifetimeTotal = data.purchases.reduce((acc, purchase) => {
        return acc + purchase.total;
    }, 0);
    console.log(`User data retrieved for account: ${id}`);
    res.status(200).json({ message: 'success', settings: settings, data: data, lifetimeTotal: lifetimeTotal});
});

/**
 * Get receipt by id
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
    const { id, date, image } = req.query;

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

    const result = await purchases.find({ account: id, date: { $lt: unixdate } }).lean().populate(image ? purchasePopulateImage : purchasePopulate);

    const total = result.reduce((acc, purchase) => {
        return acc + purchase.total;
    }, 0);

    res.status(200).json({ message: 'success', purchases: result, total: total });
});
/**
 * Get purchases between 2 dates, inclusive
 */
app.get('/purchasesBetweenDates', async (req, res) => {
    const { id, date1, date2, image } = req.query;

    console.log(`Purchases between dates for: ${id}`);
    let unixdate1;
    let unixdate2;
    try {
        unixdate1 = dateConvert(date1);
        unixdate2 = dateConvert(date2) + ONE_DAY;
    } catch {
        return res.status(400).json({ message: `Invalid date param(s): ${date1}, ${date2}` });
    }

    const days = Math.floor((unixdate2 - unixdate1) / ONE_DAY);

    const account = await accounts.findById(id);

    if (!account) {
        return res.status(400).json({ message: `Failed to find account with id ${id}` });
    }

    const result = await purchases.find({ account: id, date: { $gt: unixdate1, $lt: unixdate2 } }).lean().populate(image ? purchasePopulateImage : purchasePopulate);

    const total = result.reduce((acc, purchase) => {
        return acc + purchase.total;
    }, 0);

    res.status(200).json({ message: 'success', purchases: result, total: total, average: total / days });
});
/**
 * Get purchases after date, exclusive
 */
app.get('/purchasesAfterDate', async (req, res) => {
    const { id, date, image } = req.query;

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

    const result = await purchases.find({ account: id, date: { $gt: unixdate } }).lean().populate(image ? purchasePopulateImage : purchasePopulate);
    
    const total = result.reduce((acc, purchase) => {
        return acc + purchase.total;
    }, 0);

    res.status(200).json({ message: 'success', purchases: result, total: total });
});

/**
 * Get purchases within X days
 */
app.get('/recentPurchases', async (req, res) => {
    const { id, days, image } = req.query;

    console.log(`Recent purchases for: ${id}`);

    if (Number.isNaN(Number(days))) {
        return res.status(400).json({ message: `Invalid days param: ${days}` });
    }

    const account = await accounts.findById(id);

    if (!account) {
        return res.status(400).json({ message: `Failed to find account with id ${id}` });
    }

    const unixdate = Date.now() - (Number(days) * ONE_DAY);

    const result = await purchases.find({ account: id, date: { $gt: unixdate } }).lean().populate(image ? purchasePopulateImage : purchasePopulate);

    const total = result.reduce((acc, purchase) => {
        return acc + purchase.total;
    }, 0);

    res.status(200).json({ message: 'success', purchases: result, total: total, average: total / days });
});

/**
 * Get purchases within X days, filter by category
 */
app.get('/recentCategory', async (req, res) => {
    const { id, days, category } = req.query;

    console.log(`Recent purchases for: ${id}`);

    if (Number.isNaN(Number(days))) {
        return res.status(400).json({ message: `Invalid days param: ${days}` });
    }

    const account = await accounts.findById(id);
    const categoryDoc = await categories.findOne({ account: id, name: category });

    if (!account) {
        return res.status(400).json({ message: `Failed to find account with id ${id}` });
    } else if (!categoryDoc) {
        return res.status(400).json({ message: `Category ${category} does not exist` });
    }

    const unixdate = Date.now() - (Number(days) * ONE_DAY);

    const resultP = await purchases.find({ account: id, date: { $gt: unixdate } }).lean().populate(image ? purchasePopulateImage : purchasePopulate);

    const result = [];
    for (const purchase of resultP) {
        result.push(...purchase.items.filter(item => item.category?.name === category));
    }

    const [total, quantity] = result.reduce(([acct, accq], item) => {
        return [acct + item.price, accq + item.quantity];
    }, [0, 0]);

    res.status(200).json({ message: 'success', items: result, total: total, average: total / quantity });
});

/**
 * Get items by category
 */
app.get('/itemsByCategory', async (req, res) => {
    const { id, category } = req.query;

    console.log(`Purchases by category for: ${id}`);

    const account = await accounts.findById(id);
    const categoryDoc = await categories.findOne({ account: id, name: category });

    if (!account) {
        return res.status(400).json({ message: `Failed to find account with id ${id}` });
    } else if (!categoryDoc) {
        return res.status(400).json({ message: `Category ${category} does not exist` });
    }

    const result = await categoryDoc.populate({
        path: 'items',
        select: 'name quantity subcategory purchase price -_id',
        populate: {
            path: 'subcategory',
            select: 'name -_id',
        }
    }).lean();

    const [total, quantity] = result.items.reduce(([acct, accq], item) => {
        return [acct + item.price, accq + item.quantity];
    }, [0, 0]);

    res.status(200).json({ message: 'success', items: result.items, total: total, average: total / quantity });
});

/**
 * Get items by subcategory
 */
app.get('/itemsBySubcategory', async (req, res) => {
    const { id, subcategory } = req.query;

    console.log(`Purchases by category for: ${id}`);

    const account = await accounts.findById(id);
    const subcategoryDoc = await categories.findOne({ account: id, name: subcategory });

    if (!account) {
        return res.status(400).json({ message: `Failed to find account with id ${id}` });
    } else if (!subcategoryDoc) {
        return res.status(400).json({ message: `Subcategory ${subcategory} does not exist` });
    }

    const result = await subcategoryDoc.populate({
        path: 'items',
        select: 'name quantity purchase price -_id',
    }).lean();

    const [total, quantity] = result.items.reduce(([acct, accq], item) => {
        return [acct + item.price, accq + item.quantity];
    }, [0, 0]);

    res.status(200).json({ message: 'success', items: result.items, total: total, average: total / quantity });
});

/**
 * Get X purchases sorted by date or total
 */
app.get('/getPurchases', async (req, res) => {
    const { id, num, order, type, image } = req.query;

    if (type !== 'date' && type !== 'total') {
        return res.status(400).json({ message: `Invalid type param: ${type}. Must be "date" or "total"` });
    }
    if (Number.isNaN(Number(num))) {
        return res.status(400).json({ message: `Invalid num param: ${num}` });
    }
    const ascending = order === 'up';
    const sort = {[type]: ascending ? 1 : -1};

    const account = await accounts.findById(id);

    if (!account) {
        return res.status(400).json({ message: `Failed to find account with id ${id}` });
    }

    const result = await purchases.find({ account: id }).sort(sort).lean().populate(image ? purchasePopulateImage : purchasePopulate);

    if (result.length > num) result.length = num;
    const total = result.reduce((acc, purchase) => {
        return acc + purchase.total;
    }, 0);

    res.status(200).json({ message: 'success', purchases: result, number: num, sortedBy: type, direction: ascending ? 'ascending' : 'descending', total: total, average: total / num });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});