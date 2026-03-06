const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://username:password@cluster.mongodb.net/ai-festivals';

let cachedClient = null;

async function connectDB() {
    if (cachedClient) return cachedClient;

    const client = new MongoClient(MONGO_URI);
    await client.connect();

    cachedClient = client;
    return client;
}

async function getDB() {
    const client = await connectDB();
    return client.db('ai-festivals');
}

async function saveEvent(event) {
    const db = await getDB();
    const eventsCollection = db.collection('events');

    return await eventsCollection.updateOne(
        { url: event.url },
        { $set: event },
        { upsert: true }
    );
}

async function getEvents(filters = {}) {
    const db = await getDB();
    const eventsCollection = db.collection('events');

    return await eventsCollection.find(filters).toArray();
}

async function closeDB() {
    if (cachedClient) {
        await cachedClient.close();
        cachedClient = null;
    }
}

module.exports = { connectDB, getDB, saveEvent, getEvents, closeDB };
