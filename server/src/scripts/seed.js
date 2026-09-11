import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Post } from '../models/Post.js';
import { Comment } from '../models/Comment.js';
import { Vote } from '../models/Vote.js';
import { Bookmark } from '../models/Bookmark.js';

const CLOUDINARY_IMAGES = [
  'https://res.cloudinary.com/doyqt2baz/image/upload/v1789138512/glug/uploads/i1resoezbgwtyfsxp1tk.jpg',
  'https://res.cloudinary.com/doyqt2baz/image/upload/v1789138375/glug/uploads/qgxftapapespwx5zllue.jpg',
  'https://res.cloudinary.com/doyqt2baz/image/upload/v1789133464/glug/uploads/rtpts1vf0ohsbhrzpttz.jpg',
  'https://res.cloudinary.com/doyqt2baz/image/upload/v1789133221/glug/uploads/imdiz8tjxdywdczlqrl8.jpg',
  'https://res.cloudinary.com/doyqt2baz/image/upload/v1789133185/glug/uploads/cl54uzviks7brr30qdaq.jpg',
  'https://res.cloudinary.com/doyqt2baz/image/upload/v1789133087/glug/uploads/frcxvgkgo6jmgk9o2qcm.jpg',
];

const UNSPLASH_IMAGES = [
  'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1537432376769-00f5c244c8d8?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1618401471353-b98aedd04e11?w=1200&auto=format&fit=crop&q=80',
];

async function seed() {
  console.log('[Seed] Connecting to MongoDB...');
  await connectDB();

  console.log('[Seed] Checking existing users (users will NOT be modified or deleted)...');
  const allUsers = await User.find();

  if (!allUsers || allUsers.length === 0) {
    console.error('[Seed Error] No existing users found. Please create at least one user before running seed.');
    process.exit(1);
  }

  console.log(`[Seed] Found ${allUsers.length} user(s): ${allUsers.map((u) => u.username).join(', ')}`);

  const uAdmin1 = allUsers.find((u) => u.username === 'Kaushik_Ranjan') || allUsers.find((u) => u.role === 'admin') || allUsers[0];
  const uAdmin2 = allUsers.find((u) => u.username === 'glug_jec') || allUsers.find((u) => String(u._id) !== String(uAdmin1._id) && u.role === 'admin') || uAdmin1;
  const uAdmin3 = allUsers.find((u) => u.username === 'duttarittam2') || allUsers.find((u) => String(u._id) !== String(uAdmin1._id) && String(u._id) !== String(uAdmin2._id)) || uAdmin1;
  const uStudent = allUsers.find((u) => u.username === 'devroopverse') || allUsers.find((u) => u.role === 'student') || allUsers[allUsers.length - 1];

  console.log('[Seed] Clearing non-user collections (posts, comments, votes, bookmarks)...');
  await Promise.all([
    Post.deleteMany({}),
    Comment.deleteMany({}),
    Vote.deleteMany({}),
    Bookmark.deleteMany({}),
  ]);

  console.log('[Seed] Creating demo discussions across all categories with images...');

  const postZero = await Post.create({
    author: uStudent._id,
    title: 'Zero-Vote Discussion: Test Disabled Downvote Rule',
    body: `This discussion is initialized with exactly **0 votes** to test the new voting protection rule.\n\n### What to test:\n- The downvote arrow should be visually disabled with a tooltip *"Cannot downvote when score is 0"*.\n- Clicking downvote should not decrease the score below 0 or create negative vote debt.\n- Clicking upvote should cleanly increase the score to **1**.`,
    category: 'general',
    tags: ['testing', 'voting-rules', 'zero-score'],
    voteScore: 0,
    commentCount: 0,
    isPinned: false,
    isLocked: false,
    views: 18,
  });

  const postOne = await Post.create({
    author: uStudent._id,
    title: 'Single-Vote Discussion: Test Undo Upvote on Downvote',
    body: `This discussion is initialized with **1 vote** placed by **${uAdmin1.username}**.\n\n### What to test:\n- When logged in as ${uAdmin1.username}, the upvote arrow is active (blue).\n- Clicking the downvote button should subtract 1 to return the score to **0** and clear your upvote without erroring.\n- Re-clicking upvote should return the count back to **1**.\n\n<img src="${CLOUDINARY_IMAGES[0]}" alt="test setup" />`,
    category: 'help',
    tags: ['testing', 'undo-upvote', 'one-vote'],
    voteScore: 1,
    commentCount: 0,
    isPinned: false,
    isLocked: false,
    views: 35,
  });

  await Vote.create({
    user: uAdmin1._id,
    post: postOne._id,
    value: 1,
  });

  const postCascade = await Post.create({
    author: uStudent._id,
    title: 'Deeply Threaded Neovim & Fedora Setup: Cascade Deletion & Custom Modal Demo',
    body: `Showcasing my current dotfiles and development environment running on **Fedora 41 Workstation** with Hyprland and Neovim!\n\n<img src="${UNSPLASH_IMAGES[0]}" alt="developer terminal" />\n\n### Specs & Workflow:\n- **Editor**: Neovim 0.10 with custom Lua config using lazy.nvim\n- **Shell**: zsh with starship prompt and zoxide\n- **Multiplexer**: tmux with vim-tmux-navigator\n\nFeel free to ask questions about the config or suggest plugins!`,
    category: 'linux',
    tags: ['linux', 'neovim', 'fedora', 'dotfiles', 'hyprland', 'customization'],
    voteScore: 4,
    commentCount: 6,
    isPinned: false,
    isLocked: false,
    views: 210,
  });

  await Vote.create({ user: uStudent._id, post: postCascade._id, value: 1 });
  await Vote.create({ user: uAdmin1._id, post: postCascade._id, value: 1 });
  await Vote.create({ user: uAdmin2._id, post: postCascade._id, value: 1 });
  await Vote.create({ user: uAdmin3._id, post: postCascade._id, value: 1 });

  const postPinned = await Post.create({
    author: uAdmin2._id,
    title: 'GLUG Community Guidelines, Code of Conduct & Getting Started 2026',
    body: `Welcome to the official GNU/Linux User Group portal! 🐧\n\n<img src="${UNSPLASH_IMAGES[3]}" alt="community setup" />\n\n### Club Rules & Culture:\n1. **Be welcoming to beginners**: Everyone started without knowing what \`chmod\` or \`grep\` does.\n2. **Format code properly**: Use markdown code blocks with syntax highlighting.\n3. **Search before asking**: Check existing discussions in the Help category.\n4. **Contribute back**: Share your project repositories, fixes, and lab solutions.`,
    category: 'general',
    tags: ['announcement', 'guidelines', 'community', 'first-year', 'welcome'],
    voteScore: 8,
    commentCount: 2,
    isPinned: true,
    isLocked: false,
    views: 450,
  });

  await Vote.create({ user: uAdmin1._id, post: postPinned._id, value: 1 });
  await Vote.create({ user: uAdmin2._id, post: postPinned._id, value: 1 });
  await Vote.create({ user: uAdmin3._id, post: postPinned._id, value: 1 });
  await Vote.create({ user: uStudent._id, post: postPinned._id, value: 1 });

  const postDualBoot = await Post.create({
    author: uStudent._id,
    title: 'Dual-booting Ubuntu 24.04 with Windows 11 — Safe Partitioning & BitLocker Guide',
    body: `A comprehensive checklist for students planning to dual-boot Linux for university labs without breaking Windows:\n\n<img src="${CLOUDINARY_IMAGES[1]}" alt="disk partitioning" />\n\n### Essential Checklist:\n- **Backup BitLocker Recovery Key**: Save to USB or print before shrinking C: drive.\n- **Disable Fast Startup**: Windows Power Options -> Choose power buttons -> Uncheck fast startup.\n- **EFI System Partition**: Leave Windows EFI intact; mount it as \`/boot/efi\`.\n- **Secure Boot**: Ubuntu 24.04 supports Secure Boot via Microsoft signed shim.`,
    category: 'help',
    tags: ['ubuntu', 'dual-boot', 'windows11', 'partitioning', 'uefi', 'bitlocker'],
    voteScore: 5,
    commentCount: 4,
    isPinned: false,
    isLocked: false,
    views: 180,
  });

  await Vote.create({ user: uAdmin1._id, post: postDualBoot._id, value: 1 });
  await Vote.create({ user: uStudent._id, post: postDualBoot._id, value: 1 });

  const postLocked = await Post.create({
    author: uAdmin1._id,
    title: 'Archived: Winter Open Source Hackathon 2025 Winning Submissions',
    body: `Submissions for the Winter FOSS Hackathon are officially closed.\n\n<img src="${UNSPLASH_IMAGES[2]}" alt="hackathon code" />\n\nCongratulations to the winning teams! Repositories have been added to the GLUG club GitHub organization.\n\n*(This thread is locked to further comments).*`,
    category: 'events',
    tags: ['hackathon', 'archive', 'events', 'opensource', 'awards'],
    voteScore: 6,
    commentCount: 0,
    isPinned: false,
    isLocked: true,
    views: 290,
  });

  await Vote.create({ user: uAdmin1._id, post: postLocked._id, value: 1 });
  await Vote.create({ user: uAdmin2._id, post: postLocked._id, value: 1 });

  const postCliTools = await Post.create({
    author: uAdmin1._id,
    title: 'Modern Linux Command-Line Tools That Replace Legacy Coreutils',
    body: `Modern Rust and Go based CLI tools that drastically speed up everyday terminal work:\n\n<img src="${UNSPLASH_IMAGES[1]}" alt="code editor" />\n\n- \`bat\` instead of \`cat\`: line numbers and syntax highlighting\n- \`eza\` / \`exa\` instead of \`ls\`: git status, colors, tree view\n- \`ripgrep (rg)\` instead of \`grep\`: blazing fast multi-core search\n- \`fd\` instead of \`find\`: intuitive regex syntax by default\n- \`duf\` instead of \`df\`: clear disk free tables\n- \`procs\` instead of \`ps\`: searchable colored process list`,
    category: 'linux',
    tags: ['linux', 'cli', 'tools', 'bash', 'productivity', 'rust'],
    voteScore: 7,
    commentCount: 3,
    isPinned: false,
    isLocked: false,
    views: 340,
  });

  await Vote.create({ user: uAdmin1._id, post: postCliTools._id, value: 1 });
  await Vote.create({ user: uAdmin2._id, post: postCliTools._id, value: 1 });
  await Vote.create({ user: uStudent._id, post: postCliTools._id, value: 1 });

  const postWasm = await Post.create({
    author: uAdmin3._id,
    title: 'Building an In-Browser Linux Terminal Emulator with WebAssembly and Xterm.js',
    body: `Excited to share the architecture behind our in-browser Linux Terminal component on the GLUG homepage!\n\n<img src="${CLOUDINARY_IMAGES[2]}" alt="terminal emulator" />\n\n### Tech Stack:\n- **Frontend Canvas**: xterm.js with fit addon\n- **Virtual Filesystem**: In-memory Unix directory tree with persistent local state\n- **Command Interpreter**: Modular parser handling pipes, redirections, and custom shell builtins\n\nCheck out the Terminal tab on the navbar to try it out!`,
    category: 'projects',
    tags: ['wasm', 'terminal', 'xterm', 'webdev', 'emulator', 'javascript'],
    voteScore: 9,
    commentCount: 3,
    isPinned: false,
    isLocked: false,
    views: 410,
  });

  await Vote.create({ user: uAdmin1._id, post: postWasm._id, value: 1 });
  await Vote.create({ user: uAdmin3._id, post: postWasm._id, value: 1 });
  await Vote.create({ user: uStudent._id, post: postWasm._id, value: 1 });

  const postWorkshop = await Post.create({
    author: uAdmin2._id,
    title: 'Upcoming Hands-on Workshop: Git & GitHub Workflow from Zero to First Pull Request',
    body: `Mark your calendars for our next hands-on technical workshop!\n\n<img src="${UNSPLASH_IMAGES[5]}" alt="git workflow" />\n\n### Agenda:\n1. Git architecture: working directory, staging index, and commit history\n2. Branching strategies, rebase vs merge\n3. Resolving merge conflicts cleanly\n4. Forking, creating pull requests, and code review etiquette\n\n**Date**: Saturday, 4:00 PM | **Venue**: CS Department Lab 2 & Online Stream`,
    category: 'events',
    tags: ['workshop', 'git', 'github', 'collaboration', 'events'],
    voteScore: 5,
    commentCount: 2,
    isPinned: false,
    isLocked: false,
    views: 195,
  });

  await Vote.create({ user: uAdmin1._id, post: postWorkshop._id, value: 1 });
  await Vote.create({ user: uAdmin2._id, post: postWorkshop._id, value: 1 });

  const postResources = await Post.create({
    author: uAdmin1._id,
    title: 'Curated Linux Sysadmin & DevOps Learning Roadmap for 2026',
    body: `A structured learning roadmap for college students interested in systems engineering, cloud infrastructure, and DevOps:\n\n<img src="${UNSPLASH_IMAGES[4]}" alt="datacenter servers" />\n\n### Phase 1: Linux Fundamentals\n- Permissions (\`chmod\`, \`chown\`, \`umask\`)\n- Process management (\`systemd\`, signals, \`kill\`, \`nice\`)\n- Networking basics (\`ip\`, \`ss\`, \`curl\`, DNS, firewalls with \`ufw\`)\n\n### Phase 2: Containers & Orchestration\n- Docker containerization and multi-stage builds\n- Docker compose for local multi-service development\n- Introduction to Kubernetes pods and deployments`,
    category: 'resources',
    tags: ['resources', 'roadmap', 'sysadmin', 'devops', 'docker', 'kubernetes'],
    voteScore: 8,
    commentCount: 1,
    isPinned: false,
    isLocked: false,
    views: 260,
  });

  await Vote.create({ user: uAdmin1._id, post: postResources._id, value: 1 });
  await Vote.create({ user: uStudent._id, post: postResources._id, value: 1 });

  console.log('[Seed] Creating threaded comments and nested reply chains...');

  const cNeovimRoot = await Comment.create({
    post: postCascade._id,
    author: uStudent._id,
    body: `<p>Here is a closer look at my custom statusline configuration in Lua:</p><img src="${CLOUDINARY_IMAGES[3]}" alt="neovim statusline" /><p>It displays the active LSP client, git diff count, and current treesitter node.</p>`,
    voteScore: 2,
    votes: [
      { user: uStudent._id, value: 1 },
      { user: uAdmin1._id, value: 1 },
    ],
  });

  const cReplyLevel1 = await Comment.create({
    post: postCascade._id,
    author: uAdmin1._id,
    parentComment: cNeovimRoot._id,
    body: `<p>That statusline is super clean! Which font and terminal emulator are you running this on?</p>`,
    voteScore: 1,
    votes: [{ user: uAdmin1._id, value: 1 }],
  });

  const cReplyLevel2 = await Comment.create({
    post: postCascade._id,
    author: uStudent._id,
    parentComment: cReplyLevel1._id,
    body: `<p>Running on <strong>Kitty</strong> with <strong>JetBrains Mono Nerd Font</strong>! The ligatures and glyph rendering are top notch.</p>`,
    voteScore: 1,
    votes: [{ user: uStudent._id, value: 1 }],
  });

  await Comment.create({
    post: postCascade._id,
    author: uAdmin3._id,
    parentComment: cReplyLevel2._id,
    body: `<p>Can confirm! Kitty with GPU acceleration handles large files much faster than Alacritty on Wayland.</p>`,
    voteScore: 1,
    votes: [{ user: uAdmin3._id, value: 1 }],
  });

  await Comment.create({
    post: postCascade._id,
    author: uAdmin2._id,
    parentComment: cNeovimRoot._id,
    body: `<p>Could you post your dotfiles GitHub repo link so first-year students can reference it?</p>`,
    voteScore: 0,
    votes: [],
  });

  await Comment.create({
    post: postCascade._id,
    author: uAdmin1._id,
    body: `<p>Great work on this setup. We should feature this in the upcoming terminal productivity workshop!</p>`,
    voteScore: 1,
    votes: [{ user: uAdmin1._id, value: 1 }],
  });

  const cDualBoot1 = await Comment.create({
    post: postDualBoot._id,
    author: uAdmin1._id,
    body: `<p>Crucial tip: Make sure you create the bootable USB using <strong>Ventoy</strong> or <strong>Rufus in DD mode</strong> so the ISO partitions are recognized properly by UEFI.</p>`,
    voteScore: 2,
    votes: [
      { user: uAdmin1._id, value: 1 },
      { user: uStudent._id, value: 1 },
    ],
  });

  const cDualBootReply = await Comment.create({
    post: postDualBoot._id,
    author: uStudent._id,
    parentComment: cDualBoot1._id,
    body: `<p>Big +1 for Ventoy! Just drag-and-drop multiple ISOs without needing to reformat every time.</p>`,
    voteScore: 1,
    votes: [{ user: uStudent._id, value: 1 }],
  });

  await Comment.create({
    post: postDualBoot._id,
    author: uAdmin3._id,
    parentComment: cDualBootReply._id,
    body: `<p>Also remember to turn off Intel RST (VMD) in BIOS if the installer fails to detect your NVMe SSD.</p>`,
    voteScore: 1,
    votes: [{ user: uAdmin3._id, value: 1 }],
  });

  await Comment.create({
    post: postDualBoot._id,
    author: uAdmin2._id,
    body: `<p>Bookmarking this guide to share with juniors during the Linux Install Fest next month.</p>`,
    voteScore: 1,
    votes: [{ user: uAdmin2._id, value: 1 }],
  });

  await Comment.create({
    post: postPinned._id,
    author: uStudent._id,
    body: `<p>Excited to participate in the upcoming events and workshops this semester! 🙌</p>`,
    voteScore: 1,
    votes: [{ user: uStudent._id, value: 1 }],
  });

  await Comment.create({
    post: postPinned._id,
    author: uAdmin1._id,
    body: `<p>Welcome everyone! Feel free to reach out to club coordinators anytime.</p>`,
    voteScore: 1,
    votes: [{ user: uAdmin1._id, value: 1 }],
  });

  const cCliRoot = await Comment.create({
    post: postCliTools._id,
    author: uStudent._id,
    body: `<p>I set up shell aliases so <code>ls</code> maps to <code>eza --icons</code> and <code>cat</code> maps to <code>bat -p</code>. Complete game changer!</p>`,
    voteScore: 2,
    votes: [
      { user: uStudent._id, value: 1 },
      { user: uAdmin1._id, value: 1 },
    ],
  });

  await Comment.create({
    post: postCliTools._id,
    author: uAdmin1._id,
    parentComment: cCliRoot._id,
    body: `<p>Try adding <code>fzf</code> to your toolkit as well for fuzzy reverse command history search via Ctrl+R.</p>`,
    voteScore: 1,
    votes: [{ user: uAdmin1._id, value: 1 }],
  });

  await Comment.create({
    post: postCliTools._id,
    author: uAdmin2._id,
    body: `<p><code>btop</code> is so gorgeous with responsive graphs. Here is how it looks on a multi-core machine:</p><img src="${CLOUDINARY_IMAGES[4]}" alt="btop monitor" />`,
    voteScore: 1,
    votes: [{ user: uAdmin2._id, value: 1 }],
  });

  const cWasmRoot = await Comment.create({
    post: postWasm._id,
    author: uStudent._id,
    body: `<p>The terminal feels so fast! Are you compiling C programs directly in-browser or routing execution through a sandboxed engine?</p>`,
    voteScore: 1,
    votes: [{ user: uStudent._id, value: 1 }],
  });

  await Comment.create({
    post: postWasm._id,
    author: uAdmin3._id,
    parentComment: cWasmRoot._id,
    body: `<p>We route compile and run requests through a local Piston execution engine sandbox with memory and CPU cgroups limits!</p>`,
    voteScore: 1,
    votes: [{ user: uAdmin3._id, value: 1 }],
  });

  await Comment.create({
    post: postWasm._id,
    author: uAdmin1._id,
    body: `<p>Great work on the vim and nano terminal editor integrations too.</p>`,
    voteScore: 1,
    votes: [{ user: uAdmin1._id, value: 1 }],
  });

  await Comment.create({
    post: postWorkshop._id,
    author: uStudent._id,
    body: `<p>Will there be a recording uploaded to the portal for students who have lab sessions during that slot?</p>`,
    voteScore: 1,
    votes: [{ user: uStudent._id, value: 1 }],
  });

  await Comment.create({
    post: postWorkshop._id,
    author: uAdmin2._id,
    body: `<p>Yes! We will record the session and post the slides and reference repository links under the Resources section.</p>`,
    voteScore: 1,
    votes: [{ user: uAdmin2._id, value: 1 }],
  });

  await Comment.create({
    post: postResources._id,
    author: uStudent._id,
    body: `<p>This roadmap is exactly what I was looking for. Starting with Docker containerization this weekend.</p>`,
    voteScore: 1,
    votes: [{ user: uStudent._id, value: 1 }],
  });

  console.log('[Seed] Seeding sample bookmarks...');
  await Bookmark.create({ user: uAdmin1._id, post: postCascade._id });
  await Bookmark.create({ user: uAdmin1._id, post: postCliTools._id });
  await Bookmark.create({ user: uStudent._id, post: postResources._id });
  await Bookmark.create({ user: uStudent._id, post: postDualBoot._id });

  console.log('[Seed] Synchronizing commentCount on all posts...');
  const allPosts = await Post.find();
  for (const p of allPosts) {
    const count = await Comment.countDocuments({ post: p._id });
    p.commentCount = count;
    await p.save();
  }

  console.log('[Seed] ========================================');
  console.log('[Seed] Database successfully seeded with rich demo data!');
  console.log(`[Seed] Posts: ${allPosts.length}`);
  console.log(`[Seed] Comments: ${await Comment.countDocuments()}`);
  console.log(`[Seed] Votes: ${await Vote.countDocuments()}`);
  console.log(`[Seed] Bookmarks: ${await Bookmark.countDocuments()}`);
  console.log(`[Seed] Users preserved: ${allUsers.length} (${allUsers.map((u) => u.username).join(', ')})`);
  console.log('[Seed] ========================================');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('[Seed Error]', err);
  process.exit(1);
});
