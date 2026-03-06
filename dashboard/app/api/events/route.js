import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://username:password@cluster.mongodb.net/ai-festivals';

export async function GET() {
    try {
        const client = new MongoClient(MONGO_URI);
        await client.connect();
        const db = client.db('ai-festivals');
        const events = await db.collection('events').find({}).sort({ startDate: 1 }).toArray();
        await client.close();

        return new Response(JSON.stringify(events), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error) {
        console.error('API Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch events' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500,
        });
    }
}
