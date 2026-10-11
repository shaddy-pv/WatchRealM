# WatchRealm 🏰
### *"Different Worlds. Same Screen."*

> **Intern Assignment: YouTube Watch Party** — Built in ~4 days as a company assignment.  
> Given the opportunity to fully showcase skills, a complete **Story Mode** with 3D world exploration would also be shipped.

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat&logo=typescript)](https://typescriptlang.org)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?style=flat&logo=socket.io)](https://socket.io)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat&logo=mongodb)](https://mongodb.com)
[![Three.js](https://img.shields.io/badge/Three.js-0.186-black?style=flat&logo=three.js)](https://threejs.org)

---

## 📋 Assignment Requirements — All Implemented ✅

| Requirement | Status | Details |
|---|---|---|
| Real-time synchronization | ✅ | Play, pause, seek synced across all clients instantly |
| Room-based model | ✅ | Create/join rooms with unique codes & invite links |
| YouTube integration | ✅ | YouTube IFrame API with full sync control |
| WebSockets | ✅ | Socket.IO — 28+ bidirectional events |
| Role-Based Access Control | ✅ | HOST / MODERATOR / PARTICIPANT with backend validation |

---

## ✨ Features Overview

### 🎬 Cinematic Onboarding Experience
- **3-phase cinematic intro**: Animated loading screen with a flying broomstick rider on a magical progress bar → Cloud-parting reveal of a fantasy kingdom → Mode selection with ornate cards
- **Intelligent asset preloading**: Loading bar is tied to actual image downloads via `Promise.all`. It stays at 92% until ALL landing page images are cached — guaranteeing zero loading flash when user reaches the main page
- **Story Mode video preview**: Coming-soon cinematic plays on Story Mode selection with a disabled→enabled "Continue" button
- **Audio system**: Procedural Web Audio API sound effects (click, travel swoosh, hover)

### 🌍 Normal Mode — Full Landing Page
- **6 Genre Realms**: Fantasy, Horror, Sci-Fi, Anime, Sports, Music — each with a unique castle hover effect and glow system
- **Layered hero section**: 7-image parallax castle composition with unified reveal (all images fade in simultaneously after cache-check)
- **Smart Search Bar**: Type to search public parties by name/theme OR paste an invite link/room code to join directly
- **Live public room directory**: Real-time room list updated via WebSocket `rooms_updated` events
- **Popular Watch Parties grid**: Sorted by live viewer count, filterable by genre district
- **"How It Works"** step section
- **Persistent auth**: JWT-based user accounts with localStorage session

### 🏠 Watch Party Room — Core Feature
- **YouTube IFrame API** player with full sync control
- **Host Playback Heartbeat**: Host sends position every ~1s; server broadcasts if drift > 1.2s
- **Late-joiner sync**: Server calculates `baseTime + (now - lastUpdated)` so joiners land at exact playback position
- **Video search & change**: Host/Moderators can search YouTube or paste any video URL/ID
- **Live chat**: Real-time chat with role labels, rate-limited (5 msg / 3s)
- **Emoji reactions**: Floating animated reactions broadcast to room (10 / 3s)
- **Participant panel**: See all members, their roles, camera/mic status
- **Request sync**: Any participant can re-request sync state from server

### 👑 Role-Based Access Control (RBAC)

| Role | Assigned By | Permissions |
|---|---|---|
| **HOST** | Auto (room creator / first joiner) | Full control: play, pause, seek, change video, assign roles, kick/ban, transfer host |
| **MODERATOR** | Host | Play, pause, seek, change video; optional participant management |
| **PARTICIPANT** | Default for all joiners | Watch-only; all control attempts are rejected server-side |

- **Backend validates ALL permissions** before processing — unauthorized events return `permission_denied`
- **Ban system**: Temporary timeout (N minutes) or permanent ban per user
- **Host grace period**: 20-second reconnect window before host role auto-transfers
- **Camera permissions**: Host can grant/revoke webcam access per participant

### 🔌 WebSocket Event Protocol (28+ Events)

| Event | Direction | Description |
|---|---|---|
| `join_room` | C→S | Join a room; first user becomes HOST |
| `play` | C→S | Play video (HOST/MOD only) |
| `pause` | C→S | Pause video (HOST/MOD only) |
| `seek` | C→S | Seek to position (HOST/MOD only) |
| `change_video` | C→S | Change current video (HOST/MOD only) |
| `clear_video` | C→S | Stop current stream |
| `host_playback_heartbeat` | C→S | Continuous drift correction from host |
| `assign_role` | C→S | Promote/demote participant (HOST only) |
| `remove_participant` | C→S | Kick or ban participant (HOST only) |
| `transfer_host` | C→S | Transfer ownership (HOST only) |
| `request_sync` | C→S | Re-request current sync state |
| `chat_message` | C→S | Send chat message |
| `reaction` | C→S | Send emoji reaction |
| `toggle_seat` | C→S | Toggle 3D seating (Story Mode) |
| `toggle_media` | C→S | Webcam/mic toggle |
| `update_username` | C→S | Update display name |
| `leave_room` | C→S | Leave room gracefully |
| `room_joined` | S→C | Initial room state on join |
| `sync_state` | S→C | Video sync state broadcast |
| `user_joined` | S→C | Participant joined notification |
| `user_left` | S→C | Participant left notification |
| `video_changed` | S→C | New video loaded notification |
| `role_assigned` | S→C | Role update broadcast |
| `host_transferred` | S→C | Host change broadcast |
| `chat_broadcast` | S→C | Chat message to all members |
| `reaction_broadcast` | S→C | Emoji reaction to all members |
| `participant_removed` | S→C | Kick/ban notification |
| `kicked_from_room` | S→C | Targeted kick/ban message |
| `rooms_updated` | S→C | Public room directory update |
| `room_closed` | S→C | Room deleted notification |

### 🗄️ Database & Persistence (MongoDB Atlas)
- Rooms persist across server restarts (survives cold starts)
- User accounts with bcrypt password hashing
- Room restoration on server startup from Atlas
- Private rooms strictly excluded from public directory

### 🎭 Story Mode — 3D World (Bonus Feature)
- **React Three Fiber + Three.js**: Full 3D WebGL environment
- First-person movement (`W`, `A`, `S`, `D` + `Shift` sprint)
- Physical raycasting for interactive 3D signposts (lift + glow on hover)
- Animated NPC guide (*Eldrin*) with idle breathing and proximity dialogue
- Physical Fantasy Watch Pavilion building you can walk into
- 3D cinema interior with seated camera transition
- World Map modal with fast travel (`M` key)

---

## 🏗️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 6.0 | Type safety |
| Vite | 8.3 | Build tool & dev server |
| Tailwind CSS | 4.3 | Styling |
| Three.js | 0.186 | 3D WebGL engine |
| React Three Fiber | 9.8 | React wrapper for Three.js |
| @react-three/drei | 10.7 | Three.js helper components |
| Socket.IO Client | 4.8 | Real-time WebSocket |
| Lucide React | 1.53 | Icon system |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18+ | Runtime |
| TypeScript | 5.7 | Type safety |
| Express | 4.21 | HTTP REST API |
| Socket.IO | 4.8 | WebSocket server |
| Mongoose | 9.11 | MongoDB ODM |
| MongoDB Atlas | — | Persistent database |
| bcryptjs | 3.0 | Password hashing |
| dotenv | 16.4 | Environment config |

---

## 🏛️ Project Architecture

```
WatchRealm/
├── frontend/                          # React + Vite SPA
│   └── src/
│       ├── App.tsx                    # Root router & state orchestrator
│       ├── cinematic/
│       │   └── CinematicIntroReveal.tsx   # 3-phase cinematic intro with preloading
│       ├── landing/
│       │   └── NormalModeLandingPage.tsx  # Full landing page with hero, rooms, footer
│       ├── components/
│       │   ├── WatchPartyRoom.tsx     # Main watch party UI (player, chat, roles)
│       │   ├── CreatePartyModal.tsx   # Room creation modal
│       │   ├── AuthModal.tsx          # Login / Register modal
│       │   ├── UserNavMenu.tsx        # User avatar dropdown menu
│       │   ├── UserAvatar.tsx         # Avatar component
│       │   └── MapModal.tsx           # 3D world map overlay
│       ├── world3d/                   # Story Mode 3D world
│       │   ├── WatchRealmCanvas.tsx
│       │   ├── CameraController.tsx
│       │   ├── RealmWorld.tsx
│       │   └── ...
│       ├── hooks/
│       │   └── useWatchPartySocket.ts # Socket.IO client state hook
│       ├── audio/
│       │   └── soundManager.ts        # Procedural Web Audio API sounds
│       └── config.ts                  # BACKEND_URL env config
│
└── backend/                           # Node.js + Express + Socket.IO
    └── src/
        ├── server.ts                  # Express routes + Socket.IO setup
        ├── websocket/
        │   └── socketHandler.ts       # All WebSocket event handlers + RBAC
        ├── services/
        │   └── RoomManager.ts         # Room lifecycle singleton
        ├── models/
        │   ├── Room.ts                # Room state + sync math + OOP methods
        │   ├── Participant.ts         # Participant model with role methods
        │   └── RoomModel.ts           # MongoDB schema
        ├── types/
        │   └── index.ts               # Shared TypeScript types
        └── config/
            └── db.ts                  # MongoDB Atlas connection
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+ (v24 recommended)
- **npm** v9+
- MongoDB Atlas URI (optional — falls back to in-memory mode)

### 1. Clone & Install

```bash
git clone https://github.com/shaddy-pv/WatchRealM.git
cd WatchRealM
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:
```env
PORT=4000
CORS_ORIGIN=http://localhost:5173
MONGODB_URI=your_mongodb_atlas_uri   # Optional — works without DB
JWT_SECRET=your_jwt_secret
```

```bash
npm run dev      # Development with hot reload
# OR
npm run build && npm start   # Production
```

Backend runs at `http://localhost:4000`  
Health check: `http://localhost:4000/api/health`

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `.env` file:
```env
VITE_BACKEND_URL=http://localhost:4000
```

```bash
npm run dev
```

Open `http://localhost:5173`

---

## 🧪 Testing Multi-User Sync

1. Open two browser tabs at `http://localhost:5173`
2. Complete the cinematic intro on both → select Normal Mode
3. Create a room on Tab 1 (you become **HOST**)
4. Copy the room code → join on Tab 2 (you become **PARTICIPANT**)
5. **Tab 1**: Press Play → Tab 2 instantly syncs ✅
6. **Tab 1**: Seek to 1:30 → Tab 2 jumps to 1:30 ✅
7. **Tab 1**: Promote Tab 2 to **MODERATOR** via Members panel
8. **Tab 2**: Now has playback controls ✅
9. **Tab 1**: Demote Tab 2 back to **PARTICIPANT**
10. **Tab 2**: Try pressing play → gets `permission_denied` ✅

---

## 🌐 Deployment

### Backend (Render / Railway / Fly.io)
- **Root directory**: `backend`
- **Build**: `npm install && npm run build`
- **Start**: `npm start`
- **Env vars**: `PORT`, `CORS_ORIGIN`, `MONGODB_URI`, `JWT_SECRET`

### Frontend (Vercel / Netlify)
- **Root directory**: `frontend`
- **Build**: `npm run build`
- **Output**: `dist`
- **Env vars**: `VITE_BACKEND_URL=https://your-backend.onrender.com`

---

## 🔑 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server health & active room count |
| `GET` | `/api/rooms` | List all public rooms |
| `GET` | `/api/rooms/:id` | Get specific room details |
| `POST` | `/api/rooms` | Create new room |
| `DELETE` | `/api/rooms/:id` | Delete a room |
| `GET` | `/api/rooms/user/:email` | Get rooms hosted by user |
| `POST` | `/api/auth/register` | Register new account |
| `POST` | `/api/auth/login` | Login with credentials |

---

## 👨‍💻 Built By

**Md Shadan Siddiqui**  
Built in ~3–4 days as a company internship assignment.

> *"Given the opportunity to fully showcase skills, I would also complete the Story Mode — a 3D walkable fantasy world where users explore as characters, discover live watch parties as glowing buildings, and step inside a physical cinema to watch together."*

- 🔗 [LinkedIn](https://www.linkedin.com/in/md-shadan-siddiqui/)
- 🐦 [X / Twitter](https://x.com/md_shadann)
- 📸 [Instagram](https://www.instagram.com/am_shadann/)
- 📧 [shadanmd566@gmail.com](mailto:shadanmd566@gmail.com)
