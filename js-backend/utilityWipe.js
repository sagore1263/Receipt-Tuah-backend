const { dbConnect } = require('@m/init_mongo.js');
const models = require('@m/mongo_models.js');

(async () => {
    await dbConnect();
})();