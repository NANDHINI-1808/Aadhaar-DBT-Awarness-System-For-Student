import prisma from './db';

/**
 * Execute Prisma operations within a PostgreSQL transaction that enforces Row-Level Security
 * by setting local session variables `app.current_user_id` and `app.user_role`.
 */
export async function runWithRLS<T>(
  userId: string,
  role: 'STUDENT' | 'ADMIN',
  callback: (tx: any) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    // Escape strings or use parameterized SET LOCAL
    // In PostgreSQL, SET LOCAL cannot be directly parameterized in standard PQexecParams,
    // so we format the string safely by replacing single quotes with double single quotes,
    // or since we verified the format, we can safely interpolate it.
    const safeUserId = userId.replace(/'/g, "''");
    const safeRole = role.replace(/'/g, "''");
    
    await tx.$executeRawUnsafe(`SET LOCAL app.current_user_id = '${safeUserId}';`);
    await tx.$executeRawUnsafe(`SET LOCAL app.user_role = '${safeRole}';`);
    
    return callback(tx);
  });
}
