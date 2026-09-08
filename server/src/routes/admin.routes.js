import { Router } from "express";
import { User } from "../models/User.js";
import { Post } from "../models/Post.js";
import { Comment } from "../models/Comment.js";
import { Vote } from "../models/Vote.js";
import { Resource } from "../models/Resource.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// Protect all admin routes
router.use(requireAuth, requireAdmin);

const PROTECTED_ADMIN_EMAILS = ["glug.jec@gmail.com", "admin@glug.dev"];

// @route   GET /api/admin/stats
// @desc    Get platform-wide metrics
router.get("/stats", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalPosts,
      totalComments,
      totalResources,
      adminCount,
      todayPosts,
    ] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Comment.countDocuments(),
      Resource.countDocuments(),
      User.countDocuments({ role: "admin" }),
      Post.countDocuments({ createdAt: { $gte: today } }),
    ]);

    return res.json({
      totalUsers,
      totalPosts,
      totalComments,
      totalResources,
      adminCount,
      todayPosts,
    });
  } catch (err) {
    console.error("[Admin Stats Error]", err);
    return res.status(500).json({ error: "Failed to load dashboard metrics" });
  }
});

// @route   GET /api/admin/users
// @desc    List all registered users with search and filtering
router.get("/users", async (req, res) => {
  try {
    const { q, role, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (role && ["student", "admin"].includes(role)) {
      filter.role = role;
    }

    if (q) {
      filter.$or = [
        { username: { $regex: q.trim(), $options: "i" } },
        { email: { $regex: q.trim(), $options: "i" } },
      ];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-passwordHash")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      User.countDocuments(filter),
    ]);

    // Aggregate counts for each user
    const userIds = users.map((u) => u._id);
    const [postCounts, commentCounts] = await Promise.all([
      Post.aggregate([
        { $match: { author: { $in: userIds } } },
        { $group: { _id: "$author", count: { $sum: 1 } } },
      ]),
      Comment.aggregate([
        { $match: { author: { $in: userIds } } },
        { $group: { _id: "$author", count: { $sum: 1 } } },
      ]),
    ]);

    const postMap = new Map(postCounts.map((p) => [p._id.toString(), p.count]));
    const commentMap = new Map(commentCounts.map((c) => [c._id.toString(), c.count]));

    const formattedUsers = users.map((u) => ({
      id: u._id.toString(),
      username: u.username,
      email: u.email,
      role: u.role,
      avatar: u.avatar || "",
      createdAt: u.createdAt,
      stats: {
        posts: postMap.get(u._id.toString()) || 0,
        comments: commentMap.get(u._id.toString()) || 0,
      },
      isProtected: PROTECTED_ADMIN_EMAILS.includes(u.email),
    }));

    return res.json({
      users: formattedUsers,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10)),
    });
  } catch (err) {
    console.error("[Admin Get Users Error]", err);
    return res.status(500).json({ error: "Failed to fetch users" });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Change user role (student / admin)
router.put("/users/:id/role", async (req, res) => {
  const { role } = req.body;

  if (!["student", "admin"].includes(role)) {
    return res.status(400).json({ error: "Role must be either student or admin" });
  }

  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Safety checks: Cannot demote protected admin
    if (PROTECTED_ADMIN_EMAILS.includes(targetUser.email) && role !== "admin") {
      return res.status(403).json({ error: "Cannot demote primary administrator" });
    }

    // Cannot demote yourself
    if (targetUser._id.toString() === req.user.id && role !== "admin") {
      return res.status(400).json({ error: "Cannot remove your own admin privileges" });
    }

    targetUser.role = role;
    await targetUser.save();

    return res.json({
      success: true,
      id: targetUser._id.toString(),
      username: targetUser.username,
      role: targetUser.role,
    });
  } catch (err) {
    console.error("[Admin Update Role Error]", err);
    return res.status(500).json({ error: "Failed to update user role" });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user account and associated content
router.delete("/users/:id", async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (PROTECTED_ADMIN_EMAILS.includes(targetUser.email)) {
      return res.status(403).json({ error: "Cannot delete primary administrator" });
    }

    if (targetUser._id.toString() === req.user.id) {
      return res.status(400).json({ error: "Cannot delete your own account from admin dashboard" });
    }

    // Cascade delete user posts, comments, and votes
    const userPosts = await Post.find({ author: targetUser._id }).select("_id");
    const postIds = userPosts.map((p) => p._id);

    await Promise.all([
      Comment.deleteMany({ $or: [{ author: targetUser._id }, { post: { $in: postIds } }] }),
      Vote.deleteMany({ $or: [{ user: targetUser._id }, { post: { $in: postIds } }] }),
      Post.deleteMany({ author: targetUser._id }),
      User.findByIdAndDelete(targetUser._id),
    ]);

    return res.json({ success: true, message: `User @${targetUser.username} and their content deleted` });
  } catch (err) {
    console.error("[Admin Delete User Error]", err);
    return res.status(500).json({ error: "Failed to delete user" });
  }
});

// @route   GET /api/admin/posts
// @desc    List posts for moderation
router.get("/posts", async (req, res) => {
  try {
    const { q, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (q) {
      filter.$or = [
        { title: { $regex: q.trim(), $options: "i" } },
        { body: { $regex: q.trim(), $options: "i" } },
      ];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate("author", "username email role avatar")
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      Post.countDocuments(filter),
    ]);

    return res.json({
      posts: posts.map((p) => ({
        id: p._id.toString(),
        title: p.title,
        body: p.body,
        category: p.category,
        tags: p.tags || [],
        voteScore: p.voteScore || 0,
        commentCount: p.commentCount || 0,
        isPinned: Boolean(p.isPinned),
        isLocked: Boolean(p.isLocked),
        author: p.author
          ? {
              id: p.author._id.toString(),
              username: p.author.username,
              email: p.author.email,
              role: p.author.role,
            }
          : { username: "[deleted]", role: "student" },
        createdAt: p.createdAt,
      })),
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10)),
    });
  } catch (err) {
    console.error("[Admin Get Posts Error]", err);
    return res.status(500).json({ error: "Failed to fetch posts for moderation" });
  }
});

// @route   PUT /api/admin/posts/:id/pin
// @desc    Toggle pin status of a post
router.put("/posts/:id/pin", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    post.isPinned = !post.isPinned;
    await post.save();

    return res.json({ success: true, isPinned: post.isPinned });
  } catch (err) {
    console.error("[Admin Pin Post Error]", err);
    return res.status(500).json({ error: "Failed to toggle pin status" });
  }
});

// @route   PUT /api/admin/posts/:id/lock
// @desc    Toggle lock status of a post (prevents new comments)
router.put("/posts/:id/lock", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    post.isLocked = !post.isLocked;
    await post.save();

    return res.json({ success: true, isLocked: post.isLocked });
  } catch (err) {
    console.error("[Admin Lock Post Error]", err);
    return res.status(500).json({ error: "Failed to toggle lock status" });
  }
});

// @route   DELETE /api/admin/posts/:id
// @desc    Delete post, its comments and votes
router.delete("/posts/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    await Promise.all([
      Comment.deleteMany({ post: post._id }),
      Vote.deleteMany({ post: post._id }),
      Post.findByIdAndDelete(post._id),
    ]);

    return res.json({ success: true, message: "Discussion deleted successfully" });
  } catch (err) {
    console.error("[Admin Delete Post Error]", err);
    return res.status(500).json({ error: "Failed to delete post" });
  }
});

// @route   DELETE /api/admin/comments/:id
// @desc    Delete a specific comment
router.delete("/comments/:id", async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const postId = comment.post;
    await Comment.findByIdAndDelete(comment._id);

    // Decrement post comment count
    await Post.findByIdAndUpdate(postId, { $inc: { commentCount: -1 } });

    return res.json({ success: true, message: "Comment deleted successfully" });
  } catch (err) {
    console.error("[Admin Delete Comment Error]", err);
    return res.status(500).json({ error: "Failed to delete comment" });
  }
});

export default router;
