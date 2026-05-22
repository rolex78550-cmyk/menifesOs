# Security Specification & Invariants for Vibe OS Firestore

## 1. Data Invariants
- **Admin Isolation**: Only users authenticated with the email `asartist20@gmail.com` or explicitly listed in `/admins/{userId}` can view, list, or modify user profile tiers (`/users/{userId}`) and view raw financials (`/transactions/{transactionId}`) across other accounts.
- **Identity Integrity**: Standard user nodes can only access and list their own documents (where `ownerId == request.auth.uid` or `userId == request.auth.uid`). No standard user can fetch another user's profile, habits, dreams, or finances.
- **Immortal Field Verification**: Timestamp values (such as `updatedAt` and `timestamp`) must align with `request.time` (server timestamp) to prevent client temporal forgery.

## 2. The "Dirty Dozen" Payloads (Identity & Privilege Escalation Attempt)
To ensure Zero-Trust verification:
1. **Self-Elevating Tier**: Standard seeker trying to set their own tier to `Infinite` via profile update (Value Poisoning check).
2. **PII Reader Snooping**: Fetching list on `/users` collection without admin authentication (PII Isolation check).
3. **Transaction Poisoning**: Spoofing transactions for other users by posting with custom `ownerId`.
4. **Junk ID Insertion**: Writing a document with non-alphanumeric alphanumeric ID containing unsafe characters.
5. **Ghost Field Mutation**: Sending a payload on product update with high-privilege keys.
6-12. State shortcutting attempts, unsanitzed metadata injections, and spoofed timestamps which are all strictly blocked by rules.
