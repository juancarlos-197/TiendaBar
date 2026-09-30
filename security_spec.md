# Security Specification - Nocturna Bares & Discotecas

## 1. Data Invariants
- Admin user: `jalban.dacompsc@gmail.com` has full administrative oversight over users, bars, events, catalog, and subscriptions.
- Users can create and manage their own profile (`users/{userId}` where `userId == request.auth.uid`). Users cannot elevate their own role to ADMIN.
- Bars can be created and managed by ADMIN or BAR_OWNER (`ownerId == request.auth.uid`).
- Events can be created and updated by ADMIN or the owner of the associated bar.
- Artists, Songs, Playlists, Categories, and Products can be read by any authenticated or public visitors; creation and updates are restricted to ADMIN and BAR_OWNER.
- Orders can be created by authenticated users for their own `userId`. Users can read their own orders. Admins and Bar Owners can view and update order status (`PENDING`, `PREPARING`, `SERVED`, `DELIVERED`, `CANCELLED`).
- Subscriptions are read by owners and updated by system/admins or on self-subscribe.

## 2. Dirty Dozen Payloads (Designed to Fail)
1. User role spoofing: An unauthenticated or standard user attempting to write `role: "ADMIN"` in `/users/{userId}`.
2. Cross-user profile overwrite: User A attempting to update `/users/userB`.
3. Malicious Bar Injection: Attacker attempting to write a bar with 50KB payload and no `name`.
4. Event Ticket Scalping/Tampering: Non-owner attempting to alter event `coverPrice` or delete another bar's events.
5. Order Identity Forgery: User A creating an order with `userId: "userB"`.
6. Order Total Injection: Negative order total or missing required items.
7. Shadow Keys: Adding arbitrary malicious fields not declared in schema to `/products`.
8. Unbounded Array Flood: Attempting to flood playlists with millions of entries.
9. Privilege Escalation via Status: Standard user marking their own order as `DELIVERED` without authorization.
10. Subscription Tampering: Regular user writing an active VIP subscription with arbitrary price 0 without authorization.
11. Unauthenticated Product Deletion: Anonymous request attempting to delete liquor catalog.
12. Email Spoofing: Payload pretending to be admin email without `email_verified == true`.
