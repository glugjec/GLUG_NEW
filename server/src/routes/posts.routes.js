import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/posts', async (req, res) => {
  const { category } = req.query;
  const values = [];
  let sql = `
    SELECT p.*, u.username, u.role AS author_role,
           COUNT(c.id) AS comment_count
    FROM posts p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN comments c ON c.post_id = p.id
  `;
  if (category) {
    values.push(category);
    sql += ' WHERE p.category = $1';
  }
  sql += ' GROUP BY p.id, u.id ORDER BY p.created_at DESC';
  try {
    const { rows } = await pool.query(sql, values);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/posts/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*, u.username, u.role AS author_role
       FROM posts p JOIN users u ON u.id = p.user_id
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Post not found' });
    const { rows: comments } = await pool.query(
      `SELECT c.*, u.username FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.post_id = $1 ORDER BY c.created_at ASC`,
      [req.params.id]
    );
    res.json({ post: rows[0], comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/posts', requireAuth, async (req, res) => {
  const { title, body, category = 'general' } = req.body;
  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required' });
  }
  try {
    const { rows } = await pool.query(
      'INSERT INTO posts (user_id, title, body, category) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, title, body, category]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/posts/:id/comments', requireAuth, async (req, res) => {
  const { body } = req.body;
  if (!body) return res.status(400).json({ error: 'Comment body is required' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO comments (post_id, user_id, body)
       SELECT $1, $2, $3 WHERE EXISTS (SELECT 1 FROM posts WHERE id = $1)
       RETURNING *`,
      [req.params.id, req.user.id, body]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Post not found' });
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;