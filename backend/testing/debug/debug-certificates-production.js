/**
 * Debug Certificate Issues in Production
 * Run this to diagnose certificate endpoint problems
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugCertificates() {
  console.log('🔍 CERTIFICATE DEBUGGING TOOL\n');
  console.log('========================================\n');

  try {
    // 1. Check Event
    console.log('1️⃣ Checking Event...');
    const eventId = 'EVT-0001-FB-GJ-071125';
    
    const eventByUniqueId = await prisma.event.findUnique({
      where: { uniqueId: eventId },
      include: {
        coach: {
          select: {
            id: true,
            name: true,
            user: {
              select: { uniqueId: true }
            }
          }
        }
      }
    });

    if (eventByUniqueId) {
      console.log('✅ Event found by uniqueId:');
      console.log(`   Database ID: ${eventByUniqueId.id}`);
      console.log(`   Name: ${eventByUniqueId.name}`);
      console.log(`   UniqueId: ${eventByUniqueId.uniqueId}`);
      console.log(`   Coach: ${eventByUniqueId.coach?.name || 'N/A'}`);
    } else {
      console.log('❌ Event NOT found by uniqueId');
      return;
    }

    // 2. Check Certificates with different ID formats
    console.log('\n2️⃣ Checking Certificates...');
    
    const whereConditions = [
      { eventId: eventByUniqueId.id },
      { eventId: eventId }
    ];
    
    if (eventByUniqueId.uniqueId) {
      whereConditions.push({ eventId: eventByUniqueId.uniqueId });
    }
    
    console.log('📋 Query conditions:', JSON.stringify(whereConditions, null, 2));
    
    const certificates = await prisma.certificate.findMany({
      where: {
        OR: whereConditions
      },
      orderBy: { issueDate: 'desc' }
    });

    console.log(`✅ Found ${certificates.length} certificate(s)\n`);

    if (certificates.length > 0) {
      console.log('📜 Certificate Details:');
      for (const cert of certificates) {
        console.log(`\n   Certificate ID: ${cert.id}`);
        console.log(`   Unique ID: ${cert.uniqueId}`);
        console.log(`   Student ID: ${cert.studentId}`);
        console.log(`   Event ID (stored): ${cert.eventId}`);
        console.log(`   Issue Date: ${cert.issueDate}`);
        
        // Try to fetch student
        let student = await prisma.student.findUnique({
          where: { id: cert.studentId },
          select: {
            name: true,
            user: { select: { uniqueId: true, email: true } }
          }
        });

        if (!student) {
          // Try by uniqueId
          const user = await prisma.user.findUnique({
            where: { uniqueId: cert.studentId },
            include: {
              studentProfile: {
                select: { id: true, name: true }
              }
            }
          });
          
          if (user?.studentProfile) {
            console.log(`   ⚠️ Student found by uniqueId: ${user.studentProfile.name}`);
            console.log(`   Database ID: ${user.studentProfile.id}`);
            console.log(`   UniqueId: ${user.uniqueId}`);
          } else {
            console.log(`   ❌ Student NOT found (ID: ${cert.studentId})`);
          }
        } else {
          console.log(`   ✅ Student: ${student.name} (${student.user?.uniqueId})`);
        }
      }
    }

    // 3. Check Students table
    console.log('\n3️⃣ Checking Students...');
    const studentsCount = await prisma.student.count();
    console.log(`   Total students: ${studentsCount}`);

    // 4. Check for mismatched IDs
    console.log('\n4️⃣ Checking for ID Mismatches...');
    const allCerts = await prisma.certificate.findMany({
      select: { id: true, studentId: true, eventId: true }
    });

    const mismatches = [];
    for (const cert of allCerts) {
      const student = await prisma.student.findUnique({
        where: { id: cert.studentId }
      });
      
      if (!student) {
        mismatches.push({
          certId: cert.id,
          studentId: cert.studentId,
          eventId: cert.eventId
        });
      }
    }

    if (mismatches.length > 0) {
      console.log(`   ⚠️ Found ${mismatches.length} certificate(s) with missing students:`);
      mismatches.forEach(m => {
        console.log(`      - Cert ID: ${m.certId}, Missing Student ID: ${m.studentId}`);
      });
    } else {
      console.log('   ✅ All certificates have valid student references');
    }

    // 5. Database Schema Check
    console.log('\n5️⃣ Checking Database Schema...');
    try {
      const testQuery = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'certificates' 
        ORDER BY ordinal_position;
      `;
      console.log('   ✅ Certificate table columns:');
      testQuery.forEach(col => {
        console.log(`      - ${col.column_name}: ${col.data_type}`);
      });
    } catch (schemaError) {
      console.log('   ⚠️ Could not check schema:', schemaError.message);
    }

    console.log('\n========================================');
    console.log('✅ Diagnosis complete!\n');

  } catch (error) {
    console.error('\n❌ DIAGNOSIS FAILED:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

debugCertificates();
