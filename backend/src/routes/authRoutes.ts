import { Router, Request, Response } from 'express';
import { UserModel } from '../models/User';
import { isDBConnected } from '../config/db';

const router = Router();

// ---------------------------------------------------------------------------
// 1. POST /api/auth/register
// ---------------------------------------------------------------------------
router.post('/register', async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Explorer username is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Valid email address is required.' });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // If MongoDB is connected, persist and check duplicates
    if (isDBConnected()) {
      const existingUser = await UserModel.findOne({
        $or: [{ email: cleanEmail }, { name: { $regex: new RegExp(`^${cleanName}$`, 'i') } }],
      });

      if (existingUser) {
        return res.status(409).json({ error: 'An explorer with this email or username already exists.' });
      }

      const newUser = new UserModel({
        name: cleanName,
        email: cleanEmail,
        password,
        provider: 'local',
        role: 'explorer',
      });
      await newUser.save();

      return res.status(201).json({
        success: true,
        message: 'Explorer account created successfully in MongoDB.',
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          avatar: newUser.avatar,
        },
      });
    }

    // Fallback if DB is temporarily disconnected
    return res.status(201).json({
      success: true,
      message: 'Account created (in-memory mode).',
      user: {
        id: `usr_${Date.now()}`,
        name: cleanName,
        email: cleanEmail,
        role: 'explorer',
        avatar: '',
      },
    });
  } catch (error: any) {
    console.error('[Auth Register Error]:', error);
    return res.status(500).json({ error: error.message || 'Server error during registration.' });
  }
});

// ---------------------------------------------------------------------------
// 2. POST /api/auth/login
// ---------------------------------------------------------------------------
router.post('/login', async (req: Request, res: Response): Promise<any> => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !emailOrUsername.trim()) {
      return res.status(400).json({ error: 'Email or username is required.' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is required.' });
    }

    const target = emailOrUsername.trim();

    if (isDBConnected()) {
      // Find user by email or case-insensitive username
      const user = await UserModel.findOne({
        $or: [
          { email: target.toLowerCase() },
          { name: { $regex: new RegExp(`^${target}$`, 'i') } },
        ],
      });

      if (!user) {
        return res.status(401).json({ error: 'No explorer found with these credentials.' });
      }

      if (user.provider === 'local' && user.password) {
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          return res.status(401).json({ error: 'Incorrect password provided.' });
        }
      }

      return res.json({
        success: true,
        message: 'Welcome back explorer! Authenticated via MongoDB.',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar || '',
        },
      });
    }

    // Fallback if DB is temporarily disconnected
    const fallbackName = target.includes('@') ? target.split('@')[0] : target;
    return res.json({
      success: true,
      message: 'Authenticated (in-memory mode).',
      user: {
        id: `usr_${Date.now()}`,
        name: fallbackName,
        email: target.includes('@') ? target : `${target.toLowerCase()}@watchrealm.io`,
        role: 'explorer',
        avatar: '',
      },
    });
  } catch (error: any) {
    console.error('[Auth Login Error]:', error);
    return res.status(500).json({ error: error.message || 'Server error during sign in.' });
  }
});

// ---------------------------------------------------------------------------
// 3. POST /api/auth/social
// ---------------------------------------------------------------------------
router.post('/social', async (req: Request, res: Response): Promise<any> => {
  try {
    const { provider, name, email } = req.body;
    const cleanProvider = (['google', 'discord', 'apple'].includes(provider) ? provider : 'google') as
      | 'google'
      | 'discord'
      | 'apple';

    const defaultNames = {
      google: 'Google Explorer',
      discord: 'Discord Voyager',
      apple: 'Apple Navigator',
    };

    const finalName = name?.trim() || defaultNames[cleanProvider];
    const finalEmail = (email?.trim() || `${cleanProvider}_${Date.now()}@watchrealm.io`).toLowerCase();

    if (isDBConnected()) {
      let user = await UserModel.findOne({ email: finalEmail });
      if (!user) {
        user = new UserModel({
          name: finalName,
          email: finalEmail,
          provider: cleanProvider,
          role: 'explorer',
        });
        await user.save();
      }

      return res.json({
        success: true,
        message: `Authenticated via ${cleanProvider} in MongoDB.`,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
      });
    }

    return res.json({
      success: true,
      message: `Authenticated via ${cleanProvider} (in-memory).`,
      user: {
        id: `usr_${Date.now()}`,
        name: finalName,
        email: finalEmail,
        role: 'explorer',
        avatar: '',
      },
    });
  } catch (error: any) {
    console.error('[Auth Social Error]:', error);
    return res.status(500).json({ error: error.message || 'Server error during social sign in.' });
  }
});

// ---------------------------------------------------------------------------
// 4. GET /api/auth/status
// ---------------------------------------------------------------------------
router.get('/status', async (_req: Request, res: Response) => {
  const dbStatus = isDBConnected();
  let userCount = 0;
  if (dbStatus) {
    try {
      userCount = await UserModel.countDocuments();
    } catch (_) {}
  }
  res.json({
    database: dbStatus ? 'connected' : 'disconnected',
    registeredExplorers: userCount,
  });
});

export default router;
