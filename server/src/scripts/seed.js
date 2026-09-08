import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Post } from '../models/Post.js';
import { Comment } from '../models/Comment.js';
import { Vote } from '../models/Vote.js';

async function seed() {
  console.log('[Seed] Connecting to MongoDB...');
  await connectDB();

  console.log('[Seed] Clearing existing collections...');
  await Promise.all([
    User.deleteMany({}),
    Post.deleteMany({}),
    Comment.deleteMany({}),
    Vote.deleteMany({}),
  ]);

  console.log('[Seed] Creating demo users...');
  const passwordHash = await User.hashPassword('glug1234');

  const admin = await User.create({
    username: 'admin',
    email: 'admin@glug.dev',
    passwordHash,
    role: 'admin',
    bio: 'GLUG Club Admin & Linux Enthusiast. Welcome to our open source portal!',
    skills: ['Linux Kernel', 'DevOps', 'Docker', 'C/C++', 'Rust'],
  });

  const studentAlex = await User.create({
    username: 'alex_c',
    email: 'alex@glug.dev',
    passwordHash,
    role: 'student',
    bio: '1st Year Computer Science student exploring open source and Arch Linux.',
    skills: ['Python', 'Bash', 'Git', 'Linux'],
  });

  const studentPriya = await User.create({
    username: 'priya_dev',
    email: 'priya@glug.dev',
    passwordHash,
    role: 'student',
    bio: 'Web dev & systems programming lover. Contributing to FOSS projects.',
    skills: ['React', 'Node.js', 'Go', 'Linux CLI'],
  });

  console.log('[Seed] Creating demo posts...');
  const post1 = await Post.create({
    author: admin._id,
    title: 'Welcome to GLUG! Getting Started Guide for First-Year Students',
    body: `Welcome to the GNU/Linux User Group! 🐧\n\nIf you are a first-year student or just starting your journey into Linux and open source, here are the first 3 steps to take:\n1. Open our in-browser Linux Terminal on the Home page to practice bash navigation.\n2. Try the online Compiler for your C / Python lab assignments.\n3. Check out the Resources section for recommended distros and tools.\n\nFeel free to ask any questions in the help category!`,
    category: 'general',
    tags: ['welcome', 'first-year', 'getting-started', 'linux'],
    voteScore: 12,
    commentCount: 2,
    isPinned: true,
  });

  const post2 = await Post.create({
    author: studentAlex._id,
    title: 'Dual-booting Ubuntu with Windows 11 — Safe Partitioning Tips?',
    body: `Hey everyone! I'm planning to dual boot Ubuntu 24.04 alongside Windows 11 on my laptop for our college programming labs. Should I disable BitLocker first? What swap space size do you recommend for 16GB RAM?`,
    category: 'help',
    tags: ['ubuntu', 'dual-boot', 'windows11', 'partitioning'],
    voteScore: 8,
    commentCount: 2,
    isPinned: false,
  });

  const post3 = await Post.create({
    author: studentPriya._id,
    title: 'Upcoming Workshop: Git & GitHub from Zero to Open Source Contributor',
    body: `Mark your calendars! We are hosting a hands-on session on Git workflows, resolving merge conflicts, branching strategies, and submitting your very first pull request on open-source repositories.\n\nDate: Saturday, 4:00 PM\nLocation: CS Lab 2 & Online Stream`,
    category: 'events',
    tags: ['workshop', 'git', 'github', 'opensource'],
    voteScore: 15,
    commentCount: 1,
    isPinned: true,
  });

  const post4 = await Post.create({
    author: admin._id,
    title: 'Top 10 CLI Tools Every Developer Should Know in 2026',
    body: `Ditch the slow GUI tools and supercharge your terminal workflow:\n- htop / btop: visual process monitor\n- ripgrep (rg): blazing fast grep replacement\n- fd: intuitive find alternative\n- tmux: terminal multiplexer\n- bat: cat with syntax highlighting and git integration\n\nWhat are your go-to terminal tools?`,
    category: 'linux',
    tags: ['cli', 'tools', 'bash', 'terminal', 'productivity'],
    voteScore: 18,
    commentCount: 0,
    isPinned: false,
  });

  const post5 = await Post.create({
    author: studentAlex._id,
    title: 'Building a simple shell in C — First Year Systems Project',
    body: `Just completed my first mini shell project implementing fork(), execvp(), and pipe handling! Learned a lot about POSIX system calls and file descriptors. Open to code review feedback!`,
    category: 'projects',
    tags: ['c-lang', 'posix', 'shell', 'systems'],
    voteScore: 9,
    commentCount: 1,
    isPinned: false,
  });

  console.log('[Seed] Creating demo comments...');
  const c1 = await Comment.create({
    post: post1._id,
    author: studentAlex._id,
    body: 'So excited to be here! The browser terminal is super convenient for practicing while on campus.',
  });

  await Comment.create({
    post: post1._id,
    author: admin._id,
    body: 'Glad you like it, Alex! Check out the nano editor inside the terminal as well.',
    parentComment: c1._id,
  });

  const c2 = await Comment.create({
    post: post2._id,
    author: admin._id,
    body: 'Definitely back up your BitLocker recovery key first before touching partition tables! With 16GB RAM, a 4GB-8GB swap file is plenty unless you use hibernation.',
  });

  await Comment.create({
    post: post2._id,
    author: studentPriya._id,
    body: '+1 to BitLocker key backup. Also make sure "Fast Startup" is disabled in Windows power settings so Linux can mount your drives cleanly.',
    parentComment: c2._id,
  });

  await Comment.create({
    post: post3._id,
    author: studentAlex._id,
    body: 'Will there be a recording for students who have lab exams during that slot?',
  });

  await Comment.create({
    post: post5._id,
    author: studentPriya._id,
    body: 'Awesome work! Handling SIGINT and zombie processes with waitpid() was the trickiest part when I built one. Share the repo link!',
  });

  console.log('[Seed] Creating initial votes...');
  await Vote.create({ user: admin._id, post: post3._id, value: 1 });
  await Vote.create({ user: studentAlex._id, post: post3._id, value: 1 });
  await Vote.create({ user: studentPriya._id, post: post1._id, value: 1 });

  console.log('[Seed] Successfully seeded database!');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('[Seed Error]', err);
  process.exit(1);
});

