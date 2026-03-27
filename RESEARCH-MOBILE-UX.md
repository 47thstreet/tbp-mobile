# Mobile UX Research: Event/Nightlife Apps (2026)

## Apps Analyzed

### 1. DICE
**What makes it great:**
- **Zero-friction ticket purchase**: Apple Pay / Google Pay as primary CTA, 1-tap buy. No account creation required for first purchase — sign up happens post-purchase.
- **QR ticket display**: Full-screen QR with high brightness auto-lock override. Ticket activates only at venue proximity (anti-screenshot sharing). Animated ticket with event branding.
- **Event discovery**: Location-based feed with infinite scroll. "For You" algorithmic recommendations based on past attendance. Genre/vibe filters as horizontal chips.
- **Onboarding**: 3-screen carousel (discover, buy, enter) then straight to feed. No forced sign-up.
- **Social**: "Going" count visible. Invite friends via share sheet. See which friends are attending (contact sync).
- **Push notifications**: Reminder 24h and 2h before event. "Selling fast" urgency triggers. New events from followed artists.

### 2. Posh
**What makes it great:**
- **Social-first design**: Event pages show attendee avatars. "Request to join" for exclusive events creates FOMO. Host profiles are prominent.
- **Onboarding**: Phone number auth (SMS OTP) — no email/password friction. Profile photo upload encouraged immediately.
- **Discovery**: Map view alongside list view. Trending/hot events section. "Happening Now" real-time section.
- **Ticket purchase**: In-app Stripe checkout (no WebView redirect). Table/bottle service booking integrated. Group ticket purchase flow.
- **Push strategy**: "Your friend is going to X" social triggers. Weekly digest of curated events.

### 3. Partiful
**What makes it great:**
- **Invite-centric UX**: Events feel like personal invitations, not retail listings. RSVP flow is the core interaction.
- **Social proof**: Guest list visible. Comments/reactions on event page. Photo sharing post-event.
- **Onboarding**: Link-based entry (deep links from SMS/social). Account creation is implicit.
- **Design**: Playful, colorful, Gen-Z aesthetic. Custom event themes. Animated backgrounds.

### 4. RA Guide (Resident Advisor)
**What makes it great:**
- **Discovery depth**: Extensive filtering (genre, date range, price, accessibility). Venue pages with ratings and past events. Artist pages with discography links.
- **Editorial content**: Curated "RA Picks" with editorial blurbs. Long-form venue/artist features.
- **Ticket flow**: In-app purchase with Apple Pay. Waiting list for sold-out events. Resale marketplace.
- **Push notifications**: Price drop alerts. Lineup announcements for followed venues. "Last chance" before sell-out.

---

## Critical UX Patterns Identified

### 1. Onboarding Flow
**Best practice (DICE/Posh model):**
- Skip sign-up entirely on first launch — show content immediately
- 2-3 screen intro carousel (swipeable, skippable)
- Collect location permission for local events
- Defer account creation to first purchase or social action
- Phone number / social auth preferred over email/password

**Gap in TBP Mobile:** No onboarding flow exists. App goes straight to home with no context. No location collection.

### 2. Event Discovery
**Best practice:**
- Horizontal category/genre filter chips (scrollable)
- "Tonight" / "This Weekend" / "This Week" quick date filters
- "Happening Now" section with live events highlighted
- Trending/popular section with social proof (X people interested)
- Map view toggle for venue-based browsing
- Personalized "For You" section based on history

**Gap in TBP Mobile:** Only a flat list with text search. No date filters, no categories, no trending section.

### 3. Ticket Purchase Speed
**Best practice:**
- Maximum 2 taps from discovery to purchase confirmation
- Apple Pay / Google Pay as primary (not WebView redirect)
- Quantity selector on event page itself
- Cart-less: direct purchase, no add-to-cart step
- Confirmation with "Add to Calendar" and "Share" CTAs immediately

**Gap in TBP Mobile:** Uses WebBrowser redirect for checkout — breaks immersion, slow, no native payment.

### 4. QR Ticket Display
**Best practice:**
- Full-screen QR code with white background
- Auto-brightness increase when QR is shown
- Swipeable ticket carousel for multiple tickets
- Event branding on ticket (cover image, event name, date)
- "Pull down to show QR" gesture from ticket card
- Animated validation feedback (green check pulse)

**Gap in TBP Mobile:** QR is small, embedded in expandable card. No brightness control. No swipe between tickets.

### 5. Social Features
**Best practice:**
- "X friends going" on event cards
- Share event via native share sheet (with deep link)
- "Invite friends" button on event detail
- Post-event photo sharing
- Follow artists/DJs for notifications
- Activity feed showing friends' RSVPs

**Gap in TBP Mobile:** No social features at all. No share button on events. No friend integration.

### 6. Push Notification Strategy
**Best practice tiers:**
- **Pre-purchase**: New events from followed artists/venues. "Selling fast" urgency. Price drops.
- **Post-purchase**: 24h reminder, 2h reminder, "doors open now". Lineup changes.
- **Social**: Friend going to event. Friend shared event with you.
- **Re-engagement**: Weekly digest. "Events near you this weekend."

**Gap in TBP Mobile:** expo-notifications is installed but no notification scheduling, no permission request flow, no notification preferences screen.

---

## Priority Implementation Plan

### P0 — Must Have (Ship blockers)
1. **Onboarding carousel** — First-time user experience with 3 slides
2. **Event date filters** — "Tonight" / "This Weekend" / "All" quick filters
3. **Share event button** — Native share sheet on EventDetail
4. **Full-screen QR ticket view** — Dedicated screen with brightness boost
5. **Add to Calendar** — From event detail and ticket screens
6. **Push notification opt-in** — Permission request + event reminders

### P1 — Should Have (Week 2)
7. **Category/genre filter chips** on home screen
8. **"Happening Now" section** for live events
9. **Ticket quantity selector** — In-app instead of WebView redirect
10. **Follow DJs** — Save favorites for notifications

### P2 — Nice to Have (Month 2)
11. **Map view** for venue browsing
12. **Social proof** — "X attending" on event cards
13. **Post-event photo sharing**
14. **Weekly event digest notifications**

---

## Design Principles (Common Across All Top Apps)

1. **Dark theme by default** — TBP already does this well
2. **Large, full-bleed cover images** — Visual-first discovery
3. **Minimal text, maximum imagery** — Nightlife is visual
4. **Urgency cues** — "Selling fast", "Last 10 tickets", countdown timers
5. **One-hand operation** — Bottom sheet modals, thumb-reach CTAs
6. **Haptic feedback** — On purchase, QR scan, navigation
7. **Smooth transitions** — Shared element transitions between list and detail
