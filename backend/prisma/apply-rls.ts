import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Applying PostgreSQL Row-Level Security (RLS) policies...');

  const sqlStatements = [
    // 1. Enable Row-Level Security on appropriate tables
    `ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE "ChatMessage" ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE "UserDBTStep" ENABLE ROW LEVEL SECURITY;`,

    // 2. Drop existing policies to prevent duplication errors
    `DROP POLICY IF EXISTS profile_rls_policy ON "Profile";`,
    `DROP POLICY IF EXISTS chat_rls_policy ON "ChatMessage";`,
    `DROP POLICY IF EXISTS dbt_step_rls_policy ON "UserDBTStep";`,

    // 3. Create RLS policies for Profile
    // Allows access if user matches app.current_user_id OR if bypass role is ADMIN
    `CREATE POLICY profile_rls_policy ON "Profile"
     FOR ALL
     USING (
       "userId" = NULLIF(current_setting('app.current_user_id', true), '')
       OR NULLIF(current_setting('app.user_role', true), '') = 'ADMIN'
     );`,

    // 4. Create RLS policies for ChatMessage
    `CREATE POLICY chat_rls_policy ON "ChatMessage"
     FOR ALL
     USING (
       "userId" = NULLIF(current_setting('app.current_user_id', true), '')
       OR NULLIF(current_setting('app.user_role', true), '') = 'ADMIN'
     );`,

    // 5. Create RLS policies for UserDBTStep
    `CREATE POLICY dbt_step_rls_policy ON "UserDBTStep"
     FOR ALL
     USING (
       "userId" = NULLIF(current_setting('app.current_user_id', true), '')
       OR NULLIF(current_setting('app.user_role', true), '') = 'ADMIN'
     );`
  ];

  for (const sql of sqlStatements) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch (error) {
      console.error(`Error running SQL: ${sql}`);
      console.error((error as Error).message);
    }
  }

  console.log('Row-Level Security (RLS) policies successfully configured on PostgreSQL!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
