const { initDb } = require('../lib/database.ts');

console.log('Initializing database...');
initDb();
console.log('Database initialized successfully!');