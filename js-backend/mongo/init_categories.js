const { categories, subcategories, accounts } = require('@m/mongo_models.js');
const categoryArr = ['Food', 'Housing', 'Transportation', 'Shopping', 'Entertainment', 'Personal Care', 'Miscellaneous'];
const subcategoryArr = [
    ['Groceries', 'Restaurants', 'Fast Food', 'Alcohol', 'Delivery'],
    ['Rent/Mortgage', 'Electricity', 'Internet'],
    ['Fuel', 'Public Transit', 'Taxi'],
    ['Clothing', 'Electronics', 'Furniture', 'Other'],
    ['Streaming', 'Events', 'Video Games', 'Movies', 'Subscriptions'],
    ['Haircuts', 'Skincare & Makeup', 'Hygiene Products', 'Spa & Massage'],
    ['Uncategorized', 'Cash Withdrawal']
];

async function initCategories(accountId) {
    // Check if the account exists
    const account = await accounts.findById(accountId);
    if (!account) {
        throw new Error(`Account with ID ${accountId} does not exist.`);
    }

    const existingCategories = await categories.find({
        account: accountId
    }).select('name').lean();

    const existingNames = new Set(existingCategories.map(c => c.name));

    // Filter for new categories
    const newCategories = categoryArr.filter(
        name => !existingNames.has(name)
    );

    // Add new categories
    if (newCategories.length > 0) {
        const newCatDocs = await categories.insertMany(
            newCategories.map(category => ({
                account: accountId,
                name: category,
            }))
        );

        account.data.categories.push(...newCatDocs.map(cat => cat._id));
        await account.save();
    }

    // Get all categories to now add new subcategories
    const categoryDocs = await categories.find({ account: accountId });
    const categoryUpdates = [];

    for (const [i, category] of categoryDocs.entries()) {
        const existingSubcategories = await subcategories.find({
            category: category._id,
            account: accountId
        }).select('name').lean();

        const existingNames = new Set(existingSubcategories.map(s => s.name));

        // Filter for new subcategories
        // console.log(i);
        const newSubcategories = subcategoryArr[i].filter(
            name => !existingNames.has(name)
        );

        const subcategoryDocs = await subcategories.insertMany(
            newSubcategories.map(subcategory => ({
                category: category._id,
                name: subcategory,
                account: accountId
            }))
        );
        categoryUpdates.push({
            updateOne: {
                filter: { name: category.name },
                update: { $push: { subcategories: { $each: subcategoryDocs } } }
            }
        });
    }

}

module.exports = initCategories;