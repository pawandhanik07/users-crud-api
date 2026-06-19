# Users CRUD API

A REST API built with Node.js + Express for managing a users resource using an in-memory HashMap store.

---

## Setup

```bash
npm install
npm start          # production
npm run dev        # development with auto-reload (nodemon)
```

Server runs at `http://localhost:3000`

---

## User Schema

| Field       | Type    | Notes                        |
|-------------|---------|------------------------------|
| `id`        | UUID    | Auto-generated               |
| `name`      | string  | Required, non-empty          |
| `email`     | string  | Required, valid email, unique|
| `age`       | integer | Required, 0–150              |
| `createdAt` | ISO 8601| Auto-set on create           |
| `updatedAt` | ISO 8601| Auto-updated on every write  |

---

## Endpoints

### GET /users
Returns all users.

```bash
curl http://localhost:3000/users
```

**Response 200**
```json
{
  "success": true,
  "count": 1,
  "data": [{ "id": "...", "name": "Alice", "email": "alice@example.com", "age": 28, ... }]
}
```

---

### GET /users/:id
Returns a single user by UUID.

```bash
curl http://localhost:3000/users/<uuid>
```

| Status | When              |
|--------|-------------------|
| 200    | User found        |
| 404    | User not found    |

---

### POST /users
Creates a new user. All fields required.

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "email": "alice@example.com", "age": 28}'
```

| Status | When                       |
|--------|----------------------------|
| 201    | Created successfully       |
| 400    | Validation failed          |
| 409    | Email already in use       |

---

### PUT /users/:id
Full replacement update — all fields required.

```bash
curl -X PUT http://localhost:3000/users/<uuid> \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice Smith", "email": "alice@example.com", "age": 29}'
```

| Status | When                       |
|--------|----------------------------|
| 200    | Updated successfully       |
| 400    | Validation failed          |
| 404    | User not found             |
| 409    | Email taken by another user|

---

### PATCH /users/:id
Partial update — only send the fields you want to change.

```bash
curl -X PATCH http://localhost:3000/users/<uuid> \
  -H "Content-Type: application/json" \
  -d '{"age": 30}'
```

| Status | When                       |
|--------|----------------------------|
| 200    | Updated successfully       |
| 400    | Validation failed          |
| 404    | User not found             |
| 409    | Email taken by another user|

---

### DELETE /users/:id
Deletes a user by UUID.

```bash
curl -X DELETE http://localhost:3000/users/<uuid>
```

| Status | When              |
|--------|-------------------|
| 200    | Deleted           |
| 404    | User not found    |

---

## Validation Rules

- **name** — must be a non-empty string
- **email** — must match `user@domain.tld` pattern; case-insensitive uniqueness enforced
- **age** — must be an integer between 0 and 150

---

## Error Response Shape

```json
{
  "success": false,
  "message": "Human-readable error description."
}
```

For validation errors:
```json
{
  "success": false,
  "errors": [
    "email is required and must be a valid email address.",
    "age must be a positive integer between 0 and 150."
  ]
}
```
