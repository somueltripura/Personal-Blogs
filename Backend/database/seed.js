require('dotenv').config();
const path = require('path');

// Initialize database (runs schema)
const { db, initDatabase } = require('../config/database');
initDatabase();

const UserModel = require('../models/User');
const CategoryModel = require('../models/Category');

console.log('\n🌱 Seeding database...\n');

// ============================================================
// 1. Create Admin User
// ============================================================
const adminEmail = process.env.ADMIN_EMAIL || 'admin@somuelworld.com';
const existingAdmin = UserModel.findByEmail(adminEmail);

if (existingAdmin) {
  console.log('  ✓ Admin user already exists:', adminEmail);
} else {
  UserModel.create({
    username: process.env.ADMIN_USERNAME || 'admin',
    email: adminEmail,
    password: process.env.ADMIN_PASSWORD || 'ChangeMeNow2025!',
  });
  console.log('  ✓ Admin user created:', adminEmail);
  console.log('  ⚠  Please change the default password after first login!');
}

// ============================================================
// 2. Create Categories
// ============================================================
const categories = [
  { name: 'Programming', slug: 'programming', description: 'Thoughts on writing clean, maintainable code.', icon: 'code-2' },
  { name: 'English Learning', slug: 'english-learning', description: 'Mastering English through reading and writing.', icon: 'book-open' },
  { name: 'Personal Growth', slug: 'personal-growth', description: 'Habits, mindset, and intentional living.', icon: 'sprout' },
  { name: 'Stories & Essays', slug: 'stories-essays', description: 'Creative writing and personal narratives.', icon: 'pen-tool' },
  { name: 'Thoughts', slug: 'thoughts', description: 'Reflections on life, solitude, and meaning.', icon: 'lightbulb' },
];

for (const cat of categories) {
  const existing = CategoryModel.findBySlug(cat.slug);
  if (existing) {
    console.log(`  ✓ Category exists: ${cat.name}`);
  } else {
    CategoryModel.create(cat);
    console.log(`  ✓ Category created: ${cat.name}`);
  }
}

// ============================================================
// 3. Create sample articles (optional)
// ============================================================
const articleCount = db.prepare('SELECT COUNT(*) as c FROM articles').get().c;
if (articleCount === 0) {
  const sampleArticles = [
    {
      title: 'The Quiet Art of Writing Clean Code That Outlives You',
      excerpt: 'Why the best code reads like prose, and what we lose when we optimize only for machines.',
      content: `<p>There's a quote I keep coming back to: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand."</p><p>Martin Fowler said that years ago, and it's never been more relevant. In a world obsessed with frameworks, metrics, and shipping speed, we've started treating code as something machines consume. But code is primarily a human artifact.</p><h2>Readability Is Kindness</h2><p>When you write clean code, you're being kind to the next person who reads it — and that next person is often you, six months later, staring at your own work like a stranger.</p><p>Here's what I've learned after years of writing code for humans:</p><ul><li><strong>Name things what they are.</strong> Not what they do, not where they are — what they <em>are</em>.</li><li><strong>Keep functions small.</strong> If you can't explain what a function does in one sentence, it's doing too much.</li><li><strong>Delete code aggressively.</strong> The best line of code is the one you never had to write.</li></ul><p>Clean code isn't about perfection. It's about respect — for your craft, your team, and your future self.</p>`,
      categoryId: 1,
      status: 'published',
      featured: true,
      metaTitle: 'The Quiet Art of Writing Clean Code',
      metaDescription: 'Why the best code reads like prose, and what we lose when we optimize only for machines.',
      tags: ['programming', 'clean-code', 'craftsmanship'],
    },
    {
      title: 'Learning English Through Literature, Not Textbooks',
      excerpt: 'How reading Hemingway taught me more grammar than any course ever could.',
      content: `<p>I spent years in English classrooms, memorizing rules that felt abstract and lifeless. Present perfect continuous. Third conditional. Subjunctive mood. I could recite them, but I couldn't <em>feel</em> them.</p><p>Then I picked up a Hemingway novel. And everything changed.</p><h2>The Grammar of Stories</h2><p>Literature doesn't teach grammar explicitly — it <em>embodies</em> it. When you read "He had been walking for hours," you don't think about past perfect continuous tense. You feel the exhaustion. The grammar becomes invisible, which is exactly the point.</p><h2>My Approach</h2><p>Here's the method that worked for me:</p><ol><li><strong>Read widely.</strong> Not just one genre. Novels, essays, journalism, poetry. Each form teaches different rhythms.</li><li><strong>Copy passages by hand.</strong> This sounds old-fashioned, but writing someone else's sentences teaches your hand what good sentences feel like.</li><li><strong>Write every day.</strong> Even 100 words. The goal isn't perfection — it's practice.</li><li><strong>Read aloud.</strong> Your ear catches what your eye misses. If a sentence sounds awkward spoken, it's awkward written.</li></ol><p>Textbooks give you rules. Literature gives you instincts. And instincts are what make you fluent.</p>`,
      categoryId: 2,
      status: 'published',
      featured: true,
      tags: ['english', 'learning', 'literature', 'language'],
    },
    {
      title: 'On Solitude and the Courage to Sit With Yourself',
      excerpt: 'In a world that demands noise, choosing silence is the most rebellious act.',
      content: `<p>I used to fill every silent moment with something — music, podcasts, scrolling, anything to avoid the emptiness. I thought I was being productive. I was actually being afraid.</p><p>Afraid of what I might hear when the noise stopped.</p><h2>The First Ten Minutes</h2><p>The hardest part of sitting alone isn't the sitting — it's the first ten minutes. That's when your mind, accustomed to constant stimulation, panics. It throws thoughts at you like a child throwing toys: anxieties, regrets, random song lyrics, grocery lists.</p><p>Most people interpret this chaos as evidence that solitude is bad for them. But it's actually the opposite. It's evidence that you've been avoiding yourself.</p><h2>What Comes After</h2><p>If you stay — if you just sit there, without your phone, without a book, without a plan — something shifts. Around minute fifteen, the noise settles. And what's left is quieter, truer. Not comfortable, but real.</p><p>That's where the thinking happens. The real kind. Not problem-solving or planning, but understanding.</p><p>Solitude isn't loneliness. It's the most generous thing you can do for yourself.</p>`,
      categoryId: 5,
      status: 'published',
      featured: true,
      tags: ['solitude', 'mindfulness', 'philosophy'],
    },
    {
      title: 'Small Habits, Invisible Growth: A Year in Review',
      excerpt: 'The compound effect of showing up when nobody is watching.',
      content: `<p>A year ago, I made a decision that felt almost too small to matter: I would write 200 words every day. Not for an audience. Not for a deadline. Just 200 words, every single day, no matter what.</p><p>Here's what happened.</p><h2>The Math of Consistency</h2><p>200 words × 365 days = 73,000 words. That's roughly a 250-page book. But the real result wasn't the word count — it was the transformation in how I think.</p><p>Writing daily changed my reading (deeper), my coding (more thoughtful), my conversations (more precise). The habit leaked into everything.</p><h2>What Actually Worked</h2><ul><li><strong>Lower the bar.</strong> 200 words is nothing. That's the point. When the bar is low enough, you can clear it even on your worst days.</li><li><strong>Never miss twice.</strong> One missed day is an accident. Two is the beginning of a new (bad) habit.</li><li><strong>Track silently.</strong> I kept a private spreadsheet. No social accountability, no streak-sharing. Just me and the numbers.</li></ul><p>Growth that's worth having is usually invisible while it's happening. You only see it looking back.</p>`,
      categoryId: 3,
      status: 'published',
      featured: false,
      tags: ['habits', 'growth', 'consistency', 'writing'],
    },
    {
      title: 'Why I Stopped Chasing Frameworks',
      excerpt: 'The liberating realization that fundamentals matter more than the next shiny tool.',
      content: `<p>Every six months, the JavaScript ecosystem births a new framework that promises to solve everything the last one broke. And every six months, developers (myself included) flock to it like moths to a particularly bright light.</p><p>I've decided to stop.</p><h2>The Framework Trap</h2><p>Frameworks are wonderful tools. But when you spend more time learning frameworks than learning the underlying principles, you become dependent. You can build things, but you can't understand them.</p><h2>What I'm Focusing On Instead</h2><ol><li><strong>Vanilla JavaScript.</strong> Really understanding closures, prototypes, the event loop.</li><li><strong>Browser APIs.</strong> Intersection Observer, Resize Observer, CSS containment.</li><li><strong>HTTP.</strong> Caching, content negotiation, conditional requests.</li><li><strong>Design principles.</strong> Why things look good, not just how to make them look good.</li></ol><p>When you understand the foundation, every framework becomes just another tool in the box — not the box itself.</p>`,
      categoryId: 1,
      status: 'published',
      featured: false,
      tags: ['javascript', 'frameworks', 'fundamentals'],
    },
    {
      title: 'CSS as a Design Philosophy',
      excerpt: 'Treating stylesheets not as styling tools but as design systems in disguise.',
      content: `<p>Most developers treat CSS as an afterthought — the "make it pretty" phase that comes after the "real work" of JavaScript. This is a mistake.</p><p>CSS is a design language. And learning to think in CSS makes you a better designer, whether you realize it or not.</p><h2>What CSS Taught Me About Design</h2><ul><li><strong>Constraints breed creativity.</strong> CSS forces you to think in boxes, grids, and flows. These constraints lead to elegant solutions.</li><li><strong>Spacing is everything.</strong> Margins and padding are 80% of good design. Get spacing right and everything else follows.</li><li><strong>Transitions reveal care.</strong> A 200ms ease-out on a hover state says "I thought about this." Nothing says "I didn't" louder than an instant snap.</li></ul><p>Treat your CSS with the same respect you give your JavaScript. Your users will feel the difference.</p>`,
      categoryId: 1,
      status: 'published',
      featured: false,
      tags: ['css', 'design', 'frontend'],
    },
  ];

  for (const article of sampleArticles) {
    const ArticleModel = require('../models/Article');
    const created = ArticleModel.create(article);
    if (article.tags) ArticleModel.setTags(created.id, article.tags);
    console.log(`  ✓ Sample article created: ${article.title.substring(0, 50)}...`);
  }
} else {
  console.log(`  ✓ ${articleCount} article(s) already exist — skipping samples.`);
}

// ============================================================
// 4. Create sample projects
// ============================================================
const projectCount = db.prepare('SELECT COUNT(*) as c FROM projects').get().c;
if (projectCount === 0) {
  const ProjectModel = require('../models/Projects');
  const projects = [
    {
      title: 'Clarity Dashboard',
      slug: 'clarity-dashboard',
      description: 'A minimal personal analytics dashboard that tracks what matters — focus time, reading, and writing streaks.',
      tags: ['React', 'Tailwind', 'Node.js'],
      liveUrl: 'https://clarity-demo.example.com',
      githubUrl: 'https://github.com/arunjournal/clarity-dashboard',
      status: 'published',
      featured: true,
    },
    {
      title: 'Inkwell Editor',
      slug: 'inkwell-editor',
      description: 'A distraction-free markdown editor designed for long-form writing. Built for writers who think in blocks.',
      tags: ['TypeScript', 'ProseMirror', 'Markdown'],
      githubUrl: 'https://github.com/arunjournal/inkwell-editor',
      status: 'published',
      featured: true,
    },
    {
      title: 'RESTful API Starter',
      slug: 'restful-api-starter',
      description: 'A clean, opinionated API boilerplate with auth, rate limiting, and structured logging out of the box.',
      tags: ['Python', 'FastAPI', 'PostgreSQL'],
      githubUrl: 'https://github.com/arunjournal/api-starter',
      status: 'published',
      featured: false,
    },
  ];

  for (const project of projects) {
    ProjectModel.create(project);
    console.log(`  ✓ Sample project created: ${project.title}`);
  }
} else {
  console.log(`  ✓ ${projectCount} project(s) already exist — skipping samples.`);
}

console.log('\n✅ Seeding complete!\n');
console.log('  Admin login credentials:');
console.log(`    Email:    ${process.env.ADMIN_EMAIL || 'admin@arunsjournal.com'}`);
console.log(`    Password: ${process.env.ADMIN_PASSWORD || 'ChangeMeNow2025!'}`);
console.log('\n  API running at: http://localhost:' + (process.env.PORT || 3001));
console.log('  Admin panel:    http://localhost:' + (process.env.PORT || 3001) + '/admin\n');

process.exit(0);