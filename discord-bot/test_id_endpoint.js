import axios from 'axios';

const apiKey = 'ark_889277775aedda93bbfd1d4cdf89f9ddb6109697ebe984ef090267e500c575a1';

async function testIdEndpoint() {
    const serverId = '4295132944';
    console.log(`Testing Direct ID Endpoint for: ${serverId}`);
    try {
        const response = await axios.get(`https://arkstatus.com/api/v1/servers/${serverId}`, {
            headers: { 'X-API-Key': apiKey }
        });
        console.log('Success!', response.data);
    } catch (e) {
        console.error(`Error with direct ID: ${e.response?.status || e.message}`);
    }
}

testIdEndpoint();
