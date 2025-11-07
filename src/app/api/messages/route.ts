/**
 * GET /api/messages
 * Отримати повідомлення користувача
 * 
 * POST /api/messages
 * Відправити повідомлення
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthWithPermission } from '@/lib/api-middleware';

// GET - Отримати повідомлення
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthWithPermission(request, 'VIEW_MESSAGES');
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const withUserId = searchParams.get('withUserId');

    let messages;

    if (withUserId) {
      // Отримати переписку з конкретним користувачем
      messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: auth.user.userId, receiverId: parseInt(withUserId) },
            { senderId: parseInt(withUserId), receiverId: auth.user.userId }
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
            { senderId: auth.user.userId },
            { receiverId: auth.user.userId }
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
    const auth = await requireAuthWithPermission(request, 'SEND_MESSAGE');
    if (auth.error) return auth.error;

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
        senderId: auth.user.userId,
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
        message: `${auth.user.email} надіслав вам повідомлення`,
        relatedUserId: auth.user.userId,
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
