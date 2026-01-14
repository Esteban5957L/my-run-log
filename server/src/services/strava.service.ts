import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { ActivityType } from '@prisma/client';

const STRAVA_API_BASE = 'https://www.strava.com/api/v3';
const STRAVA_OAUTH_BASE = 'https://www.strava.com/oauth';

interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete: {
    id: number;
    firstname: string;
    lastname: string;
  };
}

interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  start_date: string;
  distance: number; // metros
  moving_time: number; // segundos
  elapsed_time: number;
  total_elevation_gain: number;
  average_speed: number; // m/s
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  calories?: number;
  start_latlng?: [number, number];
  map?: {
    summary_polyline: string;
  };
  splits_metric?: Array<{
    distance: number;
    elapsed_time: number;
    elevation_difference: number;
    moving_time: number;
    split: number;
    average_speed: number;
    average_heartrate?: number;
    pace_zone: number;
  }>;
}

export function getStravaAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.STRAVA_CLIENT_ID || '',
    redirect_uri: env.STRAVA_REDIRECT_URI || '',
    response_type: 'code',
    scope: 'read,activity:read_all',
    state,
  });

  return `${STRAVA_OAUTH_BASE}/authorize?${params.toString()}`;
}

export async function exchangeStravaCode(code: string): Promise<StravaTokenResponse> {
  console.log('🔄 Exchanging Strava code...');
  console.log('   Client ID:', env.STRAVA_CLIENT_ID);
  console.log('   Client Secret:', env.STRAVA_CLIENT_SECRET ? `${env.STRAVA_CLIENT_SECRET.substring(0, 8)}...` : 'NOT SET');
  console.log('   Code:', code.substring(0, 10) + '...');
  
  const response = await fetch(`${STRAVA_OAUTH_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.STRAVA_CLIENT_ID,
      client_secret: env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Strava OAuth error response:', error);
    throw new Error(`Strava OAuth error: ${error}`);
  }

  console.log('✅ Strava code exchanged successfully');
  return response.json() as Promise<StravaTokenResponse>;
}

export async function refreshStravaToken(refreshToken: string): Promise<StravaTokenResponse> {
  const response = await fetch(`${STRAVA_OAUTH_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.STRAVA_CLIENT_ID,
      client_secret: env.STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh Strava token');
  }

  return response.json() as Promise<StravaTokenResponse>;
}

async function getValidAccessToken(userId: string): Promise<string | null> {
  const stravaToken = await prisma.stravaToken.findUnique({
    where: { userId }
  });

  if (!stravaToken) return null;

  // Verificar si el token ha expirado
  if (stravaToken.expiresAt < new Date()) {
    try {
      const newTokens = await refreshStravaToken(stravaToken.refreshToken);
      
      await prisma.stravaToken.update({
        where: { userId },
        data: {
          accessToken: newTokens.access_token,
          refreshToken: newTokens.refresh_token,
          expiresAt: new Date(newTokens.expires_at * 1000),
        }
      });

      return newTokens.access_token;
    } catch (error) {
      console.error('Error refreshing Strava token:', error);
      return null;
    }
  }

  return stravaToken.accessToken;
}

export async function fetchStravaActivities(
  userId: string, 
  options: { after?: number; before?: number; perPage?: number } = {}
): Promise<StravaActivity[]> {
  const accessToken = await getValidAccessToken(userId);
  
  if (!accessToken) {
    throw new Error('No valid Strava token');
  }

  const params = new URLSearchParams();
  if (options.after) params.append('after', options.after.toString());
  if (options.before) params.append('before', options.before.toString());
  params.append('per_page', (options.perPage || 30).toString());

  const response = await fetch(
    `${STRAVA_API_BASE}/athlete/activities?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch Strava activities');
  }

  return response.json() as Promise<StravaActivity[]>;
}

export async function fetchStravaActivityDetail(
  userId: string,
  activityId: number
): Promise<StravaActivity> {
  const accessToken = await getValidAccessToken(userId);
  
  if (!accessToken) {
    throw new Error('No valid Strava token');
  }

  const response = await fetch(
    `${STRAVA_API_BASE}/activities/${activityId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch Strava activity detail');
  }

  return response.json() as Promise<StravaActivity>;
}

function mapStravaActivityType(stravaType: string): ActivityType {
  const typeMap: Record<string, ActivityType> = {
    'Run': 'RUNNING',
    'TrailRun': 'TRAIL',
    'VirtualRun': 'RUNNING',
    'Race': 'RACE',
  };

  return typeMap[stravaType] || 'RUNNING';
}

export async function syncStravaActivities(userId: string): Promise<number> {
  const activities = await fetchStravaActivities(userId, { perPage: 30 });
  
  let syncedCount = 0;

  for (const stravaActivity of activities) {
    // Solo sincronizar actividades de running
    if (!['Run', 'TrailRun', 'VirtualRun', 'Race'].includes(stravaActivity.type)) {
      continue;
    }

    // Verificar si ya existe
    const existing = await prisma.activity.findUnique({
      where: { stravaId: stravaActivity.id.toString() }
    });

    if (existing) continue;

    // Calcular pace (segundos por km)
    const distanceKm = stravaActivity.distance / 1000;
    const avgPace = distanceKm > 0 ? stravaActivity.moving_time / distanceKm : 0;

    await prisma.activity.create({
      data: {
        userId,
        stravaId: stravaActivity.id.toString(),
        name: stravaActivity.name,
        activityType: mapStravaActivityType(stravaActivity.type),
        date: new Date(stravaActivity.start_date),
        distance: distanceKm,
        duration: stravaActivity.moving_time,
        elevationGain: Math.round(stravaActivity.total_elevation_gain),
        avgPace,
        avgHeartRate: stravaActivity.average_heartrate ? Math.round(stravaActivity.average_heartrate) : null,
        maxHeartRate: stravaActivity.max_heartrate ? Math.round(stravaActivity.max_heartrate) : null,
        calories: stravaActivity.calories,
        startLat: stravaActivity.start_latlng?.[0],
        startLng: stravaActivity.start_latlng?.[1],
        mapPolyline: stravaActivity.map?.summary_polyline,
        splits: stravaActivity.splits_metric ? JSON.stringify(stravaActivity.splits_metric) : undefined,
      }
    });

    syncedCount++;
  }

  return syncedCount;
}

export async function disconnectStrava(userId: string): Promise<void> {
  const stravaToken = await prisma.stravaToken.findUnique({
    where: { userId }
  });

  if (stravaToken) {
    // Revocar acceso en Strava
    try {
      await fetch(`${STRAVA_OAUTH_BASE}/deauthorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `access_token=${stravaToken.accessToken}`,
      });
    } catch (error) {
      console.error('Error revoking Strava access:', error);
    }

    // Eliminar token de la base de datos
    await prisma.stravaToken.delete({
      where: { userId }
    });
  }
}
