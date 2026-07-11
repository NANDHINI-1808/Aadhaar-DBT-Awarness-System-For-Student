import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const passwords = ['', 'postgres', 'admin', 'root', 'local_dev_password_123'];

async function testConnection(password: string): Promise<boolean> {
  const url = `postgresql://postgres:${password}@localhost:5432/postgres?schema=public`;
  const prisma = new PrismaClient({
    datasources: {
      db: { url }
    }
  });

  try {
    // Attempt a simple connection query
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    return true;
  } catch (err) {
    await prisma.$disconnect();
    return false;
  }
}

async function run() {
  console.log('Detecting local PostgreSQL access...');
  let workingPassword: string | null = null;

  for (const pw of passwords) {
    console.log(`Testing password: "${pw}"...`);
    const success = await testConnection(pw);
    if (success) {
      workingPassword = pw;
      console.log(`Success! Connected using password: "${pw}"`);
      break;
    }
  }

  if (workingPassword === null) {
    console.log('Error: Could not connect to PostgreSQL with default passwords.');
    console.log('PROMPT_USER_PASSWORD_REQUIRED');
    process.exit(2);
  }

  // Create database if not exists
  console.log('Ensuring database "aadhaar_dbt_db" exists...');
  const baseDbUrl = `postgresql://postgres:${workingPassword}@localhost:5432/postgres?schema=public`;
  const basePrisma = new PrismaClient({
    datasources: { db: { url: baseDbUrl } }
  });

  try {
    const dbs: any[] = await basePrisma.$queryRawUnsafe(`SELECT datname FROM pg_database WHERE datname = 'aadhaar_dbt_db'`);
    if (dbs.length === 0) {
      console.log('Database "aadhaar_dbt_db" does not exist. Creating database...');
      await basePrisma.$executeRawUnsafe(`CREATE DATABASE aadhaar_dbt_db`);
      console.log('Database "aadhaar_dbt_db" created successfully.');
    } else {
      console.log('Database "aadhaar_dbt_db" already exists.');
    }
  } catch (error) {
    console.error('Error creating database:', (error as Error).message);
    process.exit(1);
  } finally {
    await basePrisma.$disconnect();
  }

  // Update backend/.env file
  console.log('Writing configurations to backend/.env...');
  const envPath = path.join(__dirname, '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Generate secure secrets
  const accessSecret = crypto.randomBytes(32).toString('hex');
  const refreshSecret = crypto.randomBytes(32).toString('hex');
  const aadhaarPepper = crypto.randomBytes(32).toString('hex');
  const bankEncryptionKey = crypto.randomBytes(32).toString('hex'); // 64 hex characters (32 bytes)

  const dbUrlLine = `DATABASE_URL="postgresql://postgres:${workingPassword}@localhost:5432/aadhaar_dbt_db?schema=public"`;
  const accessSecretLine = `JWT_ACCESS_SECRET="${accessSecret}"`;
  const refreshSecretLine = `JWT_REFRESH_SECRET="${refreshSecret}"`;
  const pepperLine = `AADHAAR_PEPPER="${aadhaarPepper}"`;
  const bankKeyLine = `BANK_ENCRYPTION_KEY="${bankEncryptionKey}"`;

  // Helper function to replace or append environment variables
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
  console.log('backend/.env file updated successfully with database URL and secure keys.');
  process.exit(0);
}

run();
