import axios from 'axios';

const apiKey = 'ark_889277775aedda93bbfd1d4cdf89f9ddb6109697ebe984ef090267e500c575a1';

async function simulateSync(record) {
    console.log(`[Sim] Checking for: ${record.server_name} (${record.server_id})`);

    let match = null;
    try {
        const response = await axios.get('https://arkstatus.com/api/v1/servers', {
            params: { search: record.server_name, per_page: 20, official: true },
            headers: { 'X-API-Key': apiKey }
        });

        if (response.data?.success) {
            console.log(`[Sim] Name search returned ${response.data.data.length} results`);
            match = response.data.data.find(s =>
                String(s.id) === record.server_id ||
                s.name === record.server_name
            );
        }
    } catch (e) {
        console.error('[Sim] Name search error:', e.message);
    }

    if (!match) {
        console.log('[Sim] Name match failed, trying ID search...');
        try {
            const response = await axios.get('https://arkstatus.com/api/v1/servers', {
                params: { search: record.server_id, per_page: 20, official: true },
                headers: { 'X-API-Key': apiKey }
            });
            if (response.data?.success) {
                console.log(`[Sim] ID search returned ${response.data.data.length} results`);
                match = response.data.data.find(s =>
                    String(s.id) === record.server_id ||
                    s.name.includes(record.server_id)
                );
            }
        } catch (e) {
            console.error('[Sim] ID search error:', e.message);
        }
    }

    if (match) {
        console.log('[Sim] SUCCESS! Match found:', match.name, 'Status:', match.status);
    } else {
        console.log('[Sim] FAILURE! No match found. Would set to OFFLINE.');
    }
}

// Case 1: ID is recorded as the long ID
simulateSync({ server_id: '4295132944', server_name: 'NA-PVE-LostColony6309' });

// Case 2: ID is recorded as "6309" (unlikely but check logic)
simulateSync({ server_id: '6309', server_name: 'NA-PVE-LostColony6309' });
