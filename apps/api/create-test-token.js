const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
require('dotenv').config();

async function main() {
  const p = new PrismaClient();
  const token = 'recall_ext_test_123';
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  
  // Find an existing user or create a fake one if needed
  let user = await p.user.findFirst();
  if (!user) {
    user = await p.user.create({
      data: {
        id: 'test_user_id',
        email: 'test@example.com',
        name: 'Test User'
      }
    });
  }
  
  await p.extensionToken.upsert({
    where: { tokenHash: hash },
    update: { 
      revokedAt: null, 
      expiresAt: new Date(Date.now() + 86400000) 
    },
    create: { 
      userId: user.id, 
      tokenHash: hash, 
      label: 'Manual Test', 
      expiresAt: new Date(Date.now() + 86400000) 
    }
  });
  
  console.log('Token created: recall_ext_test_123 for user:', user.email);
  await p.$disconnect();
}

main().catch(console.error);
