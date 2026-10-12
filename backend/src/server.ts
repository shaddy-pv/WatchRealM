import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { connectDB, isDBConnected, getDBName } from './config/db';
import { registerSocketHandlers } from './websocket/socketHandler';
import { RoomManager } from './services/RoomManager';
import { RoomMongoModel } from './models/RoomModel';
import authRoutes from './routes/authRoutes';

const app = express();
const server = http.createServer(app);

const rawCorsOrigin = process.env.CORS_ORIGIN || '*';
const allowedOrigins = rawCorsOrigin === '*'
  ? ['*']
  : rawCorsOrigin.split(',').map((o) => o.trim().replace(/\/+$/, '')).filter(Boolean);

const isOriginAllowed = (origin?: string): boolean => {
  if (!origin) return true; // allow non-browser requests (Postman, curl, server-to-server)
  const clean = origin.replace(/\/+$/, '');
  if (allowedOrigins.includes('*')) return true;
  if (allowedOrigins.includes(clean) || allowedOrigins.includes(origin)) return true;
  // Automatically whitelist production Vercel frontend, Vercel preview domains, and local dev
  if (clean === 'https://watchrealm-stream.vercel.app') return true;
  if (clean.endsWith('.vercel.app')) return true;
  if (/^https?:\/\/localhost(:\d+)?$/.test(clean) || /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(clean)) return true;
  return false;
};

const corsDelegate = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  if (isOriginAllowed(origin)) {
    callback(null, true);
  } else {
    callback(null, false);
  }
};

const io = new Server(server, {
  cors: {
    origin: corsDelegate,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors({
  origin: corsDelegate,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(express.json({ limit: '1mb' }));

// 1. Mount Auth Routes (MongoDB backed User accounts)
app.use('/api/auth', authRoutes);

// 0. Root Endpoint (Welcome & Status)
app.get('/', (_req, res) => {
  res.json({
    service: 'WatchRealm Backend API & WebSocket Server',
    status: 'online',
    version: '1.0.0',
    database: isDBConnected() ? `connected (MongoDB: ${getDBName()})` : 'in-memory mode',
    clientApp: 'https://watchrealm-stream.vercel.app',
    endpoints: {
      health: '/api/health',
      rooms: '/api/rooms',
      auth: '/api/auth',
    },
    activeRooms: RoomManager.getInstance().listRooms().length,
  });
});

// 2. Health & Status
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    service: 'WatchRealm Real-Time Sync & WebSocket Server',
    database: isDBConnected() ? `connected (MongoDB: ${getDBName()})` : 'in-memory mode',
    timestamp: Date.now(),
    activeRooms: RoomManager.getInstance().listRooms().length,
  });
});

// 3. List all active & persistent rooms (Merges MongoDB Atlas persistent rooms + in-memory live rooms)
app.get('/api/rooms', async (_req, res) => {
  try {
    const inMemoryRooms = RoomManager.getInstance().listRooms().map((r) => r.toJSON());
    let dbRooms: any[] = [];
    if (isDBConnected()) {
      dbRooms = await RoomMongoModel.find().lean();
    }

    const roomMap = new Map<string, any>();
    for (const d of dbRooms) {
      roomMap.set(d.roomId, {
        id: d.roomId,
        roomId: d.roomId,
        name: d.name,
        theme: d.theme,
        videoId: d.videoId,
        currentVideoId: d.videoId,
        videoTitle: d.videoTitle || 'Custom Watch Party',
        isPrivate: d.isPrivate === true,
        hostName: d.hostName || 'Explorer',
        hostEmail: d.hostEmail || '',
        participantCount: d.participantCount || 0,
        createdAt: d.createdAt ? new Date(d.createdAt).getTime() : Date.now(),
      });
    }

    // Overlay real-time in-memory state with strict privacy preservation
    for (const m of inMemoryRooms) {
      const existing = roomMap.get(m.id) || {};
      // Strict Privacy Lock: if either DB or in-memory is private, room is strictly private
      const isPriv = existing.isPrivate === true || m.isPrivate === true;
      roomMap.set(m.id, {
        ...existing,
        ...m,
        isPrivate: isPriv,
        participantCount: m.participantCount,
      });
    }

    // CRITICAL: Exclude all private rooms from the public directory.
    // Private rooms are strictly accessible via direct invite link or the host's own hosted endpoint.
    const publicRooms = Array.from(roomMap.values()).filter((r) => r.isPrivate !== true);
    res.json({ rooms: publicRooms });
  } catch (err) {
    const inMemoryRooms = RoomManager.getInstance().listRooms().filter((r) => !r.isPrivate).map((r) => r.toJSON());
    res.json({ rooms: inMemoryRooms });
  }
});

// 3.1 Get rooms hosted by a specific user (by email or name) from MongoDB Atlas
app.get('/api/rooms/user/:email', async (req, res): Promise<any> => {
  const email = (req.params.email || '').toLowerCase().trim();
  if (!email) {
    return res.status(400).json({ error: 'Email parameter required' });
  }

  try {
    const userRoomMap = new Map<string, any>();

    // 1. In-memory live rooms matching this host email
    const inMemRooms = RoomManager.getInstance().listRooms();
    for (const im of inMemRooms) {
      if (im.hostEmail && im.hostEmail.toLowerCase().trim() === email) {
        userRoomMap.set(im.id, {
          id: im.id,
          roomId: im.id,
          name: im.name,
          title: im.name,
          theme: im.theme,
          videoId: im.currentVideoId,
          currentVideoId: im.currentVideoId,
          isPrivate: im.isPrivate === true,
          hostName: im.hostName,
          hostEmail: im.hostEmail,
          participantCount: im.getParticipantCount(),
          createdAt: im.createdAt,
        });
      }
    }

    // 2. Persistent MongoDB Atlas rooms matching this host email
    if (isDBConnected()) {
      const userRooms = await RoomMongoModel.find({ hostEmail: email }).lean();
      for (const r of userRooms) {
        const live = RoomManager.getInstance().getRoom(r.roomId);
        const liveCount = live ? live.getParticipantCount() : (r.participantCount || 1);
        userRoomMap.set(r.roomId, {
          id: r.roomId,
          roomId: r.roomId,
          name: r.name,
          title: r.name,
          theme: r.theme,
          videoId: r.videoId,
          currentVideoId: r.videoId,
          isPrivate: r.isPrivate === true,
          hostName: r.hostName,
          hostEmail: r.hostEmail,
          participantCount: liveCount,
          createdAt: r.createdAt ? new Date(r.createdAt).getTime() : Date.now(),
        });
      }
    }

    return res.json({ rooms: Array.from(userRoomMap.values()) });
  } catch (err) {
    console.warn('[WatchRealm MongoDB] Error fetching user rooms:', err);
    return res.json({ rooms: [] });
  }
});

// 4. Get specific room details (Restores from MongoDB if not in memory)
app.get('/api/rooms/:id', async (req, res): Promise<any> => {
  let room = RoomManager.getInstance().getRoom(req.params.id);
  if (!room && isDBConnected()) {
    try {
      const saved = await RoomMongoModel.findOne({ roomId: req.params.id }).lean();
      if (saved) {
        room = RoomManager.getInstance().createRoom(
          saved.roomId,
          saved.name,
          saved.theme,
          saved.videoId,
          saved.videoTitle,
          saved.isPrivate === true,
          saved.hostName,
          saved.hostEmail
        );
      }
    } catch (_) {}
  }

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  return res.json({ room: room.toJSON() });
});

// 5. Create Room (Persisted in MongoDB Atlas & in-memory RoomManager)
app.post('/api/rooms', async (req, res): Promise<any> => {
  const { id, name, theme, videoId, videoTitle, isPrivate, hostName, hostEmail } = req.body;
  if (!id || !name) {
    return res.status(400).json({ error: 'Room id and name are required' });
  }

  // 1. Create in-memory room for real-time WebSocket broadcasting
  const room = RoomManager.getInstance().createRoom(
    id,
    name,
    theme || 'fantasy',
    videoId || '1La4QzGeaaQ',
    videoTitle || 'Custom Watch Party',
    isPrivate === true,
    hostName || 'Explorer',
    hostEmail
  );

  // 2. Persist room in MongoDB Atlas permanently
  if (isDBConnected()) {
    try {
      await RoomMongoModel.findOneAndUpdate(
        { roomId: id },
        {
          roomId: id,
          name,
          theme: theme || 'fantasy',
          videoId: videoId || '1La4QzGeaaQ',
          videoTitle: videoTitle || 'Custom Watch Party',
          isPrivate: isPrivate === true,
          hostName: hostName || 'Explorer',
          hostEmail: hostEmail ? hostEmail.toLowerCase().trim() : undefined,
          participantCount: 1,
        },
        { upsert: true, new: true }
      );
      console.log(`[WatchRealm MongoDB] Room "${name}" (${id}) persisted to Atlas for host ${hostEmail || 'Guest'}`);
    } catch (err) {
      console.warn('[WatchRealm MongoDB] Could not save room:', err);
    }
  }

  const publicActiveRooms = RoomManager.getInstance().listRooms().filter((r) => !r.isPrivate).map((r) => r.toJSON());
  io.emit('rooms_updated', publicActiveRooms);

  return res.status(201).json({ room: room.toJSON() });
});

// 6. Delete a specific Room (from MongoDB Atlas & in-memory RoomManager)
app.delete('/api/rooms/:id', async (req, res): Promise<any> => {
  const roomId = req.params.id;
  try {
    RoomManager.getInstance().deleteRoom(roomId);

    if (isDBConnected()) {
      await RoomMongoModel.deleteOne({ roomId });
    }

    const activeRooms = RoomManager.getInstance().listRooms().filter((r) => !r.isPrivate).map((r) => r.toJSON());
    io.emit('rooms_updated', activeRooms);
    io.to(roomId).emit('room_closed', { roomId, reason: 'Party has been closed/deleted.' });

    return res.json({ success: true, message: `Room ${roomId} deleted successfully.` });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete room', details: err?.message });
  }
});

// 7. Delete ALL Rooms (Clear MongoDB Atlas & in-memory RoomManager)
app.delete('/api/rooms', async (_req, res): Promise<any> => {
  try {
    RoomManager.getInstance().clearAllRooms();

    if (isDBConnected()) {
      await RoomMongoModel.deleteMany({});
    }

    io.emit('rooms_updated', []);
    return res.json({ success: true, message: 'All rooms deleted successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to clear rooms', details: err?.message });
  }
});

// Register WebSocket Handlers
registerSocketHandlers(io);

// Restore saved rooms from MongoDB on startup
const restoreRoomsFromDB = async () => {
  if (!isDBConnected()) return;
  try {
    const savedRooms = await RoomMongoModel.find().lean();
    for (const r of savedRooms) {
      RoomManager.getInstance().createRoom(
        r.roomId,
        r.name,
        r.theme,
        r.videoId,
        r.videoTitle,
        r.isPrivate,
        r.hostName
      );
    }
    if (savedRooms.length > 0) {
      console.log(`[WatchRealm MongoDB] Restored ${savedRooms.length} watch party room(s) from database.`);
    }
  } catch (err) {
    console.warn('[WatchRealm MongoDB] Error restoring rooms:', err);
  }
};

const PORT = process.env.PORT || 4000;
server.listen(PORT, async () => {
  console.log(`[WatchRealm] WebSocket & Sync Server running on port ${PORT}`);
  console.log(`[WatchRealm] Health check available at http://localhost:${PORT}/api/health`);

  // Connect to MongoDB
  await connectDB();
  await restoreRoomsFromDB();
});
