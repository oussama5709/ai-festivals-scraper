import { getEvents } from '../../../lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const region = searchParams.get('region');

        const filters = {};
        if (region && region !== 'worldwide') {
            filters.region = region;
        }

        const events = await getEvents(filters);

        return new Response(JSON.stringify({
            success: true,
            count: events.length,
            events: events.slice(0, 100)
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
