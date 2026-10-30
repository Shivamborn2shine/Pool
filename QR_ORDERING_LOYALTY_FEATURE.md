# Feature Specification: QR Ordering + Loyalty

## 1. Agent instruction

Read this document before implementing anything.

Add a **QR-based ordering system with integrated loyalty rewards** to the existing LoyaltyCard product.

The customer scans one generic QR code for a store, registers using their phone number, browses the store menu, places an order, receives an order number and display name, shows the order to staff, and staff confirms it. After payment is marked received, loyalty points are automatically credited. Staff then prepares and serves the order.

Do not treat this as a prototype. Implement it as a production-ready feature with secure authentication, authorization, validation, audit logs, order-state management, concurrency safety, mobile-first UI, and complete admin/staff/customer workflows.

Also follow:

- `PROJECT_STANDARDS.md`
- `NON_AI_WEBSITE_GUIDE.md`
- `LOYALTYCARD_PRD.md`

If any conflict exists, this document takes priority for the QR ordering feature.

## 2. Feature summary

### Customer flow

1. Customer scans the store’s generic QR code.
2. Customer lands on a mobile-first store page.
3. Customer registers using phone number; name and email are optional.
4. If the phone number already exists, the system opens the existing customer account.
5. Customer browses the digital menu.
6. Customer adds items to cart.
7. Customer places the order.
8. System creates an order with:
   - Unique order number
   - Customer display name
   - Ordered items
   - Total amount
   - Order status
9. Customer sees: “Show this screen at the counter.”
10. Staff sees the new order in the staff order queue.
11. Staff confirms the order after verifying the customer.
12. Customer pays by cash or online.
13. Staff marks payment as received, or the payment gateway confirms online payment.
14. System credits loyalty points automatically.
15. Staff marks the order as preparing, ready, and served.
16. Customer sees order status and earned points.

### Staff flow

1. Staff logs in to the staff/admin dashboard.
2. Staff sees live incoming orders.
3. Staff verifies the customer and confirms the order.
4. Staff marks payment as cash or online.
5. Staff updates order status: preparing, ready, served.
6. Staff can reject or cancel an order before fulfilment with a reason.
7. Staff can view customer loyalty balance and order history.
8. Staff can see points credited for each completed order.

### Business owner flow

1. Owner creates/configures the store menu.
2. Owner adds menu categories and items.
3. Owner sets item prices, availability, images, and descriptions.
4. Owner configures loyalty rules.
5. Owner downloads the generic store QR code.
6. Owner prints/displays the QR at counter, table, receipt, or packaging.
7. Owner views orders, revenue, customers, points issued, and order reports.

## 3. Core rules

### Registration

- Phone number is the only required field.
- Name is optional but recommended.
- Email is optional.
- Phone number must be unique per business.
- If an existing customer scans again, open their existing loyalty account.
- Do not create duplicate customers for the same phone number.
- Capture explicit consent for loyalty tracking.
- Marketing consent must be separate and optional.
- Do not require app installation.
- Do not require email verification for ordering.
- OTP verification is optional and may be enabled per business.

### Generic store QR

- Each business/location gets one generic QR code by default.
- The QR links to a dynamic store URL, for example:

```text
https://app.example.com/s/{store_slug}
```

- The QR must not contain customer data, balances, internal IDs, or secrets.
- The QR destination must be controlled by the backend so it can be changed without reprinting.
- The system must support future QR types:
  - Store QR
  - Branch QR
  - Table QR
  - Campaign QR
  - Receipt QR

### Ordering

- Customer must be registered or identifiable before placing an order.
- Customer can browse menu without registration, but must register before placing an order.
- Customer can add items to a cart.
- Customer can review cart, edit quantity, remove items, and add notes.
- Customer can place a dine-in, takeaway, or pickup order.
- System must prevent duplicate order submission.
- Order creation must be atomic.
- Order number must be unique per business.
- Order display name should default to the customer’s first name or a safe generated name.
- Customer can cancel only while the order is not confirmed.
- After staff confirmation, cancellation requires staff approval.

### Staff confirmation

- A newly placed order must not be considered valid until staff confirms it.
- Customer must show the order screen or order number to staff.
- Staff must be able to see:
  - Order number
  - Customer name
  - Items
  - Quantity
  - Total
  - Notes
  - Time placed
  - Customer phone number, if permission allows
- Staff can confirm or reject the order.
- Rejection requires a reason.
- Rejection must notify the customer in the order view.
- Staff confirmation must be logged with staff ID and timestamp.

### Payment

- Payment can be cash or online.
- For cash, staff manually marks payment received.
- For online payment, integrate a payment gateway or generate a UPI/payment link.
- If online payment is not yet available, support manual online-payment confirmation with payment reference.
- Points must never be credited for unpaid orders.
- If an order is refunded or cancelled after points were credited, points must be reversed automatically or through an audited reversal transaction.

### Loyalty points

- Points are credited only after:
  - Order is confirmed by staff.
  - Payment is marked received.
  - Order is not cancelled or refunded.
- Points are calculated from the final paid amount.
- Default rule: 1 point per ₹10 spent.
- Business can configure:
  - Points per currency unit
  - Minimum order amount to earn points
  - Maximum points per order
  - Points-to-redeemable-value conversion
  - Minimum redemption points
- Points must be calculated server-side.
- Never trust points, totals, discounts, or balances submitted from the client.
- Every points change must create an immutable transaction record.
- Balance updates and transaction creation must occur in the same database transaction.

### Order fulfilment

After payment, staff can move the order through:

```text
paid → preparing → ready → served
```

- Customer must see live status.
- Staff actions must be timestamped and logged.
- Customer must be able to see when the order is ready.
- Staff should be able to print or view a kitchen ticket if printing is available.

## 4. Order lifecycle

Implement the following order states:

| Status | Triggered by | Meaning |
|---|---|---|
| `created` | Customer | Order placed |
| `awaiting_confirmation` | System | Customer must show order to staff |
| `confirmed` | Staff | Staff verified the customer and order |
| `awaiting_payment` | Staff/System | Order accepted, payment pending |
| `paid` | Staff or payment gateway | Payment received |
| `points_credited` | System | Loyalty points added |
| `preparing` | Staff | Store is preparing the order |
| `ready` | Staff | Order is ready for customer |
| `served` | Staff | Order handed to customer |
| `cancelled` | Customer or staff | Order cancelled |
| `rejected` | Staff | Staff rejected the order |
| `expired` | System | Customer did not confirm/pay in time |
| `refunded` | Staff | Payment refunded; points reversed |

### Default state flow

```text
created
  → awaiting_confirmation
  → confirmed
  → awaiting_payment
  → paid
  → points_credited
  → preparing
  → ready
  → served
```

### Allowed transitions

| From | Allowed to |
|---|---|
| `created` | `awaiting_confirmation`, `cancelled`, `expired` |
| `awaiting_confirmation` | `confirmed`, `rejected`, `cancelled`, `expired` |
| `confirmed` | `awaiting_payment`, `cancelled` |
| `awaiting_payment` | `paid`, `cancelled` |
| `paid` | `points_credited`, `refunded` |
| `points_credited` | `preparing`, `refunded` |
| `preparing` | `ready`, `cancelled` |
| `ready` | `served` |
| `served` | Terminal state |
| `cancelled` | Terminal state |
| `rejected` | Terminal state |
| `expired` | Terminal state |

Implement state transitions on the server. The client must never directly set an order status.

## 5. Functional requirements

### 5.1 Store QR and landing

| ID | Requirement | Priority |
|---|---|---|
| QR-01 | Business can generate one generic store QR code. | P0 |
| QR-02 | QR links to a dynamic store URL. | P0 |
| QR-03 | QR can be downloaded as PNG and SVG. | P0 |
| QR-04 | QR can be printed with business branding. | P0 |
| QR-05 | QR destination can be updated without changing the printed code. | P0 |
| QR-06 | QR page must be mobile-first and load quickly. | P0 |
| QR-07 | QR page shows business name, logo, loyalty offer, and menu entry point. | P0 |
| QR-08 | QR page must not expose customer data or balances. | P0 |

### 5.2 Customer registration

| ID | Requirement | Priority |
|---|---|---|
| REG-01 | Customer can register with phone number. | P0 |
| REG-02 | Name and email are optional. | P0 |
| REG-03 | Phone number must be unique per business. | P0 |
| REG-04 | Returning customers are recognized by phone number. | P0 |
| REG-05 | Customer must accept Terms and Privacy Policy. | P0 |
| REG-06 | Loyalty consent must be captured. | P0 |
| REG-07 | Marketing consent must be separate and optional. | P0 |
| REG-08 | Optional OTP verification can be enabled per business. | P1 |
| REG-09 | Customer can view and edit optional profile details. | P1 |

### 5.3 Menu management

| ID | Requirement | Priority |
|---|---|---|
| MENU-01 | Owner/admin can create menu categories. | P0 |
| MENU-02 | Owner/admin can create menu items. | P0 |
| MENU-03 | Menu item includes name, description, price, image, availability, and sort order. | P0 |
| MENU-04 | Owner can mark an item unavailable/sold out. | P0 |
| MENU-05 | Owner can hide/show menu items. | P0 |
| MENU-06 | Customer sees only available and visible items. | P0 |
| MENU-07 | Menu supports item variants/options: P1. | P1 |
| MENU-08 | Menu supports add-ons/modifiers: P1. | P1 |
| MENU-09 | Menu supports item-level loyalty multipliers: P2. | P2 |

### 5.4 Cart and checkout

| ID | Requirement | Priority |
|---|---|---|
| CART-01 | Customer can add items to cart. | P0 |
| CART-02 | Customer can change quantity. | P0 |
| CART-03 | Customer can remove items. | P0 |
| CART-04 | Customer can add order-level notes. | P0 |
| CART-05 | Customer can select order type: dine-in, takeaway, or pickup. | P0 |
| CART-06 | Customer can enter table number for dine-in. | P0 |
| CART-07 | System calculates subtotal, tax if configured, discount, and total. | P0 |
| CART-08 | Customer must register before placing an order. | P0 |
| CART-09 | System prevents duplicate order submission. | P0 |
| CART-10 | Customer can apply eligible reward points as discount: P1. | P1 |

### 5.5 Order creation

| ID | Requirement | Priority |
|---|---|---|
| ORD-01 | System creates a unique order number per business. | P0 |
| ORD-02 | Order number must be short and human-readable, e.g. `SC-1042`. | P0 |
| ORD-03 | Order includes customer display name. | P0 |
| ORD-04 | Order includes items, quantities, notes, subtotal, tax, discount, and total. | P0 |
| ORD-05 | Order includes order type and table number if applicable. | P0 |
| ORD-06 | Order starts in `created` or `awaiting_confirmation`. | P0 |
| ORD-07 | Customer sees order number, name, items, total, and status. | P0 |
| ORD-08 | Customer sees instruction: “Show this screen at the counter.” | P0 |
| ORD-09 | Customer can refresh and see live status. | P0 |
| ORD-10 | Customer can cancel only before staff confirmation. | P0 |
| ORD-11 | Unconfirmed orders expire after a configurable period, default 20 minutes. | P0 |

### 5.6 Staff order management

| ID | Requirement | Priority |
|---|---|---|
| STAFF-01 | Staff sees live queue of new orders. | P0 |
| STAFF-02 | Staff can confirm an order. | P0 |
| STAFF-03 | Staff can reject an order with a reason. | P0 |
| STAFF-04 | Staff can mark payment received as cash. | P0 |
| STAFF-05 | Staff can mark online payment received with reference. | P0 |
| STAFF-06 | Staff can mark order preparing, ready, and served. | P0 |
| STAFF-07 | Staff can view customer loyalty balance. | P0 |
| STAFF-08 | Staff can search orders by order number, customer name, or phone. | P0 |
| STAFF-09 | Staff can filter orders by status. | P0 |
| STAFF-10 | Staff actions are audit-logged. | P0 |
| STAFF-11 | Staff can print a kitchen ticket: P1. | P1 |
| STAFF-12 | Staff receives sound/browser notification for new orders: P1. | P1 |

### 5.7 Payment and points

| ID | Requirement | Priority |
|---|---|---|
| PAY-01 | Order supports cash payment. | P0 |
| PAY-02 | Order supports manual online-payment confirmation. | P0 |
| PAY-03 | Order supports payment-gateway/UPI integration: P1. | P1 |
| PAY-04 | Points are credited only after payment. | P0 |
| PAY-05 | Points calculation uses final paid amount. | P0 |
| PAY-06 | Points credit creates an immutable transaction. | P0 |
| PAY-07 | Points credit and balance update occur atomically. | P0 |
| PAY-08 | Refund/cancellation after points credit reverses points. | P0 |
| PAY-09 | Payment events are audit-logged. | P0 |
| PAY-10 | Payment gateway webhooks must be verified and idempotent. | P1 |

### 5.8 Loyalty integration

| ID | Requirement | Priority |
|---|---|---|
| LOY-01 | Customer earns points after completed paid order. | P0 |
| LOY-02 | Customer sees earned points on order completion screen. | P0 |
| LOY-03 | Customer sees updated points balance and history. | P0 |
| LOY-04 | Business can configure earn rules. | P0 |
| LOY-05 | Business can configure redemption rules. | P0 |
| LOY-06 | Customer can view rewards. | P0 |
| LOY-07 | Customer can request redemption. | P0 |
| LOY-08 | Staff can approve/process redemption. | P0 |
| LOY-09 | Points can be redeemed as discount during checkout: P1. | P1 |
| LOY-10 | Refunds reverse points and redemption effects. | P0 |

### 5.9 Reporting

| ID | Requirement | Priority |
|---|---|---|
| RPT-01 | Owner sees total orders, revenue, customers, and points issued. | P0 |
| RPT-02 | Owner sees orders by status. | P0 |
| RPT-03 | Owner sees top-selling menu items. | P1 |
| RPT-04 | Owner sees repeat-customer metrics. | P1 |
| RPT-05 | Owner sees points liability and redemption data. | P0 |
| RPT-06 | Owner can export orders and transactions to CSV. | P1 |

## 6. Database changes

Add or extend the following tables.

### store_qr_codes

```text
id
business_id
location_id -- nullable for future multi-location
type -- store, branch, table, campaign, receipt
slug
destination_url
status
label
created_at
updated_at
```

### menus

```text
id
business_id
name
description
status
created_at
updated_at
```

### menu_categories

```text
id
business_id
menu_id
name
description
sort_order
status
created_at
updated_at
```

### menu_items

```text
id
business_id
menu_id
category_id
name
description
price
currency
image_url
is_available
is_visible
sort_order
loyalty_multiplier
created_at
updated_at
```

### menu_item_variants

```text
id
menu_item_id
name
price_delta
is_available
sort_order
created_at
updated_at
```

### menu_item_addons

```text
id
menu_item_id
name
price
is_available
sort_order
created_at
updated_at
```

### orders

```text
id
business_id
customer_id
card_id
order_number
customer_display_name
order_type -- dine_in, takeaway, pickup
table_number
status
subtotal
tax_total
discount_total
reward_points_used
reward_value_used
total
currency
payment_method -- cash, online, pending
payment_status -- pending, paid, failed, refunded
payment_reference
notes
confirmed_by_user_id
confirmed_at
paid_at
points_credited_at
prepared_at
ready_at
served_at
cancelled_at
cancelled_by_user_id
cancellation_reason
expires_at
created_at
updated_at
```

### order_items

```text
id
order_id
menu_item_id
item_name
unit_price
quantity
total_price
variant_details
addon_details
notes
created_at
```

### order_events

```text
id
order_id
event -- created, confirmed, rejected, payment_pending, paid, points_credited, preparing, ready, served, cancelled, expired, refunded
actor_type -- customer, staff, system
actor_id
note
metadata
created_at
```

### transactions

Extend existing transactions with:

```text
order_id
type -- order_points_earned, order_points_reversed, reward_points_used, reward_points_restored
```

## 7. API specification

### Public customer APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/s/:storeSlug` | Get store landing/menu metadata |
| POST | `/api/s/:storeSlug/register` | Register/login customer by phone |
| GET | `/api/s/:storeSlug/menu` | Get public menu |
| POST | `/api/s/:storeSlug/orders` | Create order |
| GET | `/api/orders/:orderId/customer-view` | Customer order status |
| POST | `/api/orders/:orderId/cancel` | Customer cancels before confirmation |
| GET | `/api/card/:publicId` | Customer loyalty card |
| GET | `/api/card/:publicId/transactions` | Customer transaction history |
| GET | `/api/card/:publicId/rewards` | Available rewards |
| POST | `/api/card/:publicId/redemption-requests` | Request reward redemption |

### Staff/admin APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/staff/orders?status=new` | Get new orders |
| GET | `/api/staff/orders?status=active` | Get active orders |
| GET | `/api/staff/orders/:id` | Order details |
| PATCH | `/api/staff/orders/:id/confirm` | Confirm order |
| PATCH | `/api/staff/orders/:id/reject` | Reject order |
| PATCH | `/api/staff/orders/:id/mark-paid` | Mark cash/online payment |
| PATCH | `/api/staff/orders/:id/preparing` | Mark preparing |
| PATCH | `/api/staff/orders/:id/ready` | Mark ready |
| PATCH | `/api/staff/orders/:id/served` | Mark served |
| PATCH | `/api/staff/orders/:id/cancel` | Cancel order |
| POST | `/api/staff/menu/categories` | Create category |
| POST | `/api/staff/menu/items` | Create menu item |
| PATCH | `/api/staff/menu/items/:id` | Update menu item |
| GET | `/api/staff/reports/orders` | Order reports |
| GET | `/api/staff/qr` | Get/download store QR |

## 8. Business logic

### Order number generation

Generate a human-readable order number per business:

```text
{STORE_PREFIX}-{SEQUENTIAL_NUMBER}
```

Example:

```text
SC-1042
```

Rules:

- Prefix can be configured by business.
- Number must be unique per business.
- Use a database sequence or atomic counter.
- Do not expose internal database UUIDs as the customer-facing order number.
- Handle concurrent order creation safely.

### Customer display name

Use this priority:

1. Customer-entered name.
2. Existing customer profile name.
3. Safe generated name, such as “Guest-482”.

Do not display full phone number to other customers.

### Points calculation

```text
if order.total < minimum_order_amount:
    points = 0
else:
    base_points = floor(order.total / currency_unit) * points_per_currency_unit
    item_bonus = calculate_item_multipliers(order)
    points = floor(base_points + item_bonus)

if points > maximum_points_per_order:
    points = maximum_points_per_order
```

Default:

- 1 point per ₹10.
- Minimum order: ₹50.
- Maximum: 500 points per order.
- 100 points = ₹100 redeemable value.

### Points crediting

On payment confirmation:

1. Verify order is in `paid` or valid payment-completed state.
2. Verify points were not already credited.
3. Calculate points server-side.
4. Start database transaction.
5. Update loyalty card balance atomically.
6. Create `order_points_earned` transaction.
7. Update order status to `points_credited`.
8. Create order event.
9. Write audit log.
10. Commit transaction.

If any step fails, roll back the entire transaction.

### Refund reversal

If an order is refunded after points were credited:

1. Create `order_points_reversed` transaction.
2. Deduct the same number of points from the card.
3. Prevent balance from becoming negative unless business policy allows it.
4. Update order status to `refunded`.
5. Create order event and audit log.

## 9. UI requirements

### Customer mobile pages

#### Store landing / registration

- Business logo and name.
- Loyalty offer.
- Phone number field.
- Optional name/email.
- Consent text and links.
- Continue button.
- Loading, error, and success states.

#### Menu

- Business header.
- Points balance if logged in.
- Menu categories.
- Item cards with image, name, price, and add button.
- Sold-out state.
- Cart button with item count and total.
- Search/filter if menu is large.

#### Cart

- Item list.
- Quantity controls.
- Remove item.
- Order notes.
- Order type.
- Table number for dine-in.
- Total breakdown.
- Place order button.
- Loading and validation states.

#### Order confirmation

- Large order number.
- Customer display name.
- Items and total.
- Status timeline.
- “Show this screen at the counter.”
- Refresh/live status.
- Cancel button only when allowed.

#### Order status

- Confirmed.
- Awaiting payment.
- Paid.
- Earning points.
- Points earned.
- Preparing.
- Ready.
- Served.

#### Loyalty card

- Points balance.
- Redeemable value.
- Pending points.
- Rewards.
- Transaction history.
- Order history.
- Submit purchase claim, if enabled.
- Privacy Policy and Terms links.

### Staff dashboard

- Live order queues:
  - New
  - Awaiting payment
  - Preparing
  - Ready
  - Completed
  - Cancelled/Rejected
- Order cards with order number, name, items, total, and timer.
- Confirm/reject actions.
- Payment actions.
- Status update actions.
- Customer search.
- Menu management.
- QR download.
- Reports.

### Admin dashboard

- Menu management.
- QR management.
- Loyalty rules.
- Customers.
- Orders.
- Claims.
- Rewards.
- Reports.
- Staff management.
- Business settings.

## 10. Security requirements

- Authenticate all staff/admin APIs.
- Authorize every request against business membership and role.
- Customers may access only their own orders and card.
- Use signed, expiring URLs for receipt/payment proofs if stored.
- Validate all menu, cart, and order data server-side.
- Recalculate all prices, taxes, discounts, and totals server-side.
- Use idempotency keys for order creation and payment webhooks.
- Rate-limit order creation, registration, and payment endpoints.
- Prevent order-number enumeration.
- Do not expose internal customer IDs, phone numbers, or balances in public URLs.
- Log every staff confirmation, payment marking, cancellation, and points adjustment.
- Use database transactions and row-level locking for balance updates.
- Protect against duplicate webhook processing.

## 11. UX and design rules

- Mobile-first customer experience.
- Fast loading menu and cart.
- Minimal signup: phone number required; other fields optional.
- Large, readable order number.
- Clear status timeline.
- No generic blue-purple gradients.
- Restrained border radius.
- Consistent typography and spacing.
- Visible hover and focus states.
- Accessible buttons, forms, and modals.
- Loading skeletons for menu and orders.
- Empty states for no orders, no menu items, and no rewards.
- Error states with retry options.
- Confirmation modal before staff rejects or cancels an order.
- Print-friendly kitchen ticket/order view.

## 12. Testing requirements

### Customer flow tests

- [ ] New customer can register with phone number.
- [ ] Returning customer is recognized by phone number.
- [ ] Customer can browse menu.
- [ ] Customer can add/remove items.
- [ ] Customer can place order.
- [ ] Order number and display name are generated.
- [ ] Customer sees “show at counter” screen.
- [ ] Customer can cancel before confirmation.
- [ ] Customer cannot cancel after confirmation without staff approval.
- [ ] Customer sees live order status.
- [ ] Customer sees earned points after payment.

### Staff flow tests

- [ ] Staff sees new orders.
- [ ] Staff can confirm order.
- [ ] Staff can reject order with reason.
- [ ] Staff can mark cash payment.
- [ ] Staff can mark online payment with reference.
- [ ] Staff can mark preparing, ready, and served.
- [ ] Staff cannot access another business’s orders.
- [ ] Staff actions are audit-logged.

### Loyalty tests

- [ ] Points are not credited before payment.
- [ ] Points are credited after payment.
- [ ] Points calculation matches configured rules.
- [ ] Maximum points rule works.
- [ ] Minimum order rule works.
- [ ] Points transaction is created.
- [ ] Balance update is atomic.
- [ ] Refund reverses points.
- [ ] Duplicate points credit is prevented.

### Security tests

- [ ] Customer cannot access another customer’s order.
- [ ] Staff cannot access another business’s orders.
- [ ] Unauthenticated users cannot access staff APIs.
- [ ] Client cannot override price, total, discount, or points.
- [ ] Order creation is idempotent.
- [ ] QR does not expose sensitive data.
- [ ] Rate limiting works.

### UX tests

- [ ] Works on small mobile screens.
- [ ] Works on desktop staff dashboard.
- [ ] Menu loads quickly.
- [ ] Cart works correctly.
- [ ] Order status updates properly.
- [ ] Empty states work.
- [ ] Error states work.
- [ ] Loading states work.
- [ ] Keyboard navigation works.
- [ ] QR scans correctly on iOS and Android.

## 13. Implementation order

Implement in this sequence:

1. Add store QR entity and dynamic QR destination.
2. Build customer registration/login-by-phone flow.
3. Build menu, categories, and menu-item management.
4. Build public customer menu and cart.
5. Build order creation, order number, and customer order page.
6. Build staff order queue and confirmation flow.
7. Build payment marking and payment-status flow.
8. Integrate loyalty points crediting after payment.
9. Build order fulfilment states: preparing, ready, served.
10. Build customer order history and loyalty history.
11. Build reports and QR download/printing.
12. Add notifications, rate limits, audit logs, and security hardening.
13. Add tests, accessibility, performance optimization, and deployment.

## 14. Definition of done

The feature is complete only when:

- [ ] Business can generate and download a generic store QR.
- [ ] Customer can scan QR and register with phone number.
- [ ] Returning customer is recognized.
- [ ] Customer can browse menu and add items to cart.
- [ ] Customer can place an order.
- [ ] System creates a unique order number and customer display name.
- [ ] Customer sees order screen to show staff.
- [ ] Staff sees the order in a live queue.
- [ ] Staff can confirm or reject the order.
- [ ] Customer sees confirmation or rejection.
- [ ] Staff can mark cash or online payment.
- [ ] Points are credited only after payment.
- [ ] Points calculation is server-side and rule-based.
- [ ] Customer sees earned points and updated balance.
- [ ] Staff can move order through preparing, ready, and served.
- [ ] Customer sees live fulfilment status.
- [ ] Every order event is logged.
- [ ] Every balance change has an immutable transaction.
- [ ] Refunds reverse points.
- [ ] Role-based access control works.
- [ ] Customer cannot access another customer’s order.
- [ ] Staff cannot access another business’s orders.
- [ ] Mobile UI is polished and accessible.
- [ ] QR works reliably on iOS and Android.
- [ ] Tests pass.
- [ ] Monitoring, error tracking, and backups are configured.

## 15. Agent prompt

```text
Implement the QR Ordering + Loyalty feature defined in
QR_ORDERING_LOYALTY_FEATURE.md.

Build it as a production-ready feature, not a demo.

Core flow:
1. Customer scans one generic store QR.
2. Customer registers with phone number; name/email optional.
3. Customer browses the store menu and adds items to cart.
4. Customer places an order.
5. System creates a unique order number and customer display name.
6. Customer shows the order screen to staff.
7. Staff confirms the order.
8. Customer pays by cash or online.
9. Staff marks payment received, or payment gateway confirms it.
10. System credits loyalty points automatically.
11. Staff moves the order through preparing, ready, and served.
12. Customer sees live status and earned points.

Requirements:
- One generic dynamic QR per store.
- Phone number is the only required signup field.
- Prevent duplicate customer accounts by phone number.
- Server-side price, tax, discount, total, and points calculation.
- Immutable transaction ledger for every points change.
- Atomic balance updates.
- Staff order confirmation before points crediting.
- Role-based access control.
- Audit logs for all staff actions.
- Rate limiting and idempotent order creation.
- Mobile-first customer UI and efficient staff dashboard.
- Complete loading, empty, error, and success states.
- Accessible, fast, secure, production-ready implementation.

Do not credit points before payment.
Do not trust client-submitted totals, discounts, or points.
Do not expose customer phone numbers, balances, or internal IDs in public QR URLs.
```
