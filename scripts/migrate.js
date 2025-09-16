const { initDb } = require('../lib/database');

console.log('Initializing database...');
initDb();
console.log('Database initialized successfully!');