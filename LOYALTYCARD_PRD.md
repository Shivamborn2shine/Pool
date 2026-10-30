# LoyaltyCard — Full Product Requirements Document

## 1. Document control

| Field | Value |
|---|---|
| Product name | LoyaltyCard |
| Product type | Multi-tenant B2B SaaS |
| Version | 1.0 — Production-ready |
| Audience | Founders, designers, engineers, QA, support, AI build agents |
| Status | Ready for implementation |
| Last updated | October 30, 2026 |

## 2. Product overview

LoyaltyCard is a web-based digital loyalty platform for local businesses such as cafés, restaurants, salons, gyms, retail stores, and service providers.

Businesses create digital loyalty cards for customers. Customers access their card by scanning a QR code or opening a secure link. Businesses record purchases, grant points, approve customer-submitted purchase claims, and redeem rewards. Customers can view their points, redeemable balance, rewards, and transaction history at any time.

The product replaces paper stamp cards, spreadsheets, and manual loyalty tracking with a reliable, auditable, mobile-first system.

### 2.1 Product vision

Help every local business retain customers through a simple, trustworthy digital loyalty program that works without a mobile app.

### 2.2 Product promise

- Businesses can launch a loyalty program in minutes.
- Customers can check rewards instantly by scanning a QR code.
- Every point, purchase, redemption, and adjustment is tracked.
- Business owners can understand repeat customers and program performance.
- The system is secure, auditable, and production-ready.

## 3. Target users

| User | Description | Primary needs |
|---|---|---|
| Business owner | Owns one or more locations | Launch program, control rules, view performance, protect margins |
| Manager | Manages staff and daily operations | Approve claims, manage customers, monitor activity |
| Cashier/staff | Serves customers at counter | Quickly find customer, record purchase, redeem reward |
| Customer | Visits business repeatedly | View points, redeemable balance, rewards, and history |
| Platform owner | Operates LoyaltyCard SaaS | Manage businesses, subscriptions, usage, support, and abuse |

## 4. Core user journeys

### 4.1 Business onboarding

1. Business owner signs up.
2. Owner creates a business profile.
3. Owner configures branding, currency, timezone, loyalty rules, and rewards.
4. Owner invites staff and assigns roles.
5. Owner creates the first customer.
6. System generates a loyalty card and QR code.
7. Owner prints or shares the customer card.
8. Business begins recording purchases and granting points.

### 4.2 Customer card creation

1. Staff opens **Customers**.
2. Staff clicks **Add customer**.
3. Staff enters name, phone, email, and optional details.
4. System checks for duplicate phone/email.
5. Customer accepts loyalty and marketing consent.
6. System creates:
   - Customer profile
   - Loyalty card
   - Card number
   - Public card URL
   - QR code
7. Staff can print, download, copy link, or show QR for scanning.

### 4.3 Purchase and points earning

#### Admin-entered purchase

1. Customer makes a purchase.
2. Staff searches customer by phone, name, card number, or QR scan.
3. Staff opens **Record purchase**.
4. Staff enters purchase amount, date, receipt number, and optional notes.
5. System calculates points using configured rules.
6. Staff reviews points and confirms.
7. System creates purchase and points transactions.
8. Customer balance updates immediately.

#### Customer-submitted purchase claim

1. Customer opens their card.
2. Customer selects **Submit purchase**.
3. Customer enters amount, date, receipt number, and optional receipt photo.
4. System creates a pending claim.
5. Admin reviews claim, checks duplicates, and approves, edits, or rejects it.
6. Approved claims create purchase and points transactions.
7. Customer sees claim status and updated balance.

### 4.4 Redemption

1. Customer requests redemption in person or through the card page.
2. Staff opens customer card.
3. Staff selects reward or custom redemption amount.
4. System validates balance, reward status, and redemption rules.
5. Staff confirms redemption.
6. System deducts points/credit and creates an immutable transaction.
7. Customer sees updated balance and redemption record.

## 5. Functional requirements

### 5.1 Authentication and account management

| ID | Requirement | Priority |
|---|---|---|
| AUTH-01 | Business owners can sign up with email and password. | P0 |
| AUTH-02 | Users can log in and log out securely. | P0 |
| AUTH-03 | Password reset uses expiring secure links. | P0 |
| AUTH-04 | Users can change password. | P0 |
| AUTH-05 | System supports roles: owner, manager, cashier. | P0 |
| AUTH-06 | Owner can invite staff by email. | P0 |
| AUTH-07 | Invitations expire and can be revoked. | P0 |
| AUTH-08 | Sessions use secure HTTP-only cookies. | P0 |
| AUTH-09 | Login and sensitive actions are rate-limited. | P0 |
| AUTH-10 | Customers access cards through signed/public card URLs; customer OTP login is P1. | P0/P1 |

### 5.2 Business management

| ID | Requirement | Priority |
|---|---|---|
| BIZ-01 | Owner can create one business profile. | P0 |
| BIZ-02 | Business profile includes name, logo, address, phone, email, currency, and timezone. | P0 |
| BIZ-03 | Owner can upload logo and set primary brand color. | P0 |
| BIZ-04 | Owner can configure loyalty rules. | P0 |
| BIZ-05 | Owner can activate/deactivate the loyalty program. | P0 |
| BIZ-06 | Platform owner can manage multiple businesses. | P0 |
| BIZ-07 | Multi-location support is P1. | P1 |

### 5.3 Loyalty rules

| ID | Requirement | Priority |
|---|---|---|
| RULE-01 | Admin can set points earned per currency unit. | P0 |
| RULE-02 | Admin can set minimum purchase amount to earn points. | P0 |
| RULE-03 | Admin can set maximum points per transaction. | P0 |
| RULE-04 | Admin can set points-to-redeemable-value conversion. | P0 |
| RULE-05 | Admin can set minimum redemption points. | P0 |
| RULE-06 | Admin can enable/disable customer purchase claims. | P0 |
| RULE-07 | Admin can set claim submission limits and claim window. | P0 |
| RULE-08 | Admin can require receipt photo above a configured amount. | P0 |
| RULE-09 | Admin can configure signup bonus points. | P1 |
| RULE-10 | Admin can configure points expiry. | P1 |
| RULE-11 | Admin can configure campaign multipliers. | P1 |
| RULE-12 | Admin can configure referral rewards. | P2 |

### 5.4 Customer management

| ID | Requirement | Priority |
|---|---|---|
| CUST-01 | Staff can create customers with name and phone. | P0 |
| CUST-02 | Email, birthday, notes, and tags are optional. | P0 |
| CUST-03 | Phone must be unique per business. | P0 |
| CUST-04 | Email must be unique per business if provided. | P0 |
| CUST-05 | Staff can search by name, phone, email, or card number. | P0 |
| CUST-06 | Staff can view customer profile, card, balance, and history. | P0 |
| CUST-07 | Staff can edit customer details with audit logging. | P0 |
| CUST-08 | Staff can freeze or close a card. | P0 |
| CUST-09 | Customer can access card via QR/public URL. | P0 |
| CUST-10 | Customer can update marketing preferences. | P1 |
| CUST-11 | Customer can request data deletion subject to legal/financial retention rules. | P1 |

### 5.5 Loyalty cards and QR

| ID | Requirement | Priority |
|---|---|---|
| CARD-01 | Every customer receives one active loyalty card by default. | P0 |
| CARD-02 | Card has unique internal ID, card number, and public ID. | P0 |
| CARD-03 | QR code links to customer card page. | P0 |
| CARD-04 | QR can be downloaded as PNG/SVG. | P0 |
| CARD-05 | Card can be printed with business branding. | P0 |
| CARD-06 | Printed card includes QR, customer name, card number, and instructions. | P0 |
| CARD-07 | Card link can be copied and shared. | P0 |
| CARD-08 | Card statuses: active, frozen, closed. | P0 |
| CARD-09 | QR does not contain balances, secrets, or internal database IDs. | P0 |
| CARD-10 | Apple Wallet/Google Wallet passes are P2. | P2 |

### 5.6 Purchases

| ID | Requirement | Priority |
|---|---|---|
| PUR-01 | Staff can record a purchase amount for a customer. | P0 |
| PUR-02 | Purchase requires amount and date/time. | P0 |
| PUR-03 | Receipt number, category, and notes are optional. | P0 |
| PUR-04 | System calculates points automatically. | P0 |
| PUR-05 | Staff with permission can adjust final granted points within limits. | P0 |
| PUR-06 | Every purchase creates an immutable transaction record. | P0 |
| PUR-07 | Purchase history is visible to admins and customer. | P0 |
| PUR-08 | Purchases can be searched and filtered. | P0 |
| PUR-09 | Purchases can be exported to CSV. | P1 |
| PUR-10 | POS integration is P2. | P2 |

### 5.7 Customer purchase claims

| ID | Requirement | Priority |
|---|---|---|
| CLAIM-01 | Customer can submit purchase claim from card page. | P0 |
| CLAIM-02 | Claim requires amount and purchase date. | P0 |
| CLAIM-03 | Receipt number and photo are recommended/conditionally required. | P0 |
| CLAIM-04 | Claims have status: pending, approved, rejected, duplicate, expired. | P0 |
| CLAIM-05 | Admin can view pending claims queue. | P0 |
| CLAIM-06 | Admin can approve, reject, or edit-and-approve claims. | P0 |
| CLAIM-07 | Rejection requires a reason. | P0 |
| CLAIM-08 | System detects duplicate amount/date/receipt submissions. | P0 |
| CLAIM-09 | Claims outside allowed window are rejected automatically. | P0 |
| CLAIM-10 | Claims above threshold require receipt photo. | P0 |
| CLAIM-11 | Customer sees claim status and admin note where appropriate. | P0 |
| CLAIM-12 | Claims create immutable transactions only after approval. | P0 |

### 5.8 Points and balances

| ID | Requirement | Priority |
|---|---|---|
| BAL-01 | Card tracks points balance. | P0 |
| BAL-02 | Card tracks redeemable amount. | P0 |
| BAL-03 | Card tracks pending points from unapproved claims. | P0 |
| BAL-04 | Card tracks lifetime points earned and redeemed. | P0 |
| BAL-05 | Card tracks lifetime purchase amount. | P0 |
| BAL-06 | Every balance change creates a transaction. | P0 |
| BAL-07 | Balance changes must be atomic and concurrency-safe. | P0 |
| BAL-08 | Admin can manually adjust points/credit with reason and permission. | P0 |
| BAL-09 | Manual adjustments require owner/manager approval based on threshold. | P0 |
| BAL-10 | Negative balances are not allowed unless explicitly configured. | P0 |

### 5.9 Rewards and redemption

| ID | Requirement | Priority |
|---|---|---|
| RWD-01 | Admin can create rewards with name, description, points cost, and value. | P0 |
| RWD-02 | Rewards can be activated/deactivated. | P0 |
| RWD-03 | Admin can set stock limits. | P1 |
| RWD-04 | Customer can view available rewards. | P0 |
| RWD-05 | Customer can request redemption. | P0 |
| RWD-06 | Staff can redeem points/credit directly with confirmation. | P0 |
| RWD-07 | System prevents redemption without sufficient balance. | P0 |
| RWD-08 | Redemptions create immutable transactions. | P0 |
| RWD-09 | Redemption history is visible to admin and customer. | P0 |
| RWD-10 | Reward fulfillment status: requested, approved, fulfilled, cancelled. | P0 |

### 5.10 Reporting and analytics

| ID | Requirement | Priority |
|---|---|---|
| RPT-01 | Dashboard shows total customers, active cards, purchases, points issued, points redeemed, and pending claims. | P0 |
| RPT-02 | Dashboard shows purchase value and outstanding points liability. | P0 |
| RPT-03 | Admin can view customer-level lifetime value and activity. | P0 |
| RPT-04 | Admin can filter reports by date range. | P0 |
| RPT-05 | Admin can export customers, transactions, purchases, and claims to CSV. | P1 |
| RPT-06 | Admin can view top customers by spend and visits. | P1 |
| RPT-07 | Admin can view repeat-visit and retention metrics. | P1 |
| RPT-08 | Admin can view staff activity report. | P1 |

### 5.11 Notifications

| ID | Requirement | Priority |
|---|---|---|
| NOTIF-01 | Customer card page shows claim status changes. | P0 |
| NOTIF-02 | Admin dashboard shows pending claims and approvals. | P0 |
| NOTIF-03 | Email notification for staff invitation. | P0 |
| NOTIF-04 | Email notification for password reset. | P0 |
| NOTIF-05 | Customer email/SMS/WhatsApp notifications are P1. | P1 |
| NOTIF-06 | Admin daily summary email is P1. | P1 |

### 5.12 Platform administration

| ID | Requirement | Priority |
|---|---|---|
| PLAT-01 | Platform owner can view businesses, users, cards, and usage. | P0 |
| PLAT-02 | Platform owner can suspend/restore a business. | P0 |
| PLAT-03 | Platform owner can impersonate a business only with audit logging and explicit reason. | P1 |
| PLAT-04 | Platform owner can view abuse/fraud alerts. | P1 |
| PLAT-05 | Platform owner can manage subscription plans. | P1 |

## 6. Non-functional requirements

| Area | Requirement |
|---|---|
| Performance | Customer card page should render within 2 seconds on 4G |
| Availability | Target 99.9% monthly uptime |
| Scalability | Support thousands of businesses and millions of transactions |
| Security | HTTPS, encrypted secrets, secure sessions, RBAC, rate limiting |
| Privacy | Consent capture, data minimization, retention policy, deletion workflow |
| Auditability | Immutable transaction ledger and admin action logs |
| Reliability | Daily automated backups and tested restore process |
| Accessibility | WCAG 2.2 AA-aligned experience |
| Mobile | Fully responsive, mobile-first customer experience |
| Internationalization | English first; architecture ready for Hindi and other locales |
| Currency | INR default; configurable currency |
| Timezone | Business-level timezone configuration |
| Observability | Error tracking, uptime monitoring, audit logs, usage metrics |

## 7. Data model

### businesses

```text
id
name
slug
logo_url
primary_color
currency
timezone
address
phone
email
status
subscription_plan
created_at
updated_at
```

### users

```text
id
email
password_hash
full_name
phone
status
email_verified_at
last_login_at
created_at
updated_at
```

### business_users

```text
id
business_id
user_id
role -- owner, manager, cashier
status
invited_by_user_id
joined_at
created_at
updated_at
```

### customers

```text
id
business_id
full_name
phone
email
date_of_birth
notes
tags
marketing_consent
loyalty_consent
status
created_by_user_id
created_at
updated_at
```

### loyalty_cards

```text
id
business_id
customer_id
card_number
public_id
status
points_balance
redeemable_amount
pending_points
lifetime_points_earned
lifetime_points_redeemed
lifetime_purchase_amount
created_at
updated_at
```

### purchases

```text
id
business_id
customer_id
card_id
amount
currency
purchase_date
receipt_number
receipt_file_url
category
notes
source -- admin_entered, customer_claim
status -- approved, pending, rejected, duplicate, expired
claimed_by_customer_id
reviewed_by_user_id
reviewed_at
review_note
created_by_user_id
created_at
updated_at
```

### transactions

```text
id
business_id
card_id
purchase_id
reward_redemption_id
type -- purchase, points_earned, points_redeemed, credit_earned, credit_redeemed, adjustment, expiry, reversal
points_change
amount_change
points_balance_after
redeemable_amount_after
description
metadata
created_by_user_id
created_at
```

### rewards

```text
id
business_id
name
description
image_url
points_required
monetary_value
stock_limit
status
created_at
updated_at
```

### reward_redemptions

```text
id
business_id
card_id
reward_id
points_used
monetary_value
status -- requested, approved, fulfilled, cancelled, rejected
requested_by_customer_id
processed_by_user_id
requested_at
processed_at
notes
created_at
updated_at
```

### loyalty_rules

```text
id
business_id
points_per_currency_unit
currency_unit
minimum_purchase_amount
maximum_points_per_transaction
points_value_per_100
minimum_redemption_points
claim_enabled
claim_window_days
daily_claim_limit
receipt_required_above_amount
signup_bonus_points
points_expiry_months
status
created_at
updated_at
```

### audit_logs

```text
id
business_id
actor_user_id
actor_role
action
entity_type
entity_id
before_state
after_state
ip_address
user_agent
created_at
```

## 8. Business logic

### 8.1 Points calculation

```text
eligible_amount = purchase_amount

if purchase_amount < minimum_purchase_amount:
    points = 0
else:
    base_points = floor(purchase_amount / currency_unit) * points_per_currency_unit
    campaign_points = base_points * campaign_multiplier - base_points
    points = floor(base_points + campaign_points)

if points > maximum_points_per_transaction:
    points = maximum_points_per_transaction
```

Default rule:

- 1 point per ₹10 spent.
- Minimum purchase: ₹50.
- Maximum: 500 points per transaction.
- 100 points = ₹100 redeemable credit.
- Minimum redemption: 100 points.

### 8.2 Claim approval

On approval:

1. Validate claim is still pending.
2. Recalculate points using current rules or claim-time rules, based on configuration.
3. Create approved purchase record.
4. Create `points_earned` transaction.
5. Update card balances atomically.
6. Update claim status.
7. Write audit log.

On rejection:

1. Require reason.
2. Update claim status.
3. Do not change balance.
4. Write audit log.

### 8.3 Redemption validation

Redemption is allowed only if:

- Card status is active.
- Business program is active.
- Points/redeemable balance is sufficient.
- Reward is active.
- Stock limit is available, if configured.
- Minimum redemption rule is met.
- User has permission.

### 8.4 Concurrency

All balance updates must use database transactions and row-level locking or atomic SQL updates.

Example:

```sql
UPDATE loyalty_cards
SET points_balance = points_balance + $points,
    lifetime_points_earned = lifetime_points_earned + $points
WHERE id = $card_id
  AND status = 'active';
```

The transaction record must be written in the same database transaction as the balance update.

## 9. Permissions matrix

| Action | Owner | Manager | Cashier | Customer |
|---|---:|---:|---:|---:|
| Manage business settings | Yes | No | No | No |
| Manage loyalty rules | Yes | Yes | No | No |
| Invite/manage staff | Yes | No | No | No |
| Create customer | Yes | Yes | Yes | No |
| Edit customer | Yes | Yes | Yes | No |
| Record purchase | Yes | Yes | Yes | No |
| Approve/reject claims | Yes | Yes | No | No |
| Manual point adjustment | Yes | Yes, within limit | No | No |
| Create/edit rewards | Yes | Yes | No | No |
| Redeem reward | Yes | Yes | Yes | Request only |
| View reports | Yes | Yes | Limited | Own data only |
| Export data | Yes | Yes | No | No |
| View own card | No | No | No | Yes |

## 10. UX requirements

### 10.1 Design principles

- Mobile-first.
- Clean, high-contrast, minimal interface.
- No generic blue-purple gradients.
- Restrained border radius.
- Clear hierarchy and generous whitespace.
- Fast, obvious actions.
- Accessible color contrast.
- Consistent components.

### 10.2 Admin dashboard

The dashboard must show:

- Total customers.
- Active cards.
- Purchases this month.
- Purchase value this month.
- Points issued.
- Points redeemed.
- Pending claims.
- Outstanding points liability.
- Recent activity.
- Quick actions: Add customer, Record purchase, Review claims, Create reward.

### 10.3 Customer card page

The customer card page must show:

- Business name and logo.
- Customer name.
- Card number.
- Points balance.
- Redeemable amount.
- Pending points.
- Available rewards.
- Recent transactions.
- Submit purchase button.
- Redemption request button.
- Help/contact link.
- Privacy Policy and Terms links.

### 10.4 Required states

Every major screen must support:

- Loading.
- Empty.
- Success.
- Error.
- Partial data.
- Permission denied.
- Offline/retry where relevant.

## 11. Security requirements

### Authentication

- Secure password hashing.
- Secure session cookies.
- CSRF protection.
- Rate limiting.
- Password reset token expiry.
- Role-based access control.
- Optional two-factor authentication for owners: P1.

### Authorization

- Every API request must verify business membership and role.
- Customers can access only their own card.
- Staff can access only their assigned business.
- Platform admins have separate, logged elevated access.

### Data protection

- Encrypt data in transit.
- Encrypt sensitive data at rest where supported.
- Store receipt files in access-controlled storage.
- Generate time-limited signed URLs for receipt files.
- Do not expose internal IDs or balances in QR codes.
- Sanitize all user inputs.
- Validate uploaded file type and size.
- Rate-limit claim submissions.

### Auditability

Log:

- Customer creation/editing.
- Card status changes.
- Purchase creation.
- Claim approval/rejection.
- Manual adjustments.
- Reward creation/editing.
- Redemption.
- Staff invitation/removal.
- Rule changes.
- Business setting changes.
- Platform admin actions.

## 12. Privacy and compliance

The product must support:

- Explicit loyalty consent.
- Separate marketing consent.
- Privacy Policy.
- Terms of Service.
- Cookie Policy where tracking is used.
- Cookie consent banner where non-essential cookies/tracking are used.
- Data export request workflow.
- Data correction workflow.
- Data deletion request workflow.
- Retention rules for receipts and inactive accounts.
- Audit trail for data access and changes.

For India-facing deployment, the product must be designed around consent-first collection and processing of personal data under the Digital Personal Data Protection Act, 2023.

## 13. API requirements

### Admin APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Business owner signup |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/password-reset` | Request reset |
| POST | `/api/business` | Create business |
| PATCH | `/api/business` | Update business |
| GET | `/api/business/rules` | Get loyalty rules |
| PATCH | `/api/business/rules` | Update loyalty rules |
| POST | `/api/customers` | Create customer/card |
| GET | `/api/customers` | Search/list customers |
| GET | `/api/customers/:id` | Customer details |
| PATCH | `/api/customers/:id` | Update customer |
| POST | `/api/customers/:id/cards/:cardId/qr` | Generate/download QR |
| POST | `/api/purchases` | Record purchase |
| GET | `/api/purchases` | List/search purchases |
| GET | `/api/claims` | List claims |
| PATCH | `/api/claims/:id/approve` | Approve claim |
| PATCH | `/api/claims/:id/reject` | Reject claim |
| POST | `/api/rewards` | Create reward |
| PATCH | `/api/rewards/:id` | Update reward |
| POST | `/api/redemptions` | Redeem points/credit |
| GET | `/api/reports/summary` | Dashboard metrics |
| GET | `/api/reports/export` | CSV export |

### Customer APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/card/:publicId` | Card summary |
| GET | `/api/card/:publicId/transactions` | Transaction history |
| GET | `/api/card/:publicId/rewards` | Available rewards |
| POST | `/api/card/:publicId/purchase-claims` | Submit claim |
| POST | `/api/card/:publicId/redemption-requests` | Request redemption |
| PATCH | `/api/card/:publicId/preferences` | Update preferences |

## 14. Agent build guide

This section is written for an AI coding agent or development team implementing the product.

### 14.1 Build order

Implement in this exact sequence:

1. Project setup, environment variables, database, auth, base UI system.
2. Business creation, settings, roles, staff invitations.
3. Customer creation, loyalty card generation, QR code, card page.
4. Loyalty rules engine.
5. Admin purchase recording and transaction ledger.
6. Customer purchase claims and admin approval queue.
7. Points, redeemable balance, manual adjustments, and audit logs.
8. Rewards, redemption requests, and redemption processing.
9. Dashboard, reports, filters, and CSV export.
10. Notifications, emails, rate limiting, security hardening.
11. Print styles, QR download, customer card polish.
12. Testing, accessibility, performance, deployment, monitoring.

### 14.2 Recommended stack

| Layer | Recommendation |
|---|---|
| Framework | Next.js App Router |
| Language | TypeScript |
| UI | Tailwind CSS + shadcn/ui or equivalent accessible component system |
| Database | PostgreSQL |
| ORM | Drizzle ORM or Prisma |
| Auth | Supabase Auth, Auth.js, or equivalent secure session auth |
| Storage | S3-compatible object storage or Supabase Storage |
| QR | `qrcode` server-side generation |
| Email | Resend, Postmark, or SMTP provider |
| Background jobs | Queue/worker for emails, exports, expiry, notifications |
| Hosting | Vercel or equivalent |
| Database hosting | Supabase, Neon, Railway, or managed PostgreSQL |
| Monitoring | Sentry, Better Stack, or equivalent |
| Analytics | Privacy-respecting product analytics |

### 14.3 Folder structure

```text
/src
  /app
    /(marketing)
      page.tsx
      about/page.tsx
      pricing/page.tsx
      contact/page.tsx
      privacy/page.tsx
      terms/page.tsx
      faq/page.tsx
    /(admin)
      dashboard/page.tsx
      customers/page.tsx
      customers/[id]/page.tsx
      purchases/page.tsx
      claims/page.tsx
      rewards/page.tsx
      reports/page.tsx
      settings/page.tsx
    /card
      [publicId]/page.tsx
    /api
  /components
    /ui
    /admin
    /customer
    /forms
  /lib
    auth.ts
    db.ts
    loyalty.ts
    validation.ts
    qr.ts
    audit.ts
    analytics.ts
  /server
    /services
    /repositories
    /validators
  /types
```

### 14.4 Implementation rules for agent

The agent must:

- Implement authentication and authorization before exposing business data.
- Use server-side validation for every API endpoint.
- Use Zod or equivalent schema validation.
- Use database transactions for every balance-changing operation.
- Create an audit log for every sensitive action.
- Never trust client-submitted balances or points.
- Recalculate points server-side.
- Prevent duplicate claim submission with database constraints and rate limits.
- Generate QR server-side or through a trusted library.
- Make customer card URLs use public IDs, not internal UUIDs where possible.
- Protect receipt files with signed, expiring URLs.
- Implement role-based UI and API authorization.
- Include loading, empty, error, and success states for every screen.
- Follow `PROJECT_STANDARDS.md` and `NON_AI_WEBSITE_GUIDE.md`.
- Avoid blue-purple gradients, excessive rounded corners, and generic template styling.
- Ensure mobile-first responsive design.
- Write tests for loyalty calculation, claim approval, redemption, authorization, and concurrency.

### 14.5 Testing requirements

| Area | Required tests |
|---|---|
| Auth | Signup, login, logout, password reset, role access |
| Customers | Create, duplicate prevention, search, update |
| Cards | Card creation, QR generation, public card access, freeze/close |
| Rules | Points calculation, minimum purchase, maximum points, redemption value |
| Purchases | Create purchase, calculate points, transaction creation |
| Claims | Submit, duplicate detection, approve, reject, edit-and-approve |
| Balances | Earn, redeem, adjust, concurrency, negative-balance prevention |
| Rewards | Create, deactivate, redeem, insufficient balance |
| Permissions | Owner/manager/cashier/customer access boundaries |
| Security | Rate limiting, unauthorized access, QR privacy, file access |
| UX | Mobile, loading, empty, error, success states |
| Accessibility | Keyboard navigation, focus states, contrast, screen-reader labels |

### 14.6 Definition of done

The product is production-ready only when:

- [ ] Business signup, login, password reset, and staff invitations work.
- [ ] Business settings and loyalty rules work.
- [ ] Customer creation works with duplicate prevention.
- [ ] Loyalty card, QR code, public card URL, and printable card work.
- [ ] Admin purchase recording works.
- [ ] Points calculation works according to configured rules.
- [ ] Customer purchase claims work.
- [ ] Admin claim approval/rejection works.
- [ ] Duplicate and fraud controls work.
- [ ] Points and redeemable balances update atomically.
- [ ] Every balance change has an immutable transaction.
- [ ] Manual adjustments require permission and reason.
- [ ] Rewards and redemption work.
- [ ] Customer card page works on mobile.
- [ ] Dashboard and reports work.
- [ ] CSV export works.
- [ ] Audit logs work.
- [ ] Role-based permissions work.
- [ ] Rate limiting and security controls work.
- [ ] Privacy Policy, Terms, Cookie Policy, and consent flows work.
- [ ] Custom 404 and 500 pages work.
- [ ] SEO metadata, favicon, sitemap, robots, and canonical tags work.
- [ ] Accessibility checks pass.
- [ ] Core tests pass.
- [ ] Monitoring and error tracking work.
- [ ] Backups and restore process are configured.

## 15. Launch checklist

- [ ] Production domain configured.
- [ ] HTTPS enforced.
- [ ] Database backups enabled.
- [ ] Error monitoring enabled.
- [ ] Uptime monitoring enabled.
- [ ] Email provider verified.
- [ ] Object storage configured.
- [ ] Rate limits configured.
- [ ] Roles tested.
- [ ] QR codes tested on multiple phones.
- [ ] Printed cards tested.
- [ ] Claim approval flow tested.
- [ ] Redemption flow tested.
- [ ] Privacy Policy published.
- [ ] Terms published.
- [ ] Cookie consent configured if tracking is used.
- [ ] Support contact published.
- [ ] First business onboarded successfully.
- [ ] Staff trained.
- [ ] Customer feedback channel available.

## 16. Success metrics

| Metric | Target |
|---|---|
| Business activation rate | 60%+ of signed-up businesses create a customer/card |
| Customer card open rate | 70%+ of created cards opened at least once |
| Purchase recording time | Under 30 seconds |
| Claim approval time | Under 24 hours |
| Repeat purchase rate | Improvement versus pre-launch baseline |
| Redemption completion rate | 80%+ |
| Fraudulent claim rate | Under 2% |
| Support tickets per active business | Low and decreasing |
| Monthly active businesses | Growth month over month |
| Customer retention | Repeat visits increase for participating customers |
