/**
 * One-time migration script to convert existing free-text training_type values
 * to the 3 standardized categories:
 *   - Diklat Fungsional
 *   - Diklat Substantif
 *   - Diklat Sertifikasi
 * 
 * Run with: npx ts-node prisma/migrate-training-types.ts
 * Safe to run multiple times (idempotent).
 */

import dotenv from 'dotenv';
import path from 'path';

// Load .env from api root
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mapping from old values to new standardized categories
const MIGRATION_MAP: Record<string, string> = {
  'Technical Training': 'Diklat Substantif',
  'Leadership Training': 'Diklat Fungsional',
  'Compliance Training': 'Diklat Sertifikasi',
  'Certification Training': 'Diklat Sertifikasi',
  'Soft Skills': 'Diklat Fungsional',
  'Workshop': 'Diklat Substantif',
  'Seminar': 'Diklat Substantif',
};

const VALID_TYPES = ['Diklat Fungsional', 'Diklat Substantif', 'Diklat Sertifikasi'];

async function migrate() {
  console.log('🔄 Starting training type migration...\n');

  // Get all distinct training types
  const distinctTypes = await prisma.training.groupBy({
    by: ['training_type'],
    _count: { id: true },
  });

  console.log('Current training types in database:');
  distinctTypes.forEach(t => {
    console.log(`  - "${t.training_type}" (${t._count.id} trainings)`);
  });
  console.log('');

  let totalUpdated = 0;

  for (const entry of distinctTypes) {
    const oldType = entry.training_type;
    
    // Skip if already a valid type
    if (VALID_TYPES.includes(oldType)) {
      console.log(`✅ "${oldType}" is already valid. Skipping.`);
      continue;
    }

    const newType = MIGRATION_MAP[oldType] || 'Diklat Substantif'; // default fallback
    
    const result = await prisma.training.updateMany({
      where: { training_type: oldType },
      data: { training_type: newType },
    });

    console.log(`🔄 "${oldType}" → "${newType}" (${result.count} records updated)`);
    totalUpdated += result.count;
  }

  console.log(`\n✅ Migration complete! ${totalUpdated} records updated.`);

  // Verify final state
  const finalTypes = await prisma.training.groupBy({
    by: ['training_type'],
    _count: { id: true },
  });

  console.log('\nFinal training types:');
  finalTypes.forEach(t => {
    console.log(`  - "${t.training_type}" (${t._count.id} trainings)`);
  });
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
