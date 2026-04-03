import { uploadFile, buildKey } from './storage';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

async function testR2() {
  console.log('Testing R2 Upload...');
  const testBuffer = Buffer.from('Hello R2! This is a test file.');
  const userId = 'test_user';
  const key = buildKey(userId, 'tests', 'hello.txt');

  try {
    const result = await uploadFile(testBuffer, key, 'text/plain');
    console.log('✅ Upload success!');
    console.log('Result:', result);
    return result;
  } catch (err) {
    console.error('❌ Upload failed:', err);
    throw err;
  }
}

testR2();
