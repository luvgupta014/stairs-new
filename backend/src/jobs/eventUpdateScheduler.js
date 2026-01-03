const prisma = require('../utils/prismaClient');
const { sendEmail } = require('../utils/emailService');

const DAY_MS = 24 * 60 * 60 * 1000;

const jsonData = (obj) => {
  try { return JSON.stringify(obj); } catch { return null; }
};

const startOfDayUTC = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

const daysBetweenUTC = (a, b) => {
  const sa = startOfDayUTC(a).getTime();
  const sb = startOfDayUTC(b).getTime();
  return Math.round((sb - sa) / DAY_MS);
};

async function alreadyNotified({ userId, eventId, kind }) {
  const needle = `"kind":"${kind}"`;
  const needle2 = `"eventId":"${eventId}"`;
  const existing = await prisma.notification.findFirst({
    where: {
      userId,
      type: 'GENERAL',
      data: { contains: needle }
    },
    select: { id: true, data: true }
  }).catch(() => null);
  if (!existing?.data) return false;
  return String(existing.data).includes(needle2);
}

async function notifyAndEmail({ user, title, message, data, emailSubject, emailText, emailHtml }) {
  if (!user?.id) return;
  await prisma.notification.create({
    data: {
      userId: user.id,
      type: 'GENERAL',
      title,
      message,
      data
    }
  }).catch(() => null);

  // Best-effort email
  if (user.email && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      await sendEmail({
        to: user.email,
        subject: emailSubject,
        text: emailText,
        html: emailHtml
      });
    } catch (e) {
      console.warn('⚠️ Event update email failed:', e?.message || e);
    }
  }
}

async function runOnce() {
  const now = new Date();
  const in8Days = new Date(now.getTime() + 8 * DAY_MS);
  const endedSince = new Date(now.getTime() - 2 * DAY_MS);

  // Events starting soon or ended recently (avoid scanning whole DB)
  const events = await prisma.event.findMany({
    where: {
      OR: [
        { startDate: { gte: now, lte: in8Days } },
        { endDate: { gte: endedSince, lte: now } }
      ],
      status: { in: ['APPROVED', 'ACTIVE', 'RESULTS_UPLOADED', 'RESULTS_VALIDATED', 'CERTIFICATES_ISSUED', 'READY_FOR_NEXT_REGISTRATION'] }
    },
    select: {
      id: true,
      uniqueId: true,
      name: true,
      sport: true,
      eventFormat: true,
      startDate: true,
      endDate: true
    },
    take: 200
  });

  for (const ev of events) {
    const daysToStart = daysBetweenUTC(now, ev.startDate);
    const hasEnded = ev.endDate && ev.endDate < now;

    const kinds = [];
    if (!hasEnded && [7, 3, 1].includes(daysToStart)) {
      kinds.push({ kind: `EVENT_STARTS_IN_${daysToStart}_DAYS`, days: daysToStart });
    }
    if (hasEnded) {
      kinds.push({ kind: 'EVENT_ENDED', days: 0 });
    }
    if (!kinds.length) continue;

    // Load registered students for event
    const regs = await prisma.eventRegistration.findMany({
      where: {
        eventId: ev.id,
        status: { in: ['REGISTERED', 'APPROVED', 'PENDING'] }
      },
      select: {
        student: {
          select: {
            user: { select: { id: true, email: true } },
            name: true
          }
        }
      },
      take: 5000
    });

    const students = regs
      .map(r => ({ id: r.student?.user?.id, email: r.student?.user?.email, name: r.student?.name }))
      .filter(u => u.id);

    const eventLink = `${process.env.FRONTEND_URL || ''}/events/${ev.uniqueId || ev.id}`;

    for (const k of kinds) {
      for (const u of students) {
        const already = await alreadyNotified({ userId: u.id, eventId: ev.id, kind: k.kind });
        if (already) continue;

        const data = jsonData({ kind: k.kind, eventId: ev.id, eventUniqueId: ev.uniqueId || null });
        const title = k.kind === 'EVENT_ENDED'
          ? `✅ ${ev.name} has ended`
          : `⏳ ${ev.name} starts in ${k.days} day${k.days === 1 ? '' : 's'}`;

        const msg = k.kind === 'EVENT_ENDED'
          ? `Thanks for participating in ${ev.name}. Results and certificates will be shared soon.`
          : `Hang tight! ${ev.name} starts in ${k.days} day${k.days === 1 ? '' : 's'}. We’ll share updates and instructions here.`;

        const emailSubject = title;
        const emailText = `Hi ${u.name || 'Athlete'},\n\n${msg}\n\nEvent: ${ev.name}\nSport: ${ev.sport || ''}\nLink: ${eventLink}\n\n— STAIRS Talent Hub\n`;
        const emailHtml = `
          <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
            <h2 style="margin:0 0 8px 0;">${title}</h2>
            <p style="margin:0 0 12px 0;">Hi <b>${u.name || 'Athlete'}</b>,</p>
            <p style="margin:0 0 12px 0;">${msg}</p>
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:14px;">
              <div><b>Event:</b> ${ev.name}</div>
              ${ev.sport ? `<div><b>Sport:</b> ${ev.sport}</div>` : ''}
              ${ev.eventFormat ? `<div><b>Format:</b> ${ev.eventFormat}</div>` : ''}
              <div style="margin-top:10px;"><a href="${eventLink}" target="_blank" rel="noreferrer">Open event</a></div>
            </div>
            <p style="margin:12px 0 0 0;color:#6b7280;font-size:12px;">© ${new Date().getFullYear()} STAIRS Talent Hub</p>
          </div>
        `;

        await notifyAndEmail({ user: u, title, message: msg, data, emailSubject, emailText, emailHtml });
      }
    }
  }
}

function startEventUpdateScheduler() {
  const enabled = process.env.ENABLE_EVENT_UPDATES !== 'false';
  if (!enabled) return;

  // Run once at startup, then every 6 hours (safe + low overhead)
  runOnce().catch((e) => console.error('Event update scheduler run failed:', e));
  const interval = setInterval(() => {
    runOnce().catch((e) => console.error('Event update scheduler run failed:', e));
  }, 6 * 60 * 60 * 1000);

  interval.unref?.();
  console.log('✅ Event update scheduler started (every 6 hours)');
}

module.exports = { startEventUpdateScheduler };


