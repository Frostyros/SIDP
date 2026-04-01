/**
 * migrate-data.ts
 * Migrates ALL data from the OLD Supabase project to the NEW Supabase project.
 * This will:
 *   1. Read all employees, trainings, and training_participants from OLD DB
 *   2. Clear all data in NEW DB (except users)
 *   3. Insert everything into NEW DB preserving original IDs & relationships
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

// OLD database connection (the one that has the correct data from localhost)
const OLD_DB_URL = 'postgresql://postgres.jmpbrrbifnfthvvrdcct:10Fros101296%21@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres?schema=diklat';

// NEW database connection (production, from .env)
const NEW_DB_URL = process.env.DATABASE_URL!;

const oldPrisma = new PrismaClient({
  datasources: { db: { url: OLD_DB_URL } }
});

const newPrisma = new PrismaClient({
  datasources: { db: { url: NEW_DB_URL } }
});

async function main() {
  console.log('=== SIDP Data Migration: OLD → NEW Database ===\n');

  // ── Step 1: Read all data from OLD database ──
  console.log('📖 Reading from OLD database...');
  
  const oldEmployees = await oldPrisma.employee.findMany();
  console.log(`  Employees: ${oldEmployees.length}`);

  const oldTrainings = await oldPrisma.training.findMany();
  console.log(`  Trainings: ${oldTrainings.length}`);

  const oldParticipants = await oldPrisma.trainingParticipant.findMany();
  console.log(`  Participants: ${oldParticipants.length}`);

  // ── Step 2: Clear NEW database (keep users intact) ──
  console.log('\n🗑️  Clearing NEW database (preserving users)...');
  
  await newPrisma.trainingParticipant.deleteMany();
  console.log('  Cleared training_participants');
  
  await newPrisma.training.deleteMany();
  console.log('  Cleared trainings');
  
  await newPrisma.employee.deleteMany();
  console.log('  Cleared employees');

  // ── Step 3: Insert employees ──
  console.log('\n📥 Inserting employees...');
  let empCount = 0;
  for (const emp of oldEmployees) {
    try {
      await newPrisma.employee.create({
        data: {
          id: emp.id,
          name: emp.name,
          employee_id: emp.employee_id,
          position: emp.position,
          department: emp.department,
          photo_url: emp.photo_url,
          created_at: emp.created_at
        }
      });
      empCount++;
    } catch (err: any) {
      console.error(`  ❌ Employee "${emp.name}": ${err.message?.substring(0, 80)}`);
    }
  }
  console.log(`  ✅ Inserted ${empCount}/${oldEmployees.length} employees`);

  // ── Step 4: Insert trainings ──
  console.log('\n📥 Inserting trainings...');
  let trainingCount = 0;
  for (const t of oldTrainings) {
    try {
      await newPrisma.training.create({
        data: {
          id: t.id,
          training_name: t.training_name,
          training_type: t.training_type,
          organizer: t.organizer,
          location: t.location,
          description: t.description,
          start_date: t.start_date,
          end_date: t.end_date,
          total_jp: t.total_jp,
          created_at: t.created_at
        }
      });
      trainingCount++;
    } catch (err: any) {
      console.error(`  ❌ Training "${t.training_name}": ${err.message?.substring(0, 80)}`);
    }
  }
  console.log(`  ✅ Inserted ${trainingCount}/${oldTrainings.length} trainings`);

  // ── Step 5: Insert participant links ──
  console.log('\n📥 Inserting training participants...');
  let partCount = 0;
  for (const p of oldParticipants) {
    try {
      await newPrisma.trainingParticipant.create({
        data: {
          id: p.id,
          training_id: p.training_id,
          employee_id: p.employee_id,
          created_at: p.created_at
        }
      });
      partCount++;
    } catch (err: any) {
      console.error(`  ❌ Participant link: ${err.message?.substring(0, 80)}`);
    }
  }
  console.log(`  ✅ Inserted ${partCount}/${oldParticipants.length} participants`);

  // ── Summary ──
  console.log('\n═══════════════════════════════════════');
  console.log('  Migration Complete!');
  console.log(`  Employees:    ${empCount}/${oldEmployees.length}`);
  console.log(`  Trainings:    ${trainingCount}/${oldTrainings.length}`);
  console.log(`  Participants: ${partCount}/${oldParticipants.length}`);
  console.log('═══════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await oldPrisma.$disconnect();
    await newPrisma.$disconnect();
  });
