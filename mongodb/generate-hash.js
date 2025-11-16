const bcrypt = require('bcrypt');

async function generateHash() {
  const password = 'Admin@123';
  const hash = await bcrypt.hash(password, 10);
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\nReplace the password hash in mongo-init.js with this:');
  console.log(`password: '${hash}',`);
}

generateHash();
