import { Router } from 'express';
import { User } from '../models/User.js';
import { Post } from '../models/Post.js';
import { Comment } from '../models/Comment.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// @route   GET /api/users/me/terminal
// @desc    Get authenticated student's persistent terminal session
router.get('/me/terminal', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('terminalState');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ terminalState: user.terminalState || null });
  } catch (err) {
    console.error('[Get Terminal State Error]', err);
    return res.status(500).json({ error: 'Failed to load terminal state' });
  }
});

// @route   PUT /api/users/me/terminal
// @desc    Save authenticated student's persistent terminal session
router.put('/me/terminal', requireAuth, async (req, res) => {
  const { fs, history, cwd } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.terminalState = {
      fs: fs || user.terminalState?.fs,
      history: Array.isArray(history) ? history.slice(-100) : user.terminalState?.history || [],
      cwd: typeof cwd === 'string' ? cwd : user.terminalState?.cwd || '/home/user',
      updatedAt: new Date(),
    };

    await user.save();
    return res.json({ success: true, updatedAt: user.terminalState.updatedAt });
  } catch (err) {
    console.error('[Save Terminal State Error]', err);
    return res.status(500).json({ error: 'Failed to save terminal state' });
  }
});

router.get('/team', async (req, res) => {
  try {
    const members = await User.find({
      'communityRole.isMember': true,
    })
      .select('-passwordHash')
      .sort({ 'communityRole.order': 1, createdAt: 1 })
      .lean();

    const formatted = members.map((u) => ({
      id: u._id.toString(),
      username: u.username,
      email: u.email,
      role: u.role,
      avatar: u.avatar || '',
      bio: u.bio || '',
      skills: u.skills || [],
      socials: u.socials || {},
      communityRole: {
        isMember: true,
        category: u.communityRole?.category || 'Coordinator',
        positionTitle: u.communityRole?.positionTitle || 'Team Member',
        teamDomain: u.communityRole?.teamDomain || 'Core',
        order: typeof u.communityRole?.order === 'number' ? u.communityRole.order : 99,
        assignedAt: u.communityRole?.assignedAt || u.createdAt,
      },
      createdAt: u.createdAt,
    }));

    return res.json({ team: formatted });
  } catch (err) {
    console.error('[Get Public Team Error]', err);
    return res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const escaped = String(req.params.id).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const query = isObjectId ? { _id: req.params.id } : { username: { $regex: new RegExp(`^${escaped}$`, 'i') } };

    const user = await User.findOne(query).select('-passwordHash').lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [postCount, commentCount] = await Promise.all([
      Post.countDocuments({ author: user._id }),
      Comment.countDocuments({ author: user._id }),
    ]);

    const userPosts = await Post.find({ author: user._id }).select('voteScore').lean();
    const upvotesReceived = userPosts.reduce((sum, p) => sum + (p.voteScore > 0 ? p.voteScore : 0), 0);

    return res.json({
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      bio: user.bio || '',
      skills: user.skills || [],
      avatar: user.avatar || '',
      socials: user.socials || {},
      communityRole: user.communityRole || {
        isMember: false,
        category: '',
        positionTitle: '',
        teamDomain: '',
        order: 99,
      },
      preferences: user.preferences || {},
      createdAt: user.createdAt,
      stats: {
        posts: postCount,
        comments: commentCount,
        upvotes: upvotesReceived,
      },
    });
  } catch (err) {
    console.error('[Get User Profile Error]', err);
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// @route   GET /api/users/:id/posts
// @desc    Get all posts created by a specific user
router.get('/:id/posts', async (req, res) => {
  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    let userId = req.params.id;

    if (!isObjectId) {
      const escaped = String(req.params.id).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const u = await User.findOne({ username: { $regex: new RegExp(`^${escaped}$`, 'i') } }).select('_id');
      if (!u) return res.status(404).json({ error: 'User not found' });
      userId = u._id;
    }

    const posts = await Post.find({ author: userId })
      .sort({ createdAt: -1 })
      .populate('author', 'username role avatar')
      .lean();

    return res.json(
      posts.map((p) => ({
        id: p._id.toString(),
        title: p.title,
        body: p.body,
        category: p.category,
        tags: p.tags || [],
        voteScore: p.voteScore || 0,
        commentCount: p.commentCount || 0,
        createdAt: p.createdAt,
      }))
    );
  } catch (err) {
    console.error('[Get User Posts Error]', err);
    return res.status(500).json({ error: 'Failed to fetch user posts' });
  }
});

export default router;

