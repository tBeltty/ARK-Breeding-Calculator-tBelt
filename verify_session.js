
import { Session } from './src/domain/Session.js';

// Mock settings/data
const creatureData = {
    creature: 'Dodo',
    name: 'Test Dodo',
    data: {
        weight: 100,
        maturationPct: 0,
        totalMaturationSeconds: 10, // Fast maturation for testing
        isPlaying: false
    }
};

console.log('--- TEST START ---');

// 1. Create Session
const session = new Session('test-id', 'Dodo', 'Test Dodo', creatureData.data);
console.log('1. Created Session. IsPlaying:', session.isPlaying, 'Maturation:', session.maturationPct);

// 2. Start Session
session.start();
console.log('2. Started Session. IsPlaying:', session.isPlaying, 'StartTime:', session.startTime);

// 3. Wait 2 seconds
setTimeout(() => {
    console.log('--- 2 Seconds Later ---');
    console.log('3. Original Session Maturation:', session.maturationPct);

    if (session.maturationPct <= 0) {
        console.error('FAIL: Maturation did not increase!');
    } else {
        console.log('PASS: Maturation increased.');
    }

    // 4. Clone Session
    const cloned = session.clone();
    console.log('4. Cloned Session.');
    console.log('   Original StartTime:', session.startTime);
    console.log('   Cloned StartTime:  ', cloned.startTime);
    console.log('   Original MaturationAtStart:', session.maturationAtStart);
    console.log('   Cloned MaturationAtStart:  ', cloned.maturationAtStart);

    console.log('   Cloned MaturationPct:', cloned.maturationPct);

    // 5. Verify Clone Continues
    setTimeout(() => {
        console.log('--- 1 Second After Clone ---');
        console.log('5. Cloned Session Maturation:', cloned.maturationPct);

        if (cloned.maturationPct > session.maturationPct) {
            // Note: Comparing against previous read of session. session matches cloned because both use Date.now()
            // Actually, if we read them at same time they are same.
        }

        console.log('   Original MaturationPct (now):', session.maturationPct);

        if (cloned.maturationPct > 0.25) { // Expected approx 0.3
            console.log('PASS: Cloned session kept tracking.');
        } else {
            console.error('FAIL: Cloned session lost progress?');
        }
    }, 1000);

}, 2000);
