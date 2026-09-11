import { Router } from 'express';
import mongoose from 'mongoose';
import { Post } from '../models/Post.js';
import { Comment } from '../models/Comment.js';
import { Vote } from '../models/Vote.js';
import { Bookmark } from '../models/Bookmark.js';
import { requireAuth, optionalAuth, requireAdmin } from '../middleware/auth.js';
import { calculateNextVoteScore } from '../utils/voteCalculator.js';

const router = Router();
const recentViews = new Map();

// @route   GET /api/posts
// @desc    Get list of posts with filtering, sorting, pagination, and user vote status
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 15));
    const skip = (page - 1) * limit;

    const { category, tag, sort = 'hot', search, tab } = req.query;

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

    if (tab === 'unanswered') {
      filter.commentCount = { $lte: 0 };
    } else if (tab === 'my-posts') {
      if (!req.user) {
        return res.json({
          posts: [],
          pagination: { total: 0, page, limit, totalPages: 1, hasMore: false },
        });
      }
      filter.author = req.user.id;
    } else if (tab === 'bookmarks') {
      if (!req.user) {
        return res.json({
          posts: [],
          pagination: { total: 0, page, limit, totalPages: 1, hasMore: false },
        });
      }
      const bookmarks = await Bookmark.find({ user: req.user.id }).select('post').lean();
      const bookmarkedPostIds = bookmarks.map((b) => b.post);
      filter._id = { $in: bookmarkedPostIds };
    }

    let sortCriteria = { isPinned: -1 };
    if (sort === 'new') {
      sortCriteria.createdAt = -1;
    } else if (sort === 'top') {
      sortCriteria.voteScore = -1;
      sortCriteria.createdAt = -1;
    } else {
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
    let userBookmarkSet = new Set();
    if (req.user && posts.length > 0) {
      const postIds = posts.map((p) => p._id);
      const [userVotes, userBookmarks] = await Promise.all([
        Vote.find({
          user: req.user.id,
          post: { $in: postIds },
        }).lean(),
        Bookmark.find({
          user: req.user.id,
          post: { $in: postIds },
        }).lean(),
      ]);

      userVotes.forEach((v) => {
        userVoteMap.set(v.post.toString(), v.value);
      });
      userBookmarks.forEach((b) => {
        userBookmarkSet.add(b.post.toString());
      });
    }

    const formattedPosts = posts.map((p) => ({
      id: p._id.toString(),
      _id: p._id.toString(),
      title: p.title,
      body: p.body,
      category: p.category,
      tags: p.tags || [],
      voteScore: Math.max(0, p.voteScore || 0),
      commentCount: p.commentCount || 0,
      views: p.views || 0,
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
      isBookmarked: userBookmarkSet.has(p._id.toString()),
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
    let isBookmarked = false;
    if (req.user) {
      const [vote, bookmark] = await Promise.all([
        Vote.findOne({ user: req.user.id, post: post._id }).lean(),
        Bookmark.findOne({ user: req.user.id, post: post._id }).lean(),
      ]);
      if (vote) userVote = vote.value;
      if (bookmark) isBookmarked = true;
    }

    const viewerKey = `${req.user?.id || req.ip || 'anon'}:${req.params.id}`;
    const now = Date.now();
    const lastView = recentViews.get(viewerKey) || 0;
    let currentViews = post.views || 0;

    if (now - lastView > 30000) {
      recentViews.set(viewerKey, now);
      await Post.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
      currentViews += 1;

      if (recentViews.size > 2000) {
        const cutoff = now - 60000;
        for (const [k, time] of recentViews.entries()) {
          if (time < cutoff) recentViews.delete(k);
        }
      }
    }

    const formattedPost = {
      id: post._id.toString(),
      _id: post._id.toString(),
      title: post.title,
      body: post.body,
      category: post.category,
      tags: post.tags || [],
      voteScore: Math.max(0, post.voteScore || 0),
      commentCount: post.commentCount || 0,
      views: currentViews,
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
      isBookmarked,
    };

    const formattedComments = comments.map((c) => {
      let commentUserVote = 0;
      if (req.user && Array.isArray(c.votes) && c.votes.length > 0) {
        const found = c.votes.find((v) => v.user?.toString() === req.user.id);
        if (found) commentUserVote = found.value;
      }
      return {
        id: c._id.toString(),
        _id: c._id.toString(),
        body: c.body,
        parentComment: c.parentComment ? c.parentComment.toString() : null,
        createdAt: c.createdAt,
        voteScore: Math.max(0, c.voteScore || 0),
        userVote: commentUserVote,
        author: c.author
          ? {
              id: c.author._id.toString(),
              username: c.author.username,
              role: c.author.role,
              avatar: c.author.avatar,
            }
          : { username: 'deleted', role: 'student' },
      };
    });

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
      Bookmark.deleteMany({ post: post._id }),
    ]);

    return res.json({ message: 'Post and associated comments deleted successfully' });
  } catch (err) {
    console.error('[Delete Post Error]', err);
    return res.status(500).json({ error: 'Failed to delete post' });
  }
});

router.post('/:id/bookmark', requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const existing = await Bookmark.findOne({
      user: req.user.id,
      post: post._id,
    });

    if (existing) {
      await Bookmark.deleteOne({ _id: existing._id });
      return res.json({ bookmarked: false, message: 'Bookmark removed' });
    } else {
      await Bookmark.create({
        user: req.user.id,
        post: post._id,
      });
      return res.json({ bookmarked: true, message: 'Saved to bookmarks' });
    }
  } catch (err) {
    console.error('[Bookmark Error]', err);
    return res.status(500).json({ error: 'Failed to update bookmark' });
  }
});

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

    let newUserVote = 0;

    if (numericValue === 0 || (existingVote && existingVote.value === numericValue)) {
      if (existingVote) {
        await Vote.deleteOne({ _id: existingVote._id });
      }
      newUserVote = 0;
    } else if (existingVote) {
      existingVote.value = numericValue;
      await existingVote.save();
      newUserVote = numericValue;
    } else {
      await Vote.create({
        user: req.user.id,
        post: post._id,
        value: numericValue,
      });
      newUserVote = numericValue;
    }

    const votes = await Vote.find({ post: post._id });
    const upvotes = votes.filter((v) => v.value === 1).length;
    const downvotes = votes.filter((v) => v.value === -1).length;
    const trueScore = Math.max(0, upvotes - downvotes);

    post.voteScore = trueScore;
    await post.save();

    return res.json({
      voteScore: trueScore,
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
    if (parentComment && mongoose.Types.ObjectId.isValid(parentComment)) {
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

async function getAllDescendantCommentIds(initialCommentId) {
  const idsToDelete = [initialCommentId.toString()];
  let currentParentIds = [initialCommentId];
  while (currentParentIds.length > 0) {
    const children = await Comment.find({ parentComment: { $in: currentParentIds } }).select('_id').lean();
    if (!children.length) break;
    const childIds = children.map((c) => c._id);
    for (const cid of childIds) {
      idsToDelete.push(cid.toString());
    }
    currentParentIds = childIds;
  }
  return idsToDelete;
}

router.delete('/:id/comments/:commentId', requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = await Comment.findOne({
      _id: req.params.commentId,
      post: post._id,
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const isPostAuthor = post.author.toString() === req.user.id;
    const isCommentAuthor = comment.author.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isPostAuthor && !isCommentAuthor && !isAdmin) {
      return res.status(403).json({ error: 'Unauthorized to delete this comment' });
    }

    const allIds = await getAllDescendantCommentIds(comment._id);
    await Comment.deleteMany({ _id: { $in: allIds } });

    const remainingCount = await Comment.countDocuments({ post: post._id });
    await Post.findByIdAndUpdate(post._id, { commentCount: remainingCount });

    return res.json({ message: 'Comment removed successfully', deletedCount: allIds.length, remainingCount });
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

const handleVoteComment = async (req, res) => {
  const { value } = req.body;
  const numericValue = Number(value);

  if (![1, -1, 0].includes(numericValue)) {
    return res.status(400).json({ error: 'Vote value must be 1, -1, or 0' });
  }

  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (!Array.isArray(comment.votes)) {
      comment.votes = [];
    }

    const voteIdx = comment.votes.findIndex((v) => v.user.toString() === req.user.id);
    const existingVote = voteIdx !== -1 ? comment.votes[voteIdx] : null;

    let newUserVote = 0;

    if (numericValue === 0 || (existingVote && existingVote.value === numericValue)) {
      if (existingVote) {
        comment.votes.splice(voteIdx, 1);
      }
      newUserVote = 0;
    } else if (existingVote) {
      existingVote.value = numericValue;
      newUserVote = numericValue;
    } else {
      comment.votes.push({ user: req.user.id, value: numericValue });
      newUserVote = numericValue;
    }

    const upvotes = comment.votes.filter((v) => v.value === 1).length;
    const downvotes = comment.votes.filter((v) => v.value === -1).length;
    const trueScore = Math.max(0, upvotes - downvotes);

    comment.voteScore = trueScore;
    await comment.save();

    return res.json({
      voteScore: trueScore,
      userVote: newUserVote,
    });
  } catch (err) {
    console.error('[Vote Comment Error]', err);
    return res.status(500).json({ error: 'Failed to register comment vote' });
  }
};

router.post('/:id/comments/:commentId/vote', requireAuth, handleVoteComment);
router.post('/comments/:commentId/vote', requireAuth, handleVoteComment);

export default router;

