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

// @route   GET /api/users/:id
// @desc    Get public profile of a user by ID or username
router.get('/:id', async (req, res) => {
  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const query = isObjectId ? { _id: req.params.id } : { username: req.params.id };

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
      const u = await User.findOne({ username: req.params.id }).select('_id');
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

