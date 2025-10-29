/**
 * GET /api/messages
 * Отримати повідомлення користувача
 * 
 * POST /api/messages
 * Відправити повідомлення
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';

// GET - Отримати повідомлення
export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization');
    const token = getTokenFromHeader(authorization);

    if (!token) {
      return NextResponse.json(
        { error: 'Необхідна авторизація' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Невірний токен' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const withUserId = searchParams.get('withUserId');

    let messages;

    if (withUserId) {
      // Отримати переписку з конкретним користувачем
      messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: payload.userId, receiverId: parseInt(withUserId) },
            { senderId: parseInt(withUserId), receiverId: payload.userId }
          ]
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            }
          },
          receiver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });
    } else {
      // Отримати список всіх чатів
      messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: payload.userId },
            { receiverId: payload.userId }
          ]
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            }
          },
          receiver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    }

    return NextResponse.json({ messages });

  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Помилка сервера' },
      { status: 500 }
    );
  }
}

// POST - Відправити повідомлення
export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization');
    const token = getTokenFromHeader(authorization);

    if (!token) {
      return NextResponse.json(
        { error: 'Необхідна авторизація' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Невірний токен' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { receiverId, text } = body;

    if (!receiverId || !text) {
      return NextResponse.json(
        { error: 'Вкажіть отримувача та текст повідомлення' },
        { status: 400 }
      );
    }

    const message = await prisma.message.create({
      data: {
        senderId: payload.userId,
        receiverId,
        text,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          }
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          }
        }
      }
    });

    // Створити сповіщення
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'new_message',
        title: 'Нове повідомлення',
        message: `${payload.email} надіслав вам повідомлення`,
        relatedUserId: payload.userId,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Повідомлення відправлено!',
      data: message,
    }, { status: 201 });

  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Помилка сервера' },
      { status: 500 }
    );
  }
}
