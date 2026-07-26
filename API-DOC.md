# Haat-Bazar — Postman / API Test Guide

> Everything below is copy-pasteable into Postman. All examples assume services are up via the gateway at **`http://localhost:8080`** (or hit the service ports directly if you prefer).
> Make sure MySQL (`root`/`root`) is running, then start services in this order:
> `eureka-server (8761)` → `auth-service (8081)` → `product-service (8082)` → `order-service (8084)` → `payment-service (8083)` → `backup-service (8085)` → `api-gateway (8080)`.

---

## 0. Environment variables (Postman → "Variables")

| Variable | Value |
|---|---|
| `gw` | `http://localhost:8080` |
| `auth` | `http://localhost:8081` |
| `product` | `http://localhost:8082` |
| `order` | `http://localhost:8084` |
| `payment` | `http://localhost:8083` |
| `token` | *(empty — filled by login response)* |
| `userId` | *(empty — filled by auth helper)* |
| `backup` | `http://localhost:8085` |

In every secured request, add a header:
```
Authorization: Bearer {{token}}
```

---

## 1. auth-service  (port 8081, gateway `/api/auth/**`)

### 1.1 Register — Seller
**`POST`** `{{gw}}/api/auth/register`
```json
{
  "name": "Rahim Seller",
  "email": "rahim@hb.com",
  "password": "secret123",
  "role": "SELLER"
}
```
`role` accepts `CUSTOMER`, `SELLER`, `ADMIN` (enum `Role`).
**Expected 200:**
```json
{ "token": "eyJhbGciOi..." }
```
> Tests folder will use this token as `{{token}}` for protected calls.

### 1.2 Register — Customer
**`POST`** `{{gw}}/api/auth/register`
```json
{
  "name": "Karim Buyer",
  "email": "karim@hb.com",
  "password": "secret123",
  "role": "CUSTOMER"
}
```

### 1.3 Register — Admin (optional)
**`POST`** `{{gw}}/api/auth/register`
```json
{
  "name": "Admin User",
  "email": "admin@hb.com",
  "password": "secret123",
  "role": "ADMIN"
}
```

### 1.4 Login — returns JWT
**`POST`** `{{gw}}/api/auth/login`
```json
{
  "email": "rahim@hb.com",
  "password": "secret123"
}
```
**Expected 200:**
```json
{ "token": "eyJhbGciOi..." }
```
> Set Postman **Tests** tab: `pm.collectionVariables.set("token", pm.response.json().token);`

### 1.5 Validate token
**`GET`** `{{gw}}/api/auth/validate?token={{token}}`
**Expected 200:**
```json
{ "email": "rahim@hb.com", "role": "SELLER", "valid": "true" }
```

### 1.6 Negative — duplicate email
**`POST`** `{{gw}}/api/auth/register` (same email as 1.1)
**Expected:** 4xx with a validation error.

### 1.7 Negative — bad password
**`POST`** `{{gw}}/api/auth/login`
```json
{ "email": "rahim@hb.com", "password": "wrong" }
```
**Expected:** 401 / error.

---

## 2. product-service  (port 8082, gateway `/api/products/**`, `/api/inventory/**`, `/api/categories/**`)

> All endpoints need `Authorization: Bearer {{token}}`.
> Reads need any logged-in user; writes need `SELLER` or `ADMIN`.

### 2.1 Create category (SELLER)
**`POST`** `{{gw}}/api/categories`
```json
{ "name": "Groceries" }
```
**Expected 200:**
```json
{ "id": 1, "name": "Groceries" }
```
Save the `id` as Postman variable `categoryId`.

### 2.2 Get category by id
**`GET`** `{{gw}}/api/categories/{{categoryId}}`

### 2.3 List categories
**`GET`** `{{gw}}/api/categories`

### 2.4 Update category
**`PUT`** `{{gw}}/api/categories/{{categoryId}}`
```json
{ "name": "Grocery & Staples" }
```

### 2.5 Create product (SELLER)
**`POST`** `{{gw}}/api/products`
```json
{
  "name": "Basmati Rice 5kg",
  "description": "Premium long-grain rice",
  "price": 850.0,
  "stock": 100,
  "categoryId": 1
}
```
**Expected 200:**
```json
{
  "id": 1,
  "name": "Basmati Rice 5kg",
  "description": "Premium long-grain rice",
  "price": 850.0,
  "stock": 100,
  "category": "Grocery & Staples"
}
```
Save as `productId`.

### 2.6 Create a second product (for cart/order variety)
**`POST`** `{{gw}}/api/products`
```json
{
  "name": "Olive Oil 1L",
  "description": "Extra virgin",
  "price": 1200.0,
  "stock": 50,
  "categoryId": 1
}
```
Save as `productId2`.

### 2.7 Get product by id
**`GET`** `{{gw}}/api/products/{{productId}}`

### 2.8 List products
**`GET`** `{{gw}}/api/products`

### 2.9 Update product
**`PUT`** `{{gw}}/api/products/{{productId}}`
```json
{
  "name": "Basmati Rice 5kg",
  "description": "Premium long-grain rice (sale)",
  "price": 799.0,
  "stock": 100,
  "categoryId": 1
}
```

### 2.10 Set inventory explicitly (SELLER)
**`PUT`** `{{gw}}/api/inventory/{{productId}}`
```json
{ "quantity": 100 }
```
**Expected 200:**
```json
{ "productId": 1, "productName": "Basmati Rice 5kg", "quantity": 100, "available": true }
```

### 2.11 Check inventory
**`GET`** `{{gw}}/api/inventory/{{productId}}`

### 2.12 Reduce inventory by N (used internally by order-service)
**`PUT`** `{{gw}}/api/inventory/{{productId}}/reduce?quantity=2`
**Expected 200:** `"Stock reduced successfully"`

### 2.13 Batch check stock (used by order-service checkout)
**`POST`** `{{gw}}/api/inventory/check-stock`
```json
[
  { "product_id": 1, "quantity": 2 },
  { "product_id": 2, "quantity": 1 }
]
```
**Expected 200:**
```json
{ "available": true, "unavailable_product_ids": [] }
```

### 2.14 Batch reduce stock
**`POST`** `{{gw}}/api/inventory/reduce`
```json
[
  { "product_id": 1, "quantity": 1 },
  { "product_id": 2, "quantity": 1 }
]
```
**Expected 200:** empty body.

### 2.15 Negative — CUSTOMER trying to create a product
Login as the customer from 1.2, then call **2.5**.
**Expected:** 403 Forbidden.

---

## 3. order-service  (port 8084, gateway `/api/cart/**`, `/api/orders/**`)

> The `userId` here is any numeric id you choose (cart/order are keyed by user id, not by auth subject).

### 3.1 Get / create cart
**`GET`** `{{gw}}/api/cart/42`
**Expected 200:** cart JSON with empty `items: []` if new.

### 3.2 Add item to cart
**`POST`** `{{gw}}/api/cart/42/items`
```json
{ "productId": 1, "quantity": 2, "price": 850.0 }
```

### 3.3 Add another item
**`POST`** `{{gw}}/api/cart/42/items`
```json
{ "productId": 2, "quantity": 1, "price": 1200.0 }
```

### 3.4 Update cart item quantity
**`PUT`** `{{gw}}/api/cart/42/items/{{productId}}?quantity=3`

### 3.5 Get cart
**`GET`** `{{gw}}/api/cart/42`

### 3.6 Remove one item
**`DELETE`** `{{gw}}/api/cart/42/items/{{productId2}}`

### 3.7 Clear cart
**`DELETE`** `{{gw}}/api/cart/42`

### 3.8 Re-populate cart for checkout
**`POST`** `{{gw}}/api/cart/42/items`
```json
{ "productId": 1, "quantity": 2, "price": 799.0 }
```

### 3.9 Checkout
**`POST`** `{{gw}}/api/orders/checkout/42`
```json
{ "paymentMethod": "CARD" }
```
> `paymentMethod` is one of `CARD`, `BKASH`, `NAGAD` (case-sensitive).
**Expected 201:**
```json
{
  "id": 1,
  "userId": 42,
  "totalAmount": 1598.0,
  "status": "PENDING",
  "createdAt": "2026-06-28T...",
  "items": [
    { "id": 1, "productId": 1, "quantity": 2, "price": 799.0 }
  ]
}
```
Save `id` as `orderId`. After checkout, inventory for product 1 drops by 2.

### 3.10 Get order by id
**`GET`** `{{gw}}/api/orders/{{orderId}}`

### 3.11 List user's orders
**`GET`** `{{gw}}/api/orders/user/42`

### 3.12 Update order status
**`PATCH`** `{{gw}}/api/orders/{{orderId}}?status=CONFIRMED`
> Status enum: `PENDING`, `CONFIRMED`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `PAID`.

### 3.13 Mark-paid (called by payment-service via Feign)
**`PUT`** `{{gw}}/api/orders/{{orderId}}/mark-paid`
**Expected 200:** empty body. Used internally — only useful if you want to test order-service alone.

### 3.14 Negative — checkout with empty cart
After calling 3.7, **3.9** should fail.

---

## 4. payment-service  (port 8083, gateway `/api/payments/**`)

> Needs `Authorization: Bearer {{token}}`. `method` enum: `CARD`, `BKASH`, `NAGAD`.

### 4.1 Process payment for the order from 3.9
**`POST`** `{{gw}}/api/payments`
```json
{
  "orderId": 1,
  "userId": 42,
  "amount": 1598.0,
  "method": "CARD"
}
```
**Expected 200:**
```json
{
  "id": 1,
  "orderId": 1,
  "userId": 42,
  "amount": 1598.0,
  "method": "CARD",
  "status": "SUCCESS",
  "createdAt": "2026-06-28T...",
  "message": "Payment processed via CardPaymentStrategy"
}
```
> After this call, payment-service uses Feign to `PUT /api/orders/1/mark-paid` on order-service, so the order status becomes `PAID`.

### 4.2 Process bkash payment
**`POST`** `{{gw}}/api/payments`
```json
{ "orderId": 1, "userId": 42, "amount": 1598.0, "method": "BKASH" }
```

### 4.3 Process nagad payment
**`POST`** `{{gw}}/api/payments`
```json
{ "orderId": 1, "userId": 42, "amount": 1598.0, "method": "NAGAD" }
```

### 4.4 Look up payment by order id
**`GET`** `{{gw}}/api/payments/order/{{orderId}}`

### 4.5 Verify order is now PAID
**`GET`** `{{gw}}/api/orders/{{orderId}}` → `"status": "PAID"`

---

## 5. backup-service  (port 8085, gateway `/api/backup/**`)

> All endpoints require `Authorization: Bearer {{token}}` with role `ADMIN`.
> Listing backups also accepts `SELLER`.
> `mysqldump` must be installed on the server (`sudo apt install mysql-client`).
> Files are saved to `/tmp/haat-bazar-backups/` as `backup_yyyyMMdd_HHmmss.sql.gz`.
> Auto-schedule runs every day at **2:00 AM** (configurable via `backup.schedule` property).

### 5.1 Trigger a manual backup (ADMIN)
**`POST`** `{{gw}}/api/backup/trigger`

No request body needed.

**Expected 201** (SUCCESS):
```json
{
  "id": 1,
  "filename": "backup_20260727_020000.sql.gz",
  "databases": "auth_db,product_db,order_db,payment_db",
  "fileSizeBytes": 14823,
  "status": "SUCCESS",
  "errorMessage": null,
  "createdAt": "2026-07-27T02:00:00"
}
```
**Expected 500** (if mysqldump is missing or DB unreachable):
```json
{ "status": "FAILED", "errorMessage": "mysqldump exited with code 1: ..." }
```
Save `id` as `backupId`.

### 5.2 List all backups (ADMIN / SELLER)
**`GET`** `{{gw}}/api/backup`

Returns array of `BackupRecord`, newest first.

### 5.3 Download a backup file (ADMIN)
**`GET`** `{{gw}}/api/backup/{{backupId}}/download`

Response is a binary `.sql.gz` file (`Content-Type: application/octet-stream`).
In Postman → click **Send and Download** to save the file.

### 5.4 Delete a backup (ADMIN)
**`DELETE`** `{{gw}}/api/backup/{{backupId}}`

**Expected 204 No Content.**
Deletes both the DB record and the `.sql.gz` file from disk.

### 5.5 Negative — trigger as SELLER
Login as SELLER, call **5.1**.
**Expected:** 403 Forbidden.

### 5.6 Negative — download a FAILED backup
Call **5.3** with the id of a FAILED record.
**Expected:** 400 Bad Request.

---

## 6. Cleanup (optional)

### 6.1 Delete category
**`DELETE`** `{{gw}}/api/categories/{{categoryId}}`

### 6.2 Delete product
**`DELETE`** `{{gw}}/api/products/{{productId}}`

---

## 7. Quick "happy path" run-through

1. Register SELLER (1.1) → set `{{token}}`.
2. Create category (2.1) → set `{{categoryId}}`.
3. Create product (2.5) → set `{{productId}}`.
4. Set inventory (2.10) to 100.
5. Add to cart 42 (3.2).
6. Checkout (3.9) → `orderId`.
7. Pay (4.1) with method `CARD`.
8. Get order (3.10) → status now `PAID`.
9. Check inventory again (2.11) → quantity reduced by 2.

---

## 8. Status codes cheat-sheet

| Service | Success | Common errors |
|---|---|---|
| auth | 200 | 400 invalid payload, 401 bad creds, 409 duplicate email |
| product | 200/201 | 403 wrong role, 404 unknown id, 400 validation |
| order | 200/201 | 404 unknown cart/order, 409 empty cart |
| payment | 200 | 400 unknown method, 404 unknown order |
| backup | 201 trigger / 200 list / 204 delete | 400 failed backup download, 403 wrong role, 404 unknown id, 500 mysqldump error |
