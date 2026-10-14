# iOS iMessage Video Creative — Format Specification & Extraction

*Extracted directly from native iOS reference captures (`messages ui.jpg`, `message ui 2.jpg`, `Screenshot 2026-10-07 at 18.36.23.png`).*

---

## 1. Global Viewport & Color Palette

| Element | Specification / Token | Visual Value |
|---|---|---|
| **Canvas Ratio** | 9:16 Vertical Video | `1080 x 1920 px` (Desktop Studio: `375 x 680 px`) |
| **Canvas Background** | Pure OLED Pitch Black | `#000000` |
| **Received Bubble (Gray)** | Dark Charcoal Slate | `#26252a` (Active) / `#2b2a2f` (Alt) |
| **Sent Bubble (Blue)** | Apple iMessage Blue | `#007aff` / `#0b84fe` |
| **Primary Text** | Pure White | `#ffffff` |
| **Secondary / Meta Text** | Apple System Gray | `#8e8e93` |
| **Placeholder Text** | Muted Gray | `#636366` |
| **Frosted Bar Background** | Translucent Blur | `rgba(20, 20, 24, 0.85)` + `backdrop-filter: blur(25px)` |
| **Group Sender Color (Sister)** | iOS Purple | `#bf5af2` |
| **Group Sender Color (Brother)** | iOS Orange | `#ff9f0a` |
| **Group Sender Color (Mom)** | iOS Green / Pink | `#30d158` / `#ff375f` |

---

## 2. Top Status Bar Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ 20:14 ◀ Puzzles                      [Signal]  5G  [ 39% ]  │
└─────────────────────────────────────────────────────────────┘
```

- **Left Side:**
  - Clock time (e.g. `20:14`) in Apple SF Pro Medium (14px, `#ffffff`).
  - Left navigation arrow `◀` + previous app breadcrumb (`Puzzles` or `Instagram`) in 11px gray.
- **Right Side:**
  - 4-bar cellular signal icon.
  - `5G` badge in bold 11px white.
  - Battery capsule: White outline with embedded battery percentage text inside (`39` or `100`).

---

## 3. Top Navigation Header

```
┌─────────────────────────────────────────────────────────────┐
│  ( < )                      [ PS ]                   ( 📹 ) │
│                           Parker >                          │
│                          Today 19:21                        │
└─────────────────────────────────────────────────────────────┘
```

- **Back Button (Left):**
  - 32px circle, background `rgba(44, 44, 46, 0.8)`, centered blue chevron `<` (`#007aff`).
- **Contact Center Stack:**
  - **Avatar:** 44px circle at top. Either:
    - Initials gradient badge (e.g. `PS` on purple-slate gradient `#4a4360` $\to$ `#352f44`).
    - Contact portrait photo (`avatar-wifey.jpg`).
    - Overlapping dual avatars for Group Chats (`av1` top-left, `av2` bottom-right).
  - **Name Capsule:** Rounded pill background `rgba(44, 44, 46, 0.7)` with contact name and right chevron (e.g. `Parker >`, `Wifey ❤️ >`, `Family Chat 👨‍👩‍👧‍👦 >`).
  - **Subtext:** 10px `#8e8e93` timestamp or status (`Today 19:21`, `🔒 Online`, `Sister, Brother, Mom, Dad (4)`).
- **Video Call Button (Right):**
  - 32px circle, background `rgba(44, 44, 46, 0.8)`, centered blue video camera icon `📹`.

---

## 4. Message Thread Geometry & Clustering

### Typography & Padding
- **Font:** `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif`.
- **Size:** `15.5px` – `16px`.
- **Line Height:** `1.34`.
- **Letter Spacing:** `-0.2px`.
- **Bubble Padding:** `8px 14px`.
- **Max Width:** `76%` of viewport width.
- **Corner Radius:** `18px`.

### Tail & Cluster Logic
- **Consecutive messages from same sender:**
  - Vertical spacing: `2.5px`.
  - Inner corners rounded `18px` without tail.
- **Last message in a cluster:**
  - Bottom corner (bottom-left for incoming, bottom-right for outgoing) features the curved iMessage tail (`border-bottom-left-radius: 4px` / `border-bottom-right-radius: 4px`).
  - Vertical spacing before sender switch: `10px`.

### Timestamps & Read Receipts
- **Timestamp Divider:** Centered, 11px, `#8e8e93`, margin `12px 0 4px` (e.g. `Today 19:21`, `Yesterday 19:21`).
- **Read Receipt:** Right-aligned underneath outgoing blue bubble, 11px, `#8e8e93`, margin `2px 4px 0 0` (e.g. `Read 20:13`, `Read Yesterday`).

### Animated Typing Bubble
- Gray bubble (`#26252a`), `border-radius: 16px`, `border-bottom-left-radius: 4px`.
- Contains 3 animated bouncing dots (`#8e8e93`, 6px diameter) with sequential 0.2s animation delay.

---

## 5. Bottom Input Bar (iOS 17/18 Style)

```
┌─────────────────────────────────────────────────────────────┐
│  (+)   [  iMessage                                      🎙️ ] │
│                           ──────                            │
└─────────────────────────────────────────────────────────────┘
```

- **Plus Button (Left):** 30px circle, background `#2c2c2e`, light gray `+` symbol (`#8e8e93`).
- **Input Pill:**
  - Height: `32px`.
  - Border radius: `16px`.
  - Border: `1px solid rgba(255, 255, 255, 0.15)`.
  - Placeholder: `iMessage` in `#636366` (or live animated draft text when typing).
  - Right Icon: Microphone `🎙️` in `#8e8e93`.
- **Home Indicator (Bottom):** Centered white bar (134px wide, 5px high, 100px radius, opacity 0.6).

---

## 6. Google Calendar / Yearly Pop-Up Notification Format

```
┌─────────────────────────────────────────────────────────────┐
│ 📅 GOOGLE CALENDAR • YEARLY                             now │
│ 💍 Wifey's 3rd Anniversary Tuesday!                         │
│ Send 50 Luxury Long-Stem Red Roses. Delivery at 10:00 AM.   │
│ [ ⚡ 1-Click Send 50 Red Roses ($49)                      ] │
└─────────────────────────────────────────────────────────────┘
```

- **Position:** Slides down from top under the Dynamic Island.
- **Styling:** `rgba(28, 28, 32, 0.96)` with `backdrop-filter: blur(25px)`, `border: 1px solid rgba(255, 255, 255, 0.18)`, `border-radius: 20px`, glowing green shadow.
- **Button:** Vibrant `#22c55e` green pill button with active haptic press animation.

---

## 7. Dynamic Video Flow & Transition Timings

1. **Scene 1 (0.0s – 3.0s) — Tension Hook:**
   - Incoming message pops in with iOS audio `pop.mp3`.
   - Subtle delay $\to$ Typing indicator appears on receiver's end.
2. **Scene 2 (3.0s – 6.0s) — Near-Disaster & Intervention:**
   - Draft typing text appears in the bottom input pill.
   - Google Calendar notification slides down with distinct chime.
3. **Scene 3 (6.0s – 8.5s) — 1-Click Execution:**
   - Notification button is tapped (glows green / checkmark).
   - Draft text in input pill is backspaced.
   - Outgoing blue bubble sends with `sent.mp3` chime and "Read Just now" receipt.
4. **Scene 4 (8.5s – 12.0s) — Payoff & CTA:**
   - Seamless zoom transition to B-Roll reveal (50 red roses delivered at doorstep / happy reaction).
