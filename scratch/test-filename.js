const { slugifyContext } = require('./backend/middleware/uploadMiddleware');

console.log("Slugified context:");
console.log("1. 'Volkswagen POLO for sale in Udumalpet' ->", slugifyContext('Volkswagen POLO for sale in Udumalpet'));
console.log("2. 'Toyota Innova Crysta for sale in Udumalpet' ->", slugifyContext('Toyota Innova Crysta for sale in Udumalpet'));
console.log("3. 'Test Name @! 123' ->", slugifyContext('Test Name @! 123'));
console.log("4. Empty/Null ->", slugifyContext(''));
