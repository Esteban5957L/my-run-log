import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Crear entrenador de prueba
  const coachPassword = await bcrypt.hash('coach123', 12);
  const coach = await prisma.user.upsert({
    where: { email: 'coach@runnio.com' },
    update: {},
    create: {
      email: 'coach@runnio.com',
      passwordHash: coachPassword,
      name: 'Carlos Entrenador',
      role: 'COACH',
    },
  });
  console.log('✅ Coach created:', coach.email);

  // Crear atletas de prueba
  const athletePassword = await bcrypt.hash('atleta123', 12);
  
  const athlete1 = await prisma.user.upsert({
    where: { email: 'maria@example.com' },
    update: {},
    create: {
      email: 'maria@example.com',
      passwordHash: athletePassword,
      name: 'María García',
      role: 'ATHLETE',
      coachId: coach.id,
    },
  });

  const athlete2 = await prisma.user.upsert({
    where: { email: 'pedro@example.com' },
    update: {},
    create: {
      email: 'pedro@example.com',
      passwordHash: athletePassword,
      name: 'Pedro Martínez',
      role: 'ATHLETE',
      coachId: coach.id,
    },
  });

  const athlete3 = await prisma.user.upsert({
    where: { email: 'ana@example.com' },
    update: {},
    create: {
      email: 'ana@example.com',
      passwordHash: athletePassword,
      name: 'Ana López',
      role: 'ATHLETE',
      coachId: coach.id,
    },
  });

  console.log('✅ Athletes created:', [athlete1.email, athlete2.email, athlete3.email]);

  // Crear actividades de prueba para María
  const activities = [
    {
      userId: athlete1.id,
      name: 'Carrera matutina',
      activityType: 'RUNNING' as const,
      date: new Date('2026-01-13T07:30:00'),
      distance: 10.5,
      duration: 3150, // 52:30
      elevationGain: 85,
      avgPace: 300, // 5:00/km
      avgHeartRate: 148,
      locationName: 'Retiro, Madrid',
    },
    {
      userId: athlete1.id,
      name: 'Trail Sierra',
      activityType: 'TRAIL' as const,
      date: new Date('2026-01-11T09:00:00'),
      distance: 15.2,
      duration: 5580, // 1:33:00
      elevationGain: 650,
      avgPace: 367,
      avgHeartRate: 155,
      locationName: 'Sierra de Guadarrama',
    },
    {
      userId: athlete1.id,
      name: 'Series en pista',
      activityType: 'INTERVALS' as const,
      date: new Date('2026-01-09T18:30:00'),
      distance: 8.0,
      duration: 2280, // 38:00
      elevationGain: 15,
      avgPace: 285,
      avgHeartRate: 168,
      locationName: 'Pista de Atletismo',
    },
    {
      userId: athlete2.id,
      name: 'Rodaje suave',
      activityType: 'RECOVERY' as const,
      date: new Date('2026-01-12T08:00:00'),
      distance: 6.0,
      duration: 2160, // 36:00
      elevationGain: 20,
      avgPace: 360,
      avgHeartRate: 128,
      locationName: 'Casa de Campo',
    },
    {
      userId: athlete2.id,
      name: 'Tirada larga',
      activityType: 'LONG_RUN' as const,
      date: new Date('2026-01-10T07:00:00'),
      distance: 22.0,
      duration: 7920, // 2:12:00
      elevationGain: 180,
      avgPace: 360,
      avgHeartRate: 145,
      locationName: 'Anillo Verde Madrid',
    },
  ];

  for (const activity of activities) {
    await prisma.activity.create({ data: activity });
  }
  console.log('✅ Activities created:', activities.length);

  // Crear plan de entrenamiento para María
  const plan = await prisma.trainingPlan.create({
    data: {
      coachId: coach.id,
      athleteId: athlete1.id,
      name: 'Preparación Media Maratón',
      description: 'Plan de 12 semanas para media maratón',
      startDate: new Date('2026-01-13'),
      endDate: new Date('2026-04-05'),
      status: 'ACTIVE',
      sessions: {
        create: [
          {
            date: new Date('2026-01-14'),
            sessionType: 'EASY',
            title: 'Rodaje suave',
            description: 'Carrera fácil para recuperación activa',
            targetDistance: 8,
            targetDuration: 2880, // 48 min
          },
          {
            date: new Date('2026-01-16'),
            sessionType: 'TEMPO',
            title: 'Tempo run',
            description: 'Carrera a ritmo controlado',
            targetDistance: 10,
            targetPace: 300, // 5:00/km
            warmup: '2km trote suave',
            mainWorkout: '6km a ritmo tempo (5:00/km)',
            cooldown: '2km trote suave',
          },
          {
            date: new Date('2026-01-18'),
            sessionType: 'INTERVALS',
            title: 'Series 1000m',
            description: 'Trabajo de velocidad',
            targetDistance: 8,
            warmup: '2km trote + ejercicios',
            mainWorkout: '5x1000m a 4:30/km, recuperación 2min',
            cooldown: '2km trote suave',
          },
          {
            date: new Date('2026-01-19'),
            sessionType: 'LONG_RUN',
            title: 'Tirada larga',
            description: 'Carrera larga del fin de semana',
            targetDistance: 18,
            targetPace: 360, // 6:00/km
          },
        ],
      },
    },
  });
  console.log('✅ Training plan created:', plan.name);

  // Crear invitación de prueba
  const invitation = await prisma.invitation.create({
    data: {
      coachId: coach.id,
      code: 'TEST2026',
      expiresAt: new Date('2026-02-14'),
    },
  });
  console.log('✅ Invitation created:', invitation.code);

  // Crear mensajes de prueba
  await prisma.message.createMany({
    data: [
      {
        senderId: coach.id,
        receiverId: athlete1.id,
        content: '¡Hola María! ¿Cómo te sientes después del entrenamiento de ayer?',
        sentAt: new Date('2026-01-13T10:00:00'),
      },
      {
        senderId: athlete1.id,
        receiverId: coach.id,
        content: '¡Hola Carlos! Me siento muy bien, las piernas respondieron genial.',
        sentAt: new Date('2026-01-13T10:15:00'),
        readAt: new Date('2026-01-13T10:20:00'),
      },
      {
        senderId: coach.id,
        receiverId: athlete1.id,
        content: 'Perfecto, entonces mañana hacemos el tempo como estaba planificado. ¡Vamos a por ello!',
        sentAt: new Date('2026-01-13T10:25:00'),
      },
    ],
  });
  console.log('✅ Messages created');

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Database seeded successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('📧 Test accounts:');
  console.log('   Coach:   coach@runnio.com / coach123');
  console.log('   Athlete: maria@example.com / atleta123');
  console.log('   Athlete: pedro@example.com / atleta123');
  console.log('   Athlete: ana@example.com / atleta123');
  console.log('');
  console.log('🔗 Invitation code: TEST2026');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
