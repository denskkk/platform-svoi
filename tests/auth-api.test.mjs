import assert from 'node:assert/strict';
import { test } from 'node:test';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

process.env.NODE_ENV = 'development';
process.env.JWT_SECRET = 'auth-api-test-jwt-secret-not-for-production';
process.env.REFRESH_TOKEN_SECRET = 'auth-api-test-refresh-secret-not-for-production';

const prismaModule = await import('../src/lib/prisma.ts');
const prisma = prismaModule.prisma ?? prismaModule.default.prisma;
globalThis.prisma = prisma;

const [loginModule, refreshModule, logoutModule, meModule, authModule, { NextRequest }] =
  await Promise.all([
    import('../src/app/api/auth/login/route.ts'),
    import('../src/app/api/auth/refresh/route.ts'),
    import('../src/app/api/auth/logout/route.ts'),
    import('../src/app/api/auth/me/route.ts'),
    import('../src/lib/auth.ts'),
    import('next/server'),
  ]);
const login = loginModule.POST;
const refresh = refreshModule.POST;
const logout = logoutModule.POST;
const me = meModule.GET;
const hashToken = authModule.hashToken ?? authModule.default.hashToken;

function request(url, method, { body, cookie, ip = '192.0.2.1' } = {}) {
  const headers = { 'x-forwarded-for': ip };
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (cookie) headers.cookie = cookie;
  return new NextRequest(`http://localhost${url}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

function cookiePair(response) {
  const accessToken = response.cookies.get('token')?.value;
  const refreshToken = response.cookies.get('refreshToken')?.value;
  assert.ok(accessToken, 'response should set an access cookie');
  assert.ok(refreshToken, 'response should set a refresh cookie');
  return `token=${accessToken}; refreshToken=${refreshToken}`;
}

function project(data, select) {
  if (!select) return data;
  return Object.fromEntries(
    Object.keys(select)
      .filter((key) => select[key] === true && key in data)
      .map((key) => [key, data[key]]),
  );
}

function replaceMethod(target, name, implementation) {
  const original = target[name];
  Object.defineProperty(target, name, {
    configurable: true,
    writable: true,
    value: implementation,
  });
  return () => Object.defineProperty(target, name, {
    configurable: true,
    writable: true,
    value: original,
  });
}

test('login, refresh rotation, legacy access and logout use server-verified sessions', async () => {
  const storedUser = {
    id: 501,
    email: 'user@example.com',
    firstName: 'Test',
    lastName: 'Account',
    passwordHash: await bcrypt.hash('Correct-password-123', 4),
    role: 'user',
    accountType: 'basic',
    avatarUrl: null,
    city: null,
    isAdmin: false,
    isVerified: true,
    isActive: true,
  };
  let active = true;
  let storedSession = null;
  const replacements = [
    replaceMethod(prisma.user, 'findUnique', async ({ where, select }) => {
      if (where.id !== undefined && where.id !== storedUser.id) return null;
      if (where.email !== undefined && where.email !== storedUser.email) return null;
      return project({ ...storedUser, isActive: active }, select);
    }),
    replaceMethod(prisma.user, 'findMany', async ({ where, select }) => {
      const soughtEmail = where.email?.equals;
      if (!soughtEmail || soughtEmail.toLowerCase() !== storedUser.email.toLowerCase()) return [];
      return [project({ ...storedUser, isActive: active }, select)];
    }),
    replaceMethod(prisma.session, 'deleteMany', async () => ({ count: 0 })),
    replaceMethod(prisma.session, 'create', async ({ data }) => {
      storedSession = { id: 'test-session', ...data, isActive: true };
      return storedSession;
    }),
    replaceMethod(prisma.session, 'findFirst', async ({ where }) => {
      if (!storedSession || !storedSession.isActive) return null;
      if (where.id && where.id !== storedSession.id) return null;
      if (where.userId !== undefined && where.userId !== storedSession.userId) return null;
      if (where.tokenHash && where.tokenHash !== storedSession.tokenHash) return null;
      if (where.refreshTokenHash && where.refreshTokenHash !== storedSession.refreshTokenHash) return null;
      if (Object.hasOwn(where, 'refreshTokenHash') && where.refreshTokenHash === null && storedSession.refreshTokenHash !== null) return null;
      if (where.expiresAt?.gt && storedSession.expiresAt <= where.expiresAt.gt) return null;
      return { id: storedSession.id };
    }),
    replaceMethod(prisma.session, 'updateMany', async ({ where, data }) => {
      if (!storedSession || !storedSession.isActive) return { count: 0 };
      const alternatives = where.OR;
      const matchesAny = !alternatives || alternatives.some((item) =>
        (item.tokenHash && item.tokenHash === storedSession.tokenHash)
        || (item.id?.in && item.id.in.includes(storedSession.id))
        || (item.refreshTokenHash && item.refreshTokenHash === storedSession.refreshTokenHash),
      );
      if (!matchesAny) return { count: 0 };
      if (where.id && where.id !== storedSession.id) return { count: 0 };
      if (where.refreshTokenHash && where.refreshTokenHash !== storedSession.refreshTokenHash) return { count: 0 };
      if (Object.hasOwn(where, 'refreshTokenHash') && where.refreshTokenHash === null && storedSession.refreshTokenHash !== null) return { count: 0 };
      if (where.expiresAt?.gt && storedSession.expiresAt <= where.expiresAt.gt) return { count: 0 };
      Object.assign(storedSession, data);
      return { count: 1 };
    }),
  ];

  try {
    const loginResponse = await login(request('/api/auth/login', 'POST', {
      body: { email: '  USER@Example.com  ', password: 'Correct-password-123' },
      ip: '192.0.2.10',
    }));
    assert.equal(loginResponse.status, 200);
    const loginBody = await loginResponse.json();
    assert.equal(loginBody.user.email, storedUser.email);
    assert.equal('passwordHash' in loginBody.user, false);
    const oldRefreshToken = loginResponse.cookies.get('refreshToken').value;
    const activeAccessCookie = `token=${loginResponse.cookies.get('token').value}`;
    const refreshHash = storedSession.refreshTokenHash;
    storedSession.refreshTokenHash = null;
    const activeMeResponse = await me(request('/api/auth/me', 'GET', { cookie: activeAccessCookie }));
    assert.equal(activeMeResponse.status, 200);
    storedSession.refreshTokenHash = refreshHash;

    const badPasswordResponse = await login(request('/api/auth/login', 'POST', {
      body: { email: storedUser.email, password: 'incorrect-password' },
      ip: '192.0.2.11',
    }));
    assert.equal(badPasswordResponse.status, 401);
    const badPasswordBody = await badPasswordResponse.json();
    assert.deepEqual(badPasswordBody, { error: 'Невірний email або пароль' });

    const missingUserResponse = await login(request('/api/auth/login', 'POST', {
      body: { email: 'missing@example.com', password: 'Correct-password-123' },
      ip: '192.0.2.12',
    }));
    assert.equal(missingUserResponse.status, 401);
    assert.deepEqual(await missingUserResponse.json(), badPasswordBody);

    const expiredAccess = jwt.sign(
      { userId: storedUser.id, email: storedUser.email, role: storedUser.role },
      process.env.JWT_SECRET,
      { expiresIn: -1 },
    );
    const refreshCookie = `token=${expiredAccess}; sviy_refresh=${oldRefreshToken}`;
    const [refreshOne, refreshTwo] = await Promise.all([
      refresh(request('/api/auth/refresh', 'POST', { cookie: refreshCookie })),
      refresh(request('/api/auth/refresh', 'POST', { cookie: refreshCookie })),
    ]);
    const refreshResponses = [refreshOne, refreshTwo];
    // Паралельні/повторні refresh (кілька вкладок, втрачена відповідь) не вилогінюють користувача
    assert.deepEqual(refreshResponses.map((response) => response.status), [200, 200]);
    const rotatedResponse = refreshResponses[1];
    const rotatedCookie = cookiePair(rotatedResponse);
    assert.ok([
      hashToken(refreshOne.cookies.get('refreshToken').value),
      hashToken(refreshTwo.cookies.get('refreshToken').value),
    ].includes(storedSession.refreshTokenHash));

    // Старий refresh-токен лишається чинним, поки сесія активна (відповідь могла загубитись у мережі)
    const replayResponse = await refresh(request('/api/auth/refresh', 'POST', { cookie: refreshCookie }));
    assert.equal(replayResponse.status, 200);

    // Токени, видані раніше, не інвалідуються оновленням
    for (const cookie of [activeAccessCookie, cookiePair(refreshOne), cookiePair(refreshTwo), cookiePair(replayResponse)]) {
      assert.equal((await me(request('/api/auth/me', 'GET', { cookie }))).status, 200);
    }

    // Origin за reverse proxy: протокол у request.url може відрізнятися, хост — ні
    const proxied = request('/api/auth/refresh', 'POST', { cookie: refreshCookie });
    proxied.headers.set('origin', 'https://localhost');
    assert.equal((await refresh(proxied)).status, 200);
    const foreign = request('/api/auth/refresh', 'POST', { cookie: refreshCookie });
    foreign.headers.set('origin', 'https://evil.example');
    assert.equal((await refresh(foreign)).status, 403);

    const meResponse = await me(request('/api/auth/me', 'GET', { cookie: rotatedCookie }));
    assert.equal(meResponse.status, 200);
    assert.equal((await meResponse.json()).user.id, storedUser.id);

    const logoutResponse = await logout(request('/api/auth/logout', 'POST', { cookie: rotatedCookie }));
    assert.equal(logoutResponse.status, 200);
    assert.equal(storedSession.isActive, false);
    const afterLogoutResponse = await me(request('/api/auth/me', 'GET', { cookie: rotatedCookie }));
    assert.equal(afterLogoutResponse.status, 401);

    active = false;
    const inactiveResponse = await login(request('/api/auth/login', 'POST', {
      body: { email: storedUser.email, password: 'Correct-password-123' },
      ip: '192.0.2.13',
    }));
    assert.equal(inactiveResponse.status, 401);

    active = true;
    const secondLoginResponse = await login(request('/api/auth/login', 'POST', {
      body: { email: storedUser.email, password: 'Correct-password-123' },
      ip: '192.0.2.14',
    }));
    assert.equal(secondLoginResponse.status, 200);
    const secondSession = storedSession;
    const secondAccess = secondLoginResponse.cookies.get('token').value;
    secondSession.refreshTokenHash = null;
    const legacyRefreshResponse = await refresh(request('/api/auth/refresh', 'POST', {
      cookie: `token=${secondAccess}`,
    }));
    assert.equal(legacyRefreshResponse.status, 200, 'active legacy sessions should migrate to refresh');
    assert.ok(secondSession.refreshTokenHash);
    const newRefresh = legacyRefreshResponse.cookies.get('refreshToken').value;
    await logout(request('/api/auth/logout', 'POST', {
      cookie: `token=stale-access; refreshToken=${newRefresh}`,
    }));
    assert.equal(secondSession.isActive, false, 'logout should revoke by refresh cookie when access cookie is stale');

    // Успішні входи з одного IP (спільний IP мобільної мережі) не впираються в ліміт
    for (let i = 0; i < 15; i++) {
      const ok = await login(request('/api/auth/login', 'POST', {
        body: { email: storedUser.email, password: 'Correct-password-123' },
        ip: '192.0.2.50',
      }));
      assert.equal(ok.status, 200);
    }

    // Блокуються лише повторні НЕВДАЛІ спроби для того самого акаунта з того самого IP
    for (let i = 0; i < 10; i++) {
      const bad = await login(request('/api/auth/login', 'POST', {
        body: { email: storedUser.email, password: 'wrong' },
        ip: '192.0.2.60',
      }));
      assert.equal(bad.status, 401);
    }
    const blocked = await login(request('/api/auth/login', 'POST', {
      body: { email: storedUser.email, password: 'Correct-password-123' },
      ip: '192.0.2.60',
    }));
    assert.equal(blocked.status, 429);
    const otherDevice = await login(request('/api/auth/login', 'POST', {
      body: { email: storedUser.email, password: 'Correct-password-123' },
      ip: '192.0.2.61',
    }));
    assert.equal(otherDevice.status, 200);

    // Типові «побічні ефекти» мобільної клавіатури не повинні блокувати вхід
    for (const [index, typed] of ['Correct-password-123 ', ' Correct-password-123', 'correct-password-123'].entries()) {
      const keyboard = await login(request('/api/auth/login', 'POST', {
        body: { email: 'USER@example.com', password: typed },
        ip: `192.0.2.7${index}`,
      }));
      assert.equal(keyboard.status, 200, `password variant ${JSON.stringify(typed)} should be accepted`);
    }
    const stillWrong = await login(request('/api/auth/login', 'POST', {
      body: { email: storedUser.email, password: 'Totally-different-1' },
      ip: '192.0.2.80',
    }));
    assert.equal(stillWrong.status, 401);
  } finally {
    for (const restore of replacements) restore();
  }
});
