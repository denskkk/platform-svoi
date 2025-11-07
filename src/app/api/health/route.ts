/**
 * GET /api/health
 * Health check endpoint для моніторингу стану сервера
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Перевірка з'єднання з БД
    await prisma.$queryRaw`SELECT 1`;
    const dbResponseTime = Date.now() - startTime;

    // Статистика системи
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime / 60)} хвилин`,
      database: {
        status: 'connected',
        responseTime: `${dbResponseTime}ms`,
      },
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      },
      environment: process.env.NODE_ENV,
      nodeVersion: process.version,
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });

  } catch (error) {
    console.error('[Health Check] Database connection failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        status: 'disconnected',
        error: 'Cannot connect to database',
      },
      memory: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
      },
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });
  }
}
