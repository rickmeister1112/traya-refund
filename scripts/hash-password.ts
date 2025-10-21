import * as bcrypt from 'bcrypt';

async function hashPassword(password: string) {
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  console.log('\n=================================');
  console.log('Password Hashing Utility');
  console.log('=================================');
  console.log('Original Password:', password);
  console.log('Hashed Password:', hash);
  console.log('=================================\n');
  return hash;
}

// Get password from command line argument or use default
const password = process.argv[2] || 'password123';

hashPassword(password).catch((error) => {
  console.error('Error hashing password:', error);
  process.exit(1);
});

