import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import * as stravaService from '../services/strava.service.js';

// Iniciar flujo OAuth de Strava
export async function initiateAuth(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!env.STRAVA_CLIENT_ID || !env.STRAVA_CLIENT_SECRET) {
      return res.status(500).json({ error: 'Strava no está configurado' });
    }

    // Usar el userId como state para verificar en el callback
    const authUrl = stravaService.getStravaAuthUrl(req.user.userId);
    
    res.json({ authUrl });
  } catch (error) {
    console.error('Strava auth initiate error:', error);
    res.status(500).json({ error: 'Error al iniciar autenticación con Strava' });
  }
}

// Callback de OAuth de Strava
export async function handleCallback(req: Request, res: Response) {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`${env.FRONTEND_URL}/settings?strava=error&message=${error}`);
    }

    if (!code || !state || typeof code !== 'string' || typeof state !== 'string') {
      return res.redirect(`${env.FRONTEND_URL}/settings?strava=error&message=invalid_params`);
    }

    // state contiene el userId
    const userId = state;

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.redirect(`${env.FRONTEND_URL}/settings?strava=error&message=user_not_found`);
    }

    // Intercambiar código por tokens
    const tokens = await stravaService.exchangeStravaCode(code);

    // Guardar o actualizar tokens
    await prisma.stravaToken.upsert({
      where: { userId },
      create: {
        userId,
        stravaAthleteId: tokens.athlete.id.toString(),
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(tokens.expires_at * 1000),
      },
      update: {
        stravaAthleteId: tokens.athlete.id.toString(),
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(tokens.expires_at * 1000),
      }
    });

    // Sincronizar actividades iniciales
    try {
      await stravaService.syncStravaActivities(userId);
    } catch (syncError) {
      console.error('Initial sync error:', syncError);
    }

    res.redirect(`${env.FRONTEND_URL}/settings?strava=success`);
  } catch (error) {
    console.error('Strava callback error:', error);
    res.redirect(`${env.FRONTEND_URL}/settings?strava=error&message=auth_failed`);
  }
}

// Sincronizar actividades manualmente
export async function syncActivities(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const stravaToken = await prisma.stravaToken.findUnique({
      where: { userId: req.user.userId }
    });

    if (!stravaToken) {
      return res.status(400).json({ error: 'Strava no está conectado' });
    }

    const result = await stravaService.syncStravaActivities(req.user.userId);

    res.json({ 
      message: result.linked > 0 
        ? `Sincronización completada. ${result.linked} actividades vinculadas con tu plan de entrenamiento.`
        : `Sincronización completada`,
      syncedActivities: result.synced,
      linkedToPlans: result.linked
    });
  } catch (error) {
    console.error('Strava sync error:', error);
    res.status(500).json({ error: 'Error al sincronizar actividades' });
  }
}

// Desconectar Strava
export async function disconnect(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    await stravaService.disconnectStrava(req.user.userId);

    res.json({ message: 'Strava desconectado exitosamente' });
  } catch (error) {
    console.error('Strava disconnect error:', error);
    res.status(500).json({ error: 'Error al desconectar Strava' });
  }
}

// Obtener estado de conexión con Strava
export async function getStatus(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const stravaToken = await prisma.stravaToken.findUnique({
      where: { userId: req.user.userId },
      select: {
        stravaAthleteId: true,
        expiresAt: true,
        updatedAt: true,
      }
    });

    res.json({
      connected: !!stravaToken,
      stravaAthleteId: stravaToken?.stravaAthleteId,
      lastSync: stravaToken?.updatedAt,
    });
  } catch (error) {
    console.error('Strava status error:', error);
    res.status(500).json({ error: 'Error al obtener estado de Strava' });
  }
}

// Webhook de Strava (para recibir nuevas actividades)
export async function webhookVerify(req: Request, res: Response) {
  const { 'hub.mode': mode, 'hub.verify_token': verifyToken, 'hub.challenge': challenge } = req.query;

  if (mode === 'subscribe' && verifyToken === env.STRAVA_WEBHOOK_VERIFY_TOKEN) {
    console.log('Strava webhook verified');
    res.json({ 'hub.challenge': challenge });
  } else {
    res.status(403).json({ error: 'Verification failed' });
  }
}

export async function webhookReceive(req: Request, res: Response) {
  try {
    const { object_type, object_id, aspect_type, owner_id } = req.body;

    console.log('Strava webhook received:', { object_type, object_id, aspect_type, owner_id });

    // Solo procesar actividades
    if (object_type !== 'activity') {
      return res.status(200).json({ received: true });
    }

    // Buscar usuario por strava_athlete_id
    const stravaToken = await prisma.stravaToken.findFirst({
      where: { stravaAthleteId: owner_id.toString() }
    });

    if (!stravaToken) {
      console.log('No user found for Strava athlete:', owner_id);
      return res.status(200).json({ received: true });
    }

    if (aspect_type === 'create' || aspect_type === 'update') {
      // Sincronizar la actividad específica
      try {
        await stravaService.syncStravaActivities(stravaToken.userId);
      } catch (error) {
        console.error('Error syncing activity from webhook:', error);
      }
    } else if (aspect_type === 'delete') {
      // Eliminar la actividad
      await prisma.activity.deleteMany({
        where: { stravaId: object_id.toString() }
      });
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Strava webhook error:', error);
    res.status(200).json({ received: true }); // Siempre responder 200 a Strava
  }
}
