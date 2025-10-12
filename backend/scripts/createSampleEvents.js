const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSampleEvents() {
  try {
    console.log('🔧 Creating sample events for testing...');
    
    // Find a coach to be the event creator (events are created by coaches in your schema)
    const coach = await prisma.coach.findFirst({
      include: {
        user: {
          select: {
            email: true,
            role: true
          }
        }
      }
    });
    
    if (!coach) {
      console.log('❌ No coach found to create events');
      console.log('💡 Creating a sample coach first...');
      
      // Create a sample coach user first
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('coach123', 12);
      
      const newUser = await prisma.user.create({
        data: {
          email: 'samplecoach@example.com',
          phone: '+919876543210',
          password: hashedPassword,
          role: 'COACH',
          isActive: true,
          isVerified: true,
          coachProfile: {
            create: {
              name: 'Sample Coach',
              primarySport: 'Football',
              experience: 5,
              location: 'Mumbai',
              city: 'Mumbai',
              state: 'Maharashtra',
              bio: 'Experienced football coach'
            }
          }
        },
        include: {
          coachProfile: true
        }
      });
      
      console.log(`✅ Created sample coach: ${newUser.email}`);
      
      // Use the newly created coach
      const newCoach = newUser.coachProfile;
      console.log(`📝 Using coach ${newUser.email} (${newCoach.name}) to create events`);
      
      await createEventsForCoach(newCoach.id);
    } else {
      console.log(`📝 Using existing coach ${coach.user.email} (${coach.name}) to create events`);
      await createEventsForCoach(coach.id);
    }
    
  } catch (error) {
    console.error('❌ Error creating sample events:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function createEventsForCoach(coachId) {
  // FIXED: Using correct field names from your schema
  const sampleEvents = [
    {
      coachId: coachId,                    // FIXED: Use coachId instead of createdById
      name: 'Youth Football Championship 2024',  // FIXED: Use name instead of title
      description: 'Annual football championship for youth players aged 12-16',
      sport: 'Football',
      venue: 'City Sports Complex',       // FIXED: Use venue instead of location
      address: '123 Sports Complex Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      startDate: new Date('2024-12-01T09:00:00Z'),
      endDate: new Date('2024-12-01T17:00:00Z'),
      maxParticipants: 50,
      eventFee: 25.00,                    // FIXED: Use eventFee instead of registrationFee
      status: 'PENDING'
    },
    {
      coachId: coachId,
      name: 'Basketball Skills Workshop',
      description: 'Learn advanced basketball techniques from professional coaches',
      sport: 'Basketball',
      venue: 'Community Center Gym',
      address: '456 Community Center Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      startDate: new Date('2024-11-25T14:00:00Z'),
      endDate: new Date('2024-11-25T16:00:00Z'),
      maxParticipants: 30,
      eventFee: 15.00,
      status: 'PENDING'
    },
    {
      coachId: coachId,
      name: 'Swimming Competition',
      description: 'Competitive swimming event for all age groups',
      sport: 'Swimming',
      venue: 'Aquatic Center',
      address: '789 Pool Lane',
      city: 'Mumbai',
      state: 'Maharashtra',
      startDate: new Date('2024-12-15T08:00:00Z'),
      endDate: new Date('2024-12-15T18:00:00Z'),
      maxParticipants: 100,
      eventFee: 20.00,
      status: 'PENDING'
    },
    {
      coachId: coachId,
      name: 'Cricket Tournament',
      description: 'Inter-school cricket tournament for young talents',
      sport: 'Cricket',
      venue: 'Sports Stadium',
      address: '321 Stadium Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      startDate: new Date('2024-12-20T08:00:00Z'),
      endDate: new Date('2024-12-22T18:00:00Z'),
      maxParticipants: 80,
      eventFee: 30.00,
      status: 'PENDING'
    },
    {
      coachId: coachId,
      name: 'Tennis Academy Open Day',
      description: 'Free tennis coaching session and tournament for beginners',
      sport: 'Tennis',
      venue: 'Tennis Academy Courts',
      address: '654 Tennis Club Avenue',
      city: 'Mumbai',
      state: 'Maharashtra',
      startDate: new Date('2024-11-30T10:00:00Z'),
      endDate: new Date('2024-11-30T16:00:00Z'),
      maxParticipants: 40,
      eventFee: 0.00, // Free event
      status: 'PENDING'
    }
  ];
  
  for (const eventData of sampleEvents) {
    try {
      const event = await prisma.event.create({
        data: eventData,
        include: {
          coach: {
            include: {
              user: {
                select: {
                  email: true,
                  role: true
                }
              }
            }
          }
        }
      });
      
      console.log(`✅ Created event: ${event.name} (${event.sport})`);
    } catch (error) {
      console.error(`❌ Failed to create event ${eventData.name}:`, error.message);
    }
  }
  
  console.log('\n🎉 Sample events created successfully!');
  console.log('👨‍💼 Admin can now approve these events from the dashboard');
  console.log('\n📊 Event Summary:');
  
  try {
    const eventStats = await prisma.event.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });
    
    eventStats.forEach(stat => {
      console.log(`   ${stat.status}: ${stat._count.status} events`);
    });
  } catch (error) {
    console.log('   Could not fetch event statistics');
  }
}

createSampleEvents();