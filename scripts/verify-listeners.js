const EventEmitter = require('events');

/**
 * Verifies if there are too many listeners for a specific event.
 * @param {EventEmitter} emitter 
 * @param {string} eventName 
 * @param {number} limit 
 * @throws {Error} if listeners count exceeds limit
 */
function checkLeaks(emitter, eventName, limit = 10) {
    const count = emitter.listenerCount(eventName);
    if (count > limit) {
        throw new Error(`Potential memory leak detected for event "${eventName}": ${count} listeners (limit: ${limit})`);
    }
    console.log(`[OK] Event "${eventName}" has ${count} listeners (limit: ${limit})`);
}

// Test Case
function runTests() {
    console.log('Running tests for verify-listeners.js...');
    
    // Test Case 1: Over limit
    const emitter1 = new EventEmitter();
    const eventName1 = 'over-limit-event';
    const limit1 = 5;
    for (let i = 0; i < limit1 + 1; i++) {
        emitter1.on(eventName1, () => {});
    }
    try {
        checkLeaks(emitter1, eventName1, limit1);
        console.error('Test Case 1 Failed: checkLeaks should have thrown an error');
        process.exit(1);
    } catch (error) {
        if (error.message.includes('Potential memory leak detected')) {
            console.log('Test Case 1 Passed: Caught expected error');
        } else {
            console.error('Test Case 1 Failed: Unexpected error message:', error.message);
            process.exit(1);
        }
    }

    // Test Case 2: Within limit
    const emitter2 = new EventEmitter();
    const eventName2 = 'within-limit-event';
    const limit2 = 5;
    for (let i = 0; i < limit2; i++) {
        emitter2.on(eventName2, () => {});
    }
    try {
        checkLeaks(emitter2, eventName2, limit2);
        console.log('Test Case 2 Passed: No error thrown as expected');
    } catch (error) {
        console.error('Test Case 2 Failed: Should NOT have thrown an error:', error.message);
        process.exit(1);
    }

    console.log('All tests passed!');
}

if (require.main === module) {
    runTests();
}

module.exports = { checkLeaks };

