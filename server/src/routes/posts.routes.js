import { Router } from 'express';
import mongoose from 'mongoose';
import { Post } from '../models/Post.js';
import { Comment } from '../models/Comment.js';
import { Vote } from '../models/Vote.js';
import { requireAuth, optionalAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// @route   GET /api/posts
// @desc    Get list of posts with filtering, sorting, pagination, and user vote status
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 15));
    const skip = (page - 1) * limit;

    const { category, tag, sort = 'hot', search } = req.query;

    const filter = {};
    if (category && category !== 'All' && category !== 'all') {
      filter.category = category.toLowerCase();
    }
    if (tag) {
      filter.tags = tag;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { body: { $regex: search, $options: 'i' } },
      ];
    }

    let sortCriteria = { isPinned: -1 };
    if (sort === 'new') {
      sortCriteria.createdAt = -1;
    } else if (sort === 'top') {
      sortCriteria.voteScore = -1;
      sortCriteria.createdAt = -1;
    } else {
      // 'hot' default
      sortCriteria.voteScore = -1;
      sortCriteria.createdAt = -1;
    }

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort(sortCriteria)
        .skip(skip)
        .limit(limit)
        .populate('author', 'username role avatar')
        .lean(),
      Post.countDocuments(filter),
    ]);

    let userVoteMap = new Map();
    if (req.user && posts.length > 0) {
      const postIds = posts.map((p) => p._id);
      const userVotes = await Vote.find({
        user: req.user.id,
        post: { $in: postIds },
      }).lean();

      userVotes.forEach((v) => {
        userVoteMap.set(v.post.toString(), v.value);
      });
    }

    const formattedPosts = posts.map((p) => ({
      id: p._id.toString(),
      _id: p._id.toString(),
      title: p.title,
      body: p.body,
      category: p.category,
      tags: p.tags || [],
      voteScore: p.voteScore || 0,
      commentCount: p.commentCount || 0,
      isPinned: !!p.isPinned,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      author: p.author
        ? {
            id: p.author._id.toString(),
            username: p.author.username,
            role: p.author.role,
            avatar: p.author.avatar,
          }
        : { username: 'deleted', role: 'student' },
      userVote: userVoteMap.get(p._id.toString()) || 0,
    }));

    return res.json({
      posts: formattedPosts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        hasMore: page * limit < total,
      },
    });
  } catch (err) {
    console.error('[Get Posts Error]', err);
    return res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// @route   GET /api/posts/:id
// @desc    Get single post detail with comments and user vote
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username role avatar bio')
      .lean();

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comments = await Comment.find({ post: post._id })
      .sort({ createdAt: 1 })
      .populate('author', 'username role avatar')
      .lean();

    let userVote = 0;
    if (req.user) {
      const vote = await Vote.findOne({ user: req.user.id, post: post._id });
      if (vote) userVote = vote.value;
    }

    const formattedPost = {
      id: post._id.toString(),
      _id: post._id.toString(),
      title: post.title,
      body: post.body,
      category: post.category,
      tags: post.tags || [],
      voteScore: post.voteScore || 0,
      commentCount: post.commentCount || 0,
      isPinned: !!post.isPinned,
      isLocked: !!post.isLocked,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: post.author
        ? {
            id: post.author._id.toString(),
            username: post.author.username,
            role: post.author.role,
            avatar: post.author.avatar,
            bio: post.author.bio,
          }
        : { username: 'deleted', role: 'student' },
      userVote,
    };

    const formattedComments = comments.map((c) => ({
      id: c._id.toString(),
      _id: c._id.toString(),
      body: c.body,
      parentComment: c.parentComment ? c.parentComment.toString() : null,
      createdAt: c.createdAt,
      author: c.author
        ? {
            id: c.author._id.toString(),
            username: c.author.username,
            role: c.author.role,
            avatar: c.author.avatar,
          }
        : { username: 'deleted', role: 'student' },
    }));

    return res.json({
      post: formattedPost,
      comments: formattedComments,
    });
  } catch (err) {
    console.error('[Get Post Detail Error]', err);
    return res.status(500).json({ error: 'Failed to fetch post details' });
  }
});

// @route   POST /api/posts
// @desc    Create a new post
router.post('/', requireAuth, async (req, res) => {
  const { title, body, category = 'general', tags = [] } = req.body;

  if (!title?.trim() || !body?.trim()) {
    return res.status(400).json({ error: 'Title and body are required' });
  }

  const validCategories = ['general', 'help', 'linux', 'events', 'projects', 'resources'];
  const safeCategory = validCategories.includes(category?.toLowerCase())
    ? category.toLowerCase()
    : 'general';

  const cleanTags = Array.isArray(tags)
    ? tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean).slice(0, 5)
    : [];

  try {
    const post = await Post.create({
      author: req.user.id,
      title: title.trim(),
      body: body.trim(),
      category: safeCategory,
      tags: cleanTags,
    });

    const populated = await Post.findById(post._id).populate('author', 'username role avatar');

    return res.status(201).json(populated.toJSON());
  } catch (err) {
    console.error('[Create Post Error]', err);
    return res.status(500).json({ error: 'Failed to create post' });
  }
});

// @route   PUT /api/posts/:id
// @desc    Update a post (author or admin)
router.put('/:id', requireAuth, async (req, res) => {
  const { title, body, category, tags } = req.body;

  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to edit this post' });
    }

    if (title?.trim()) post.title = title.trim();
    if (body?.trim()) post.body = body.trim();
    if (category) post.category = category.toLowerCase();
    if (Array.isArray(tags)) {
      post.tags = tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean).slice(0, 5);
    }

    await post.save();
    const updated = await Post.findById(post._id).populate('author', 'username role avatar');
    return res.json(updated.toJSON());
  } catch (err) {
    console.error('[Update Post Error]', err);
    return res.status(500).json({ error: 'Failed to update post' });
  }
});

// @route   DELETE /api/posts/:id
// @desc    Delete a post (author or admin)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to delete this post' });
    }

    await Promise.all([
      Post.findByIdAndDelete(post._id),
      Comment.deleteMany({ post: post._id }),
      Vote.deleteMany({ post: post._id }),
    ]);

    return res.json({ message: 'Post and associated comments deleted successfully' });
  } catch (err) {
    console.error('[Delete Post Error]', err);
    return res.status(500).json({ error: 'Failed to delete post' });
  }
});

// @route   POST /api/posts/:id/vote
// @desc    Upvote / downvote a post (toggle off if same value clicked)
router.post('/:id/vote', requireAuth, async (req, res) => {
  const { value } = req.body;
  const numericValue = Number(value);

  if (![1, -1, 0].includes(numericValue)) {
    return res.status(400).json({ error: 'Vote value must be 1, -1, or 0' });
  }

  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const existingVote = await Vote.findOne({
      user: req.user.id,
      post: post._id,
    });

    let scoreDelta = 0;
    let newUserVote = 0;

    if (numericValue === 0 || (existingVote && existingVote.value === numericValue)) {
      if (existingVote) {
        scoreDelta = -existingVote.value;
        await Vote.findByIdAndDelete(existingVote._id);
      }
      newUserVote = 0;
    } else if (existingVote) {
      scoreDelta = numericValue - existingVote.value;
      existingVote.value = numericValue;
      await existingVote.save();
      newUserVote = numericValue;
    } else {
      scoreDelta = numericValue;
      await Vote.create({
        user: req.user.id,
        post: post._id,
        value: numericValue,
      });
      newUserVote = numericValue;
    }

    post.voteScore = (post.voteScore || 0) + scoreDelta;
    await post.save();

    return res.json({
      voteScore: post.voteScore,
      userVote: newUserVote,
    });
  } catch (err) {
    console.error('[Vote Post Error]', err);
    return res.status(500).json({ error: 'Failed to register vote' });
  }
});

// @route   POST /api/posts/:id/comments
// @desc    Add a comment (supports threaded parentComment)
router.post('/:id/comments', requireAuth, async (req, res) => {
  const { body, parentComment } = req.body;

  if (!body?.trim()) {
    return res.status(400).json({ error: 'Comment body is required' });
  }

  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.isLocked && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'This discussion has been locked by an administrator' });
    }

    let parentId = null;
    if (parentComment) {
      const parent = await Comment.findOne({ _id: parentComment, post: post._id });
      if (parent) {
        parentId = parent._id;
      }
    }

    const comment = await Comment.create({
      post: post._id,
      author: req.user.id,
      body: body.trim(),
      parentComment: parentId,
    });

    post.commentCount = (post.commentCount || 0) + 1;
    await post.save();

    const populated = await Comment.findById(comment._id).populate(
      'author',
      'username role avatar'
    );

    return res.status(201).json({
      id: populated._id.toString(),
      _id: populated._id.toString(),
      body: populated.body,
      parentComment: populated.parentComment ? populated.parentComment.toString() : null,
      createdAt: populated.createdAt,
      author: populated.author
        ? {
            id: populated.author._id.toString(),
            username: populated.author.username,
            role: populated.author.role,
            avatar: populated.author.avatar,
          }
        : { username: 'deleted', role: 'student' },
    });
  } catch (err) {
    console.error('[Add Comment Error]', err);
    return res.status(500).json({ error: 'Failed to add comment' });
  }
});

// @route   DELETE /api/posts/:id/comments/:commentId
// @desc    Delete a comment (author or admin)
router.delete('/:id/comments/:commentId', requireAuth, async (req, res) => {
  try {
    const comment = await Comment.findOne({
      _id: req.params.commentId,
      post: req.params.id,
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to delete this comment' });
    }

    const deletedCount = await Comment.deleteMany({
      $or: [{ _id: comment._id }, { parentComment: comment._id }],
    });

    await Post.findByIdAndUpdate(req.params.id, {
      $inc: { commentCount: -deletedCount.deletedCount },
    });

    return res.json({ message: 'Comment removed successfully' });
  } catch (err) {
    console.error('[Delete Comment Error]', err);
    return res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// @route   PUT /api/posts/:id/pin
// @desc    Pin / unpin a post (admin only)
router.put('/:id/pin', requireAuth, requireAdmin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    post.isPinned = !post.isPinned;
    await post.save();

    return res.json({ isPinned: post.isPinned, message: post.isPinned ? 'Post pinned' : 'Post unpinned' });
  } catch (err) {
    console.error('[Pin Post Error]', err);
    return res.status(500).json({ error: 'Failed to update pin status' });
  }
});

export default router;

