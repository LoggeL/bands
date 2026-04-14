import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST() {
  const db = getDb();
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;

  if (userCount > 0) {
    return NextResponse.json({ message: 'Database already seeded', userCount });
  }

  return NextResponse.json({ message: 'Run npm run seed to seed the database' }, { status: 400 });
}
