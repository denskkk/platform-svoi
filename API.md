# 🔌 API Documentation - СВІЙ ДЛЯ СВОЇХ

## Base URL
```
http://localhost:3000/api
```

## Authentication
Більшість endpoints потребують JWT токен в header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 🔐 Authentication Endpoints

### POST /auth/register
Реєстрація нового користувача

**Request Body:**
```json
{
  "firstName": "Іван",
  "lastName": "Іваненко",
  "email": "ivan@example.com",
  "password": "password123",
  "phone": "+380671234567",
  "city": "Київ",
  "role": "user"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Реєстрація успішна!",
  "user": {
    "userId": 1,
    "firstName": "Іван",
    "lastName": "Іваненко",
    "email": "ivan@example.com",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### POST /auth/login
Вхід користувача

**Request Body:**
```json
{
  "email": "ivan@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Вхід успішний!",
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### POST /auth/logout
Вихід користувача (видалення сесії)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Вихід успішний!"
}
```

---

## 👤 Profile Endpoints

### GET /profile/:id
Отримати профіль користувача

**Response:**
```json
{
  "user": {
    "userId": 1,
    "firstName": "Іван",
    "lastName": "Іваненко",
    "email": "ivan@example.com",
    "city": "Київ",
    "bio": "Професійний сантехнік...",
    "avgRating": 4.5,
    "totalReviews": 10,
    "isVerified": true,
    "services": [...],
    "reviewsReceived": [...]
  }
}
```

---

### PUT /profile/:id
Оновити свій профіль (тільки власник)

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "firstName": "Іван",
  "lastName": "Іваненко",
  "phone": "+380671234567",
  "city": "Київ",
  "bio": "Оновлена біографія...",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

---

## 📋 Services Endpoints

### GET /services
Отримати список послуг з фільтрами

**Query Parameters:**
- `q` - пошуковий запит
- `category` - slug категорії
- `city` - місто
- `priceFrom` - мінімальна ціна
- `priceTo` - максимальна ціна
- `page` - сторінка (default: 1)
- `limit` - к-сть на сторінці (default: 20)

**Example:**
```
GET /services?city=Київ&category=pobut&page=1&limit=10
```

**Response:**
```json
{
  "services": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

---

### POST /services
Створити нову послугу

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "categoryId": 1,
  "title": "Ремонт сантехніки",
  "description": "Професійний ремонт...",
  "priceFrom": 300,
  "priceTo": 2000,
  "priceUnit": "грн",
  "city": "Київ"
}
```

---

### GET /services/:id
Отримати конкретну послугу

---

### PUT /services/:id
Оновити послугу (тільки власник)

**Headers:**
```
Authorization: Bearer <token>
```

---

### DELETE /services/:id
Видалити послугу (тільки власник)

**Headers:**
```
Authorization: Bearer <token>
```

---

## ⭐ Reviews Endpoints

### POST /reviews
Створити відгук

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "reviewedId": 2,
  "rating": 5,
  "comment": "Чудовий майстер!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Відгук створено!",
  "review": {
    "reviewId": 1,
    "rating": 5,
    "comment": "Чудовий майстер!",
    "reviewer": { ... }
  }
}
```

---

### GET /reviews?userId=:id
Отримати відгуки користувача

**Response:**
```json
{
  "reviews": [
    {
      "reviewId": 1,
      "rating": 5,
      "comment": "Чудовий майстер!",
      "createdAt": "2024-01-01T10:00:00Z",
      "reviewer": {
        "userId": 1,
        "firstName": "Марія",
        "lastName": "Петренко",
        "avatarUrl": "..."
      }
    }
  ]
}
```

---

## 💬 Messages Endpoints

### GET /messages
Отримати всі повідомлення

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `withUserId` - отримати переписку з конкретним користувачем

**Example:**
```
GET /messages?withUserId=2
```

---

### POST /messages
Відправити повідомлення

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "receiverId": 2,
  "text": "Доброго дня! Цікавить ваша послуга."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Повідомлення відправлено!",
  "data": {
    "messageId": 1,
    "text": "Доброго дня!",
    "sender": { ... },
    "receiver": { ... }
  }
}
```

---

## ❤️ Favorites Endpoints

### GET /favorites
Отримати обрані профілі

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "favorites": [
    {
      "favoriteId": 1,
      "targetUser": {
        "userId": 2,
        "firstName": "Марія",
        "lastName": "Петренко",
        "city": "Львів",
        "avgRating": 4.8
      },
      "createdAt": "2024-01-01T10:00:00Z"
    }
  ]
}
```

---

### POST /favorites
Додати в обране

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "targetUserId": 2
}
```

---

### DELETE /favorites?targetUserId=:id
Видалити з обраного

**Headers:**
```
Authorization: Bearer <token>
```

---

## 🏷️ Categories Endpoint

### GET /categories
Отримати всі категорії

**Response:**
```json
{
  "categories": [
    {
      "categoryId": 1,
      "name": "Побут",
      "slug": "pobut",
      "emoji": "🏠",
      "description": "Побутові послуги",
      "sortOrder": 1,
      "_count": {
        "services": 15
      }
    }
  ]
}
```

---

## 🌍 Cities Endpoint

### GET /cities
Отримати всі міста

**Response:**
```json
{
  "cities": [
    {
      "cityId": 1,
      "name": "Київ",
      "region": "Київська область",
      "latitude": 50.4501,
      "longitude": 30.5234,
      "usersCount": 150,
      "servicesCount": 200
    }
  ]
}
```

---

## Error Responses

Всі помилки повертаються в форматі:

```json
{
  "error": "Опис помилки"
}
```

### HTTP Status Codes:
- `200` - OK
- `201` - Created
- `400` - Bad Request (невірні дані)
- `401` - Unauthorized (не авторизовано)
- `403` - Forbidden (немає прав)
- `404` - Not Found (не знайдено)
- `409` - Conflict (конфлікт даних)
- `500` - Internal Server Error (помилка сервера)

---

## Testing with curl

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Іван",
    "lastName": "Іваненко",
    "email": "ivan@example.com",
    "password": "password123",
    "city": "Київ"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ivan@example.com",
    "password": "password123"
  }'
```

### Get Services
```bash
curl http://localhost:3000/api/services?city=Київ
```

### Create Service (with auth)
```bash
curl -X POST http://localhost:3000/api/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "categoryId": 1,
    "title": "Ремонт сантехніки",
    "description": "Професійний ремонт",
    "priceFrom": 300,
    "priceTo": 2000,
    "city": "Київ"
  }'
```

---

**Документація оновлена:** 2024
**API Version:** 1.0
