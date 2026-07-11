import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const passwordInput = process.argv[2];
if (!passwordInput) {
  console.error('Error: Password parameter is missing.');
  process.exit(1);
}

async function run() {
  console.log('Connecting to PostgreSQL with provided password...');
  
  // URL-encode the password to handle special characters (e.g. '@' becomes '%40')
  const encodedPassword = encodeURIComponent(passwordInput);
  const baseDbUrl = `postgresql://postgres:${encodedPassword}@localhost:5432/postgres?schema=public`;

  const basePrisma = new PrismaClient({
    datasources: {
      db: { url: baseDbUrl }
    }
  });

  try {
    // Check connection
    await basePrisma.$queryRaw`SELECT 1`;
    console.log('Success: Connected to PostgreSQL server.');
  } catch (err) {
    console.error('Error: Could not connect to PostgreSQL. Check if password is correct.');
    console.error((err as Error).message);
    await basePrisma.$disconnect();
    process.exit(1);
  }

  // Create database if not exists
  console.log('Checking database "aadhaar_dbt_db"...');
  try {
    const dbs: any[] = await basePrisma.$queryRawUnsafe(`SELECT datname FROM pg_database WHERE datname = 'aadhaar_dbt_db'`);
    if (dbs.length === 0) {
      console.log('Database "aadhaar_dbt_db" does not exist. Creating...');
      await basePrisma.$executeRawUnsafe(`CREATE DATABASE aadhaar_dbt_db`);
      console.log('Database "aadhaar_dbt_db" created successfully.');
    } else {
      console.log('Database "aadhaar_dbt_db" already exists.');
    }
  } catch (error) {
    console.error('Error checking/creating database:', (error as Error).message);
    await basePrisma.$disconnect();
    process.exit(1);
  } finally {
    await basePrisma.$disconnect();
  }

  // Write configurations to backend/.env
  console.log('Writing environment configurations...');
  const envPath = path.join(__dirname, '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Generate secure values for JWT and Crypto
  const accessSecret = crypto.randomBytes(32).toString('hex');
  const refreshSecret = crypto.randomBytes(32).toString('hex');
  const aadhaarPepper = crypto.randomBytes(32).toString('hex');
  const bankEncryptionKey = crypto.randomBytes(32).toString('hex'); // 64 hex characters (32 bytes)

  const dbUrlLine = `DATABASE_URL="postgresql://postgres:${encodedPassword}@localhost:5432/aadhaar_dbt_db?schema=public"`;
  const accessSecretLine = `JWT_ACCESS_SECRET="${accessSecret}"`;
  const refreshSecretLine = `JWT_REFRESH_SECRET="${refreshSecret}"`;
  const pepperLine = `AADHAAR_PEPPER="${aadhaarPepper}"`;
  const bankKeyLine = `BANK_ENCRYPTION_KEY="${bankEncryptionKey}"`;

  function setEnvVar(content: string, key: string, valueLine: string): string {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
      return content.replace(regex, valueLine);
    }
    return content.trim() + '\n' + valueLine + '\n';
  }

  envContent = setEnvVar(envContent, 'DATABASE_URL', dbUrlLine);
  envContent = setEnvVar(envContent, 'JWT_ACCESS_SECRET', accessSecretLine);
  envContent = setEnvVar(envContent, 'JWT_REFRESH_SECRET', refreshSecretLine);
  envContent = setEnvVar(envContent, 'AADHAAR_PEPPER', pepperLine);
  envContent = setEnvVar(envContent, 'BANK_ENCRYPTION_KEY', bankKeyLine);

  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('backend/.env successfully configured with url and secrets.');
  process.exit(0);
}

run();
