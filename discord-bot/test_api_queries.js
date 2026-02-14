import axios from 'axios';

const apiKey = 'ark_889277775aedda93bbfd1d4cdf89f9ddb6109697ebe984ef090267e500c575a1';

async function testApiQueries() {
    const queries = [
        { search: '6309', official: true },
        { search: '4295132944', official: true },
        { search: 'NA-PVE-LostColony6309', official: true }
    ];

    for (const q of queries) {
        console.log(`\nTesting Query: ${JSON.stringify(q)}`);
        try {
            const response = await axios.get('https://arkstatus.com/api/v1/servers', {
                params: q,
                headers: { 'X-API-Key': apiKey }
            });
            console.log(`Results: ${response.data?.data?.length || 0}`);
            if (response.data?.data?.[0]) {
                console.log(`First result: ${response.data.data[0].name} (ID: ${response.data.data[0].id}) Status: ${response.data.data[0].status}`);
            }
        } catch (e) {
            console.error(`Error: ${e.message}`);
        }
    }
}

testApiQueries();
