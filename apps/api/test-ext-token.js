const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const p = new PrismaClient({ log: ['query', 'error'] });

async function main() {
  console.log('Testing extensionToken.findUnique...');
  try {
    const r = await p.extensionToken.findUnique({ where: { tokenHash: 'test' } });
    console.log('Result:', r);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await p.$disconnect();
  }
}

main();
