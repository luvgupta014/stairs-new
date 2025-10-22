const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    // Check coaches
    const coaches = await prisma.user.findMany({
      where: { role: 'COACH' },
      include: { coachProfile: true }
    });
    
    console.log('Coaches found:', coaches.length);
    coaches.forEach(c => console.log('- Coach:', c.coachProfile?.name, c.email));
    
    // Check events
    const events = await prisma.event.findMany({
      take: 3,
      include: { coach: true }
    });
    
    console.log('Events found:', events.length);
    events.forEach(e => console.log('- Event:', e.name, 'by', e.coach?.name));
    
    // Check existing orders
    const orders = await prisma.eventOrder.findMany({
      take: 5,
      include: {
        event: { select: { name: true } },
        coach: { select: { name: true } }
      }
    });
    
    console.log('Existing orders:', orders.length);
    orders.forEach(o => console.log('- Order:', o.orderNumber, 'for', o.event?.name, 'by', o.coach?.name, 'status:', o.status));
    
  } catch (error) {
    console.error('Database check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();