// Debug script to check the timestamp conversion
const { format } = require('date-fns');

// Solo Leveling timestamp
const timestamp = 1740841200;
const date = new Date(timestamp * 1000);

console.log('Timestamp:', timestamp);
console.log('UTC date:', date.toUTCString());
console.log('Local date:', date.toString());
console.log('Day of week:', date.getDay()); // 0 = Sunday, 6 = Saturday
console.log('Formatted date:', format(date, 'yyyy-MM-dd'));
console.log('Is Feb 29 a Saturday in 2025?', new Date('2025-02-29').getDay() === 6);

// Check what happens with mocked timezone offset
const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
Date.prototype.getTimezoneOffset = function() { return 360; }; // GMT-6

console.log('\nWith mocked GMT-6 timezone:');
const dateWithMockedTZ = new Date(timestamp * 1000);
console.log('UTC date:', dateWithMockedTZ.toUTCString());
console.log('Local date with mock:', dateWithMockedTZ.toString());
console.log('Formatted date with mock:', format(dateWithMockedTZ, 'yyyy-MM-dd'));

// Restore original function
Date.prototype.getTimezoneOffset = originalGetTimezoneOffset;
