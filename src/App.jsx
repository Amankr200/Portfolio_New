import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView, useMotionValue, useMotionValueEvent } from 'framer-motion';
import {
  Github, Linkedin, Twitter, Mail, ExternalLink, Download,
  MapPin, GraduationCap, Code2, Terminal, Coffee, Gamepad2,
  ChevronRight, ArrowUpRight, Star, Folder, GitBranch,
  Layers, Zap, Braces, Database, Globe, Cpu, Send,
  Trophy, Camera, ImageIcon
} from 'lucide-react';
import './App.css';

/* ═══════════════════════════════════════════
   INTERACTIVE PARTICLE CANVAS
   ═══════════════════════════════════════════ */
const ParticleCanvas = () => {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });
  const particles = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Create particles - reduced count for performance
    particles.current = [];
    for (let i = 0; i < 60; i++) {
      particles.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const pts = particles.current;

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const dx = mouse.current.x - p.x;
        const dy = mouse.current.y - p.y;
        const dist = dx * dx + dy * dy;

        // Mouse attraction - subtle
        if (dist < 40000) {
          p.vx += dx * 0.00005;
          p.vy += dy * 0.00005;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.98;
        p.vy *= 0.98;

        // Wrap
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(167, 139, 250, ${p.opacity})`;
        ctx.fill();

        // Lines to nearby - reduced distance threshold
        for (let j = i + 1; j < pts.length; j++) {
          const p2 = pts[j];
          const d2 = (p.x - p2.x) ** 2 + (p.y - p2.y) ** 2;
          if (d2 < 10000) { // 100px dist
            const d = Math.sqrt(d2);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(124, 58, 237, ${0.06 * (1 - d / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    const handleMouse = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMouse);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouse);
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-canvas" />;
};

/* ═══════════════════════════════════════════
   3D TILT CARD (Optimized with motion values)
   ═══════════════════════════════════════════ */
const TiltCard = ({ children, className = '' }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), { stiffness: 300, damping: 30 });
  const springScale = useSpring(scale, { stiffness: 300, damping: 30 });

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
    scale.set(1.02);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
    scale.set(1);
  };

  return (
    <motion.div
      className={className}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        rotateX,
        rotateY,
        scale: springScale,
        perspective: 1000,
        transformStyle: 'preserve-3d',
      }}
    >
      {children}
    </motion.div>
  );
};

/* ═══════════════════════════════════════════
   REVEAL WRAPPER
   ═══════════════════════════════════════════ */
const Reveal = ({ children, delay = 0 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

/* ═══════════════════════════════════════════
   NUMBER COUNTER
   ═══════════════════════════════════════════ */
const Counter = ({ target, suffix = '' }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const end = parseInt(target);
    const duration = 1500;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{count}{suffix}</span>;
};

/* ═══════════════════════════════════════════
   NAVBAR
   ═══════════════════════════════════════════ */
const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('');

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
      const sections = ['contact', 'education', 'hackathons', 'projects', 'skills', 'about'];
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 200) { setActive(id); break; }
      }
      if (window.scrollY < 200) setActive('');
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { label: 'About', id: 'about' },
    { label: 'Skills', id: 'skills' },
    { label: 'Projects', id: 'projects' },
    { label: 'Hackathons', id: 'hackathons' },
    { label: 'Education', id: 'education' },
    { label: 'Contact', id: 'contact' },
  ];

  return (
    <motion.header
      className="nav-wrapper"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <nav className={`navbar ${scrolled ? 'navbar--solid' : ''}`}>
        <a href="#" className="nav-logo-wrap">
          <span className="nav-logo-icon">AK</span>
          <span className="nav-logo-text">Aman Kumar</span>
        </a>
        <ul className="nav-links">
          {links.map(l => (
            <li key={l.id}>
              <a href={`#${l.id}`} className={`nav-link ${active === l.id ? 'nav-link--active' : ''}`}>
                {l.label}
                {active === l.id && (
                  <motion.span className="nav-link-dot" layoutId="nav-dot"
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }} />
                )}
              </a>
            </li>
          ))}
        </ul>
        <a href="#contact" className="nav-cta">
          <span className="nav-cta-pulse"></span>
          Say Hello
        </a>
      </nav>
    </motion.header>
  );
};

/* ═══════════════════════════════════════════
   HERO — TERMINAL STYLE
   ═══════════════════════════════════════════ */
const TerminalHero = () => {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);
  const scale = useTransform(scrollY, [0, 500], [1, 0.95]);

  const [typed, setTyped] = useState('');
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  const lines = useMemo(() => [
    { prefix: '~$', text: ' whoami', delay: 60 },
    { prefix: '>', text: ' aman kumar — Full Stack Developer', delay: 30, isOutput: true },
    { prefix: '~$', text: ' cat skills.txt', delay: 60 },
    { prefix: '>', text: ' React • Javascript • Node.js • MongoDB', delay: 20, isOutput: true },
    { prefix: '~$', text: ' echo "Open to opportunities!"', delay: 50 },
    { prefix: '>', text: ' Open to opportunities!', delay: 25, isOutput: true },
  ], []);

  useEffect(() => {
    if (lineIdx >= lines.length) return;
    const line = lines[lineIdx];
    if (charIdx < line.text.length) {
      const timer = setTimeout(() => {
        setTyped(prev => prev + line.text[charIdx]);
        setCharIdx(c => c + 1);
      }, line.delay);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setTyped(prev => prev + '\n');
        setLineIdx(l => l + 1);
        setCharIdx(0);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [lineIdx, charIdx, lines]);

  useEffect(() => {
    const blink = setInterval(() => setShowCursor(c => !c), 530);
    return () => clearInterval(blink);
  }, []);

  const renderTerminal = () => {
    const allText = typed;
    const displayLines = [];
    let currentLine = '';
    let lineNum = 0;

    for (const ch of allText) {
      if (ch === '\n') {
        const meta = lines[lineNum] || {};
        displayLines.push({ text: currentLine, prefix: meta.prefix, isOutput: meta.isOutput });
        currentLine = '';
        lineNum++;
      } else {
        currentLine += ch;
      }
    }
    // Current incomplete line
    if (lineNum < lines.length) {
      displayLines.push({
        text: currentLine,
        prefix: lines[lineNum].prefix,
        isOutput: lines[lineNum].isOutput,
        isCurrent: true,
      });
    }

    return displayLines.map((l, i) => (
      <div key={i} className={`term-line ${l.isOutput ? 'term-output' : ''}`}>
        <span className="term-prefix">{l.prefix}</span>
        <span className="term-text">{l.text}</span>
        {l.isCurrent && <span className={`term-cursor ${showCursor ? '' : 'term-cursor--hidden'}`}>▌</span>}
      </div>
    ));
  };

  return (
    <motion.section id="home" className="hero" style={{ opacity, scale }}>
      <ParticleCanvas />
      <div className="hero-grain"></div>

      <div className="hero-inner">
        <div className="hero-left">
          <motion.div className="hero-badge"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}>
            <span className="badge-dot"></span> Available for work — 2026
          </motion.div>

          <motion.h1 className="hero-name"
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.9 }}>
            Hey, I'm{' '}
            <span className="name-highlight"><br></br>Aman Kumar</span>
          </motion.h1>

          <motion.p className="hero-tagline"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}>
            A BTech student who turns caffeine into code.<br />
            I build full-stack apps, solve DSA problems, and break things to learn.
          </motion.p>

          <motion.div className="hero-ctas"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}>
            <a href="#projects" className="btn-primary">
              See My Work <ChevronRight size={16} />
            </a>
            <a href="/resume.pdf" target="_blank" className="btn-ghost">
              <Download size={15} /> Resume
            </a>
          </motion.div>

          <motion.div className="hero-chips"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}>
            <a href="https://github.com" target="_blank" className="chip"><Github size={14} /> GitHub</a>
            <a href="https://linkedin.com" target="_blank" className="chip"><Linkedin size={14} /> LinkedIn</a>
            <a href="mailto:hello@example.com" className="chip"><Mail size={14} /> Email</a>
          </motion.div>
        </div>

        <motion.div className="hero-right"
          initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 1 }}>
          <TiltCard className="terminal-card">
            <div className="terminal-bar">
              <div className="terminal-dots">
                <span className="dot-red"></span>
                <span className="dot-yellow"></span>
                <span className="dot-green"></span>
              </div>
              <span className="terminal-title">amankumar@portfolio:~</span>
            </div>
            <div className="terminal-body">
              {renderTerminal()}
            </div>
          </TiltCard>
        </motion.div>
      </div>

      <motion.div className="scroll-cue"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}>
        <motion.div className="scroll-bar"
          animate={{ scaleY: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }} />
        <span>SCROLL</span>
      </motion.div>
    </motion.section>
  );
};

/* ═══════════════════════════════════════════
   MARQUEE
   ═══════════════════════════════════════════ */
const Marquee = ({ items, reverse = false }) => (
  <div className="marquee-strip">
    <motion.div
      className="marquee-track"
      animate={{ x: reverse ? ['0%', '-50%'] : ['-50%', '0%'] }}
      transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
    >
      {[...items, ...items].map((item, i) => (
        <React.Fragment key={i}>
          <span className="marquee-item">{item}</span>
          <span className="marquee-star">✦</span>
        </React.Fragment>
      ))}
    </motion.div>
  </div>
);

/* ═══════════════════════════════════════════
   ABOUT — BENTO GRID
   ═══════════════════════════════════════════ */
const About = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section id="about" className="section">
      <div className="container">
        <Reveal>
          <p className="section-tag"><Terminal size={14} /> about_me</p>
          <h2 className="section-title">Who am I?</h2>
        </Reveal>

        <motion.div
          ref={ref}
          className="bento"
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.1 } },
          }}
        >
          {/* Intro — spans 2 cols */}
          <motion.div
            className="bento-area-intro"
            variants={{ hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <TiltCard className="bento-cell h-full">
              <div className="cell-glow"></div>
              <p className="intro-text">
                I'm a <strong>B.Tech IT</strong> student From GGSIPU , who fell in love with coding
                during first year. Since then, I've built full-stack apps, contributed to open source,
                grinded 500+ DSA problems, and pulled way too many all-nighters. 🌙
              </p>
              <p className="intro-highlight">
                🚀 Currently seeking <strong>SDE / Full Stack roles</strong> — available June 2026
              </p>
            </TiltCard>
          </motion.div>

          {/* Profile Photo */}
          <motion.div
            className="bento-area-photo"
            variants={{ hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1 } }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <TiltCard className="bento-cell h-full cell-photo">
              <div className="photo-glow"></div>
              <img
                src="/profile.jpg"
                alt="Aman Kumar — Developer"
                className="profile-img"
                style={{ filter: 'brightness(1.02) contrast(1.02)' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentNode.querySelector('.photo-placeholder').style.display = 'flex';
                }}
              />
              <div className="photo-placeholder" style={{ display: 'none' }}>
                <span className="photo-placeholder-icon">📸</span>
                <span className="photo-placeholder-text">Add your photo</span>
                <span className="photo-placeholder-hint">Place profile.jpg in /public</span>
              </div>
              <div className="photo-overlay">
                <span className="photo-name">Aman Kumar</span>
                <span className="photo-role">Full Stack Developer</span>
              </div>
            </TiltCard>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="bento-area-stats"
            variants={{ hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <TiltCard className="bento-cell h-full cell-stats-inner">
              <div className="stat-block">
                <span className="stat-number"><Counter target="50" suffix="+" /></span>
                <span className="stat-text">Projects</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-block">
                <span className="stat-number"><Counter target="500" suffix="+" /></span>
                <span className="stat-text">DSA Solved</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-block">
                <span className="stat-number"><Counter target="5" suffix="+" /></span>
                <span className="stat-text">Hackathons</span>
              </div>
            </TiltCard>
          </motion.div>

          {/* Small info cards */}
          <motion.div
            className="bento-area-smalls"
            variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="smalls-row">
              <TiltCard className="bento-cell cell-small-h">
                <div className="cell-small-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8' }}>
                  <MapPin size={20} />
                </div>
                <div className="cell-small-info">
                  <span className="cell-label">Based in</span>
                  <span className="cell-value">India 🇮🇳</span>
                </div>
              </TiltCard>

              <TiltCard className="bento-cell cell-small-h">
                <div className="cell-small-icon" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#c084fc' }}>
                  <GraduationCap size={20} />
                </div>
                <div className="cell-small-info">
                  <span className="cell-label">Education</span>
                  <span className="cell-value">B.Tech IT '27</span>
                </div>
              </TiltCard>

              <TiltCard className="bento-cell cell-small-h">
                <div className="cell-small-icon" style={{ background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24' }}>
                  <Coffee size={20} />
                </div>
                <div className="cell-small-info">
                  <span className="cell-label">Fun fact</span>
                  <span className="cell-value">I explain recursion to non-tech friends 😅</span>
                </div>
              </TiltCard>
            </div>
          </motion.div>

          {/* Coding activity */}
          <motion.div
            className="bento-area-activity"
            variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <TiltCard className="bento-cell h-full">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span className="cell-label">Coding Activity</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--green)' }}>● Active</span>
              </div>
              <div className="activity-graph">
                {useMemo(() => Array.from({ length: 35 }).map((_, i) => {
                  const val = Math.random();
                  return (
                    <div key={i} className="activity-bar"
                      style={{
                        height: `${8 + val * 42}px`,
                        opacity: 0.2 + val * 0.8,
                        background: 'var(--accent)',
                        willChange: 'height'
                      }}
                    />
                  );
                }), [])}
              </div>
              <span className="activity-caption">Last 5 weeks — always shipping 🔥</span>
            </TiltCard>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};



/* ═══════════════════════════════════════════
   SKILLS — ICON GRID
   ═══════════════════════════════════════════ */
const skillData = [
  { icon: <Code2 size={22} />, name: 'C++', color: '#00599C' },
  { icon: <Zap size={22} />, name: 'JavaScript', color: '#F7DF1E' },

  { icon: <Braces size={22} />, name: 'React.js', color: '#61DAFB' },

  { icon: <Cpu size={22} />, name: 'Node.js', color: '#68A063' },
  { icon: <Layers size={22} />, name: 'Express', color: '#888' },
  { icon: <Database size={22} />, name: 'SQL', color: '#336791' },
  { icon: <Database size={22} />, name: 'MongoDB', color: '#47A248' },
  { icon: <Database size={22} />, name: 'Redis', color: '#DC382D' },

  { icon: <Layers size={22} />, name: 'Docker', color: '#2496ED' },

  { icon: <GitBranch size={22} />, name: 'Git', color: '#F05032' },
  { icon: <GitBranch size={22} />, name: 'GitHub', color: '#000' },
];

const Skills = () => {
  const memoizedSkills = useMemo(() => skillData.map((s, i) => (
    <Reveal key={s.name} delay={i * 0.05}>
      <TiltCard className="skill-chip">
        <div className="skill-chip-icon" style={{ color: s.color, background: `${s.color}15` }}>
          {s.icon}
        </div>
        <span className="skill-chip-name">{s.name}</span>
      </TiltCard>
    </Reveal>
  )), []);

  return (
    <section id="skills" className="section section--dark">
      <div className="container">
        <Reveal>
          <p className="section-tag"><Code2 size={14} /> tech_stack</p>
          <h2 className="section-title">My toolkit</h2>
        </Reveal>
        <div className="skills-orbit">
          {memoizedSkills}
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════
   PROJECTS — HORIZONTAL SCROLL
   ═══════════════════════════════════════════ */
const projectList = [
  {
    title: 'Collab Docs',
    desc: 'Google Docs-style real-time collaborative editor with live cursors, version history, and conflict resolution.',
    tags: ['React', 'WebSocket', 'Node.js', 'Redis'],
    github: '#', live: '#', color: '#f59e0b', emoji: '📝',
  },
  {
    title: 'CodeBoard – Developer Portfolio & Global Leaderboard',
    desc: 'MERN-based platform aggregating real-time coding stats for 500+ students across LeetCode, CodeChef, Codeforces, and GeeksforGeeks. Features a custom C Score ranking algorithm, automated 6-hour data sync, and an interactive multi-filter leaderboard dashboard.',
    tags: ['React.js', 'Node.js', 'Express.js', 'MongoDB', 'JWT', 'Recharts', 'Axios', 'Node-cron'],
    github: '#',
    live: '#',
    color: '#3b82f6',
    emoji: '🏆',
  },
  {
    title: 'SafaiSetu',
    desc: 'Civic issue reporting platform for Delhi with real-time tracking, analytics dashboard, and Firebase auth.',
    tags: ['React', 'FastAPI', 'Firebase', 'SQLite'],
    github: '#', live: '#', color: '#6366f1', emoji: '🏙️',
  },
  {
    title: 'GRC Guard',
    desc: 'Enterprise security platform with JWT authentication, RBAC, and a real-time compliance dashboard.',
    tags: ['Next.js', 'Node.js', 'MongoDB', 'JWT'],
    github: '#', live: '#', color: '#10b981', emoji: '🔐',
  },

  {
    title: 'Secure Env Check',
    desc: 'npm package that validates env vars, catches weak secrets, and blocks accidental .env commits.',
    tags: ['Node.js', 'npm', 'CLI', 'Security'],
    github: '#', live: '#', color: '#ec4899', emoji: '🔒',
  },

];

const HorizontalProjects = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const x = useTransform(scrollYProgress, [0, 1], ['5%', '-82%']);

  const memoizedProjects = useMemo(() => projectList.map((p, i) => (
    <div className="hscroll-card" key={p.title}>
      <div className="hcard-top" style={{ background: `linear-gradient(135deg, ${p.color}18, ${p.color}08)` }}>
        <span className="hcard-emoji">{p.emoji}</span>
        <div className="hcard-num">{String(i + 1).padStart(2, '0')}</div>
      </div>
      <div className="hcard-body">
        <h3 className="hcard-title">{p.title}</h3>
        <p className="hcard-desc">{p.desc}</p>
        <div className="hcard-tags">
          {p.tags.map(t => <span key={t} className="hcard-tag">{t}</span>)}
        </div>
        <div className="hcard-links">
          <a href={p.github} target="_blank"><Github size={16} /> Code</a>
          <a href={p.live} target="_blank"><ExternalLink size={16} /> Live</a>
        </div>
      </div>
    </div>
  )), []);

  return (
    <section id="projects" className="hscroll-section" ref={containerRef}>
      <div className="hscroll-sticky">
        <div className="container">
          <Reveal>
            <p className="section-tag"><Folder size={14} /> my_projects</p>
            <h2 className="section-title">Things I've built</h2>
          </Reveal>
        </div>

        <motion.div
          className="hscroll-track"
          style={{ x }}
          initial={false}
          transition={{ duration: 0 }} /* Instant transform update */
        >
          {memoizedProjects}

          {/* See More CTA card */}
          <div className="hscroll-card hscroll-cta-card">
            <a href="https://github.com/yourgithub?tab=repositories" target="_blank" rel="noopener noreferrer" className="hscroll-cta-inner">
              <div className="hscroll-cta-icon">
                <ArrowUpRight size={32} />
              </div>
              <h3 className="hcard-title">See All Projects</h3>
              <p className="hcard-desc">View my full portfolio on GitHub</p>
              <span className="hscroll-cta-link">
                <Github size={16} /> GitHub <ChevronRight size={14} />
              </span>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════
   EDUCATION TIMELINE
   ═══════════════════════════════════════════ */
const Education = () => (
  <section id="education" className="section">
    <div className="container">
      <Reveal>
        <p className="section-tag"><GraduationCap size={14} /> education</p>
        <h2 className="section-title">Academic journey</h2>
      </Reveal>
      <div className="timeline">
        {[
          { year: '2023 — 2027', title: 'B.Tech — Inormation Technology', place: 'GGSIPU, New Delhi, India', detail: 'CGPA: 9 • DSA, DBMS, OS, CN, OOPs' },
          { year: 'Certifications', title: 'Online Learning', chips: ['Postman Student Expert', 'HackerRank'] },
          { year: '2020 — 2022', title: 'Senior Secondary (XII)', place: 'Notre Dame School, New Delhi, India', detail: '90.2% • PCM ' },
          { year: '2020 — 2022', title: 'Secondary (X)', place: 'Notre Dame School, New Delhi, India', detail: '94%' },

        ].map((item, i) => (
          <Reveal key={i} delay={i * 0.12}>
            <div className="tl-item">
              <div className="tl-dot"></div>
              <TiltCard className="tl-card">
                <span className="tl-year">{item.year}</span>
                <h3>{item.title}</h3>
                {item.place && <p className="tl-place">{item.place}</p>}
                {item.detail && <p className="tl-detail">{item.detail}</p>}
                {item.chips && (
                  <div className="tl-chips">
                    {item.chips.map(c => <span key={c} className="tl-chip">{c}</span>)}
                  </div>
                )}
              </TiltCard>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

/* ═══════════════════════════════════════════
   HACKATHONS — PHOTO GALLERY
   ═══════════════════════════════════════════ */
const hackathonData = [
  { id: 1, name: 'Smart India Hackathon', date: 'Sept 2024', award: '🏆 Winner', img: '/hackathons/sih.jpg' },
  { id: 2, name: 'HackWithInfy', date: 'Aug 2024', award: '🥈 Top 10', img: '/hackathons/hackinfy.jpg' },
  { id: 3, name: 'MLH Global Hack', date: 'June 2024', award: '🏅 Finalist', img: '/hackathons/mlh.jpg' },
  { id: 4, name: 'ETHIndia', date: 'Dec 2023', award: '⭐ Participant', img: '/hackathons/ethindia.jpg' },
  { id: 5, name: 'Devfolio Hackathon', date: 'Oct 2023', award: '🏆 Winner', img: '/hackathons/devfolio.jpg' },
  { id: 6, name: 'HackCBS', date: 'Nov 2023', award: '🥉 3rd Place', img: '/hackathons/hackcbs.jpg' },
  { id: 7, name: 'Code for Good', date: 'Jul 2023', award: '🏅 Finalist', img: '/hackathons/codeforgood.jpg' },
  { id: 8, name: 'Google Solution Challenge', date: 'Mar 2023', award: '⭐ Top 100', img: '/hackathons/google.jpg' },
  { id: 9, name: 'Internal College Hackathon', date: 'Feb 2023', award: '🏆 Winner', img: '/hackathons/college.jpg' },
  { id: 10, name: 'Hack the Mountains', date: 'Jan 2023', award: '⭐ Participant', img: '/hackathons/htm.jpg' },
];

const Hackathons = () => (
  <section id="hackathons" className="section section--dark">
    <div className="container">
      <Reveal>
        <p className="section-tag"><Trophy size={14} /> hackathon_wall</p>
        <h2 className="section-title">Hackathon Memories</h2>
        <p className="section-sub">10+ hackathons, countless sleepless nights, and some trophies along the way 🏆</p>
      </Reveal>

      <div className="hack-gallery">
        {hackathonData.map((h, i) => (
          <Reveal key={h.id} delay={i * 0.06}>
            <TiltCard className="hack-card">
              <div className="hack-img-wrap">
                <img
                  src={h.img}
                  alt={h.name}
                  className="hack-img"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="hack-img-placeholder" style={{ display: 'none' }}>
                  <Camera size={28} />
                  <span>Add photo</span>
                </div>
                <div className="hack-img-overlay"></div>
                <span className="hack-award">{h.award}</span>
              </div>
              <div className="hack-info">
                <h4 className="hack-name">{h.name}</h4>
                <span className="hack-date">{h.date}</span>
              </div>
            </TiltCard>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.3}>
        <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          📁 Place your hackathon photos in <code style={{ fontFamily: 'var(--mono)', background: 'var(--bg-card)', padding: '2px 8px', borderRadius: '6px', border: '1px solid var(--border)' }}>/public/hackathons/</code>
        </p>
      </Reveal>
    </div>
  </section>
);

/* ═══════════════════════════════════════════
   CONTACT
   ═══════════════════════════════════════════ */
const Contact = () => {
  const [sent, setSent] = useState(false);
  const submit = (e) => { e.preventDefault(); setSent(true); setTimeout(() => setSent(false), 3000); };

  return (
    <section id="contact" className="section section--dark">
      <div className="container">
        <Reveal>
          <p className="section-tag"><Mail size={14} /> reach_out</p>
          <h2 className="section-title">Let's connect!</h2>
          <p className="section-sub">Got an opportunity or just want to say hi? My inbox is always open. 😊</p>
        </Reveal>

        <div className="contact-grid">
          <Reveal delay={0.1}>
            <form className="contact-form" onSubmit={submit}>
              <div className="form-row">
                <div className="form-field">
                  <label>Name</label>
                  <input type="text" placeholder="John Doe" required />
                </div>
                <div className="form-field">
                  <label>Email</label>
                  <input type="email" placeholder="john@example.com" required />
                </div>
              </div>
              <div className="form-field">
                <label>Message</label>
                <textarea rows="5" placeholder="Hey, loved your projects! Let's connect..." required></textarea>
              </div>
              <button type="submit" className={`submit-btn ${sent ? 'submit-btn--sent' : ''}`}>
                {sent ? '✓ Sent!' : <><Send size={16} /> Send Message</>}
              </button>
            </form>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="contact-aside">
              <TiltCard className="aside-card">
                <h4>Or find me here</h4>
                <a href="mailto:hello@example.com" className="aside-link"><Mail size={16} /> hello@example.com</a>
                <a href="#" className="aside-link"><Linkedin size={16} /> linkedin.com/in/krama</a>
                <a href="#" className="aside-link"><Github size={16} /> github.com/krama</a>
              </TiltCard>
              <TiltCard className="aside-card status-card">
                <div className="status-dot"></div>
                <div>
                  <h4>Current Status</h4>
                  <p>Open to SDE / Full Stack roles</p>
                  <small>Available from June 2026</small>
                </div>
              </TiltCard>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════ */
const Footer = () => (
  <footer className="footer">
    <div className="container footer-inner">
      <p>Designed & Built by <span className="text-glow">Aman Kumar</span> with ☕ & late nights</p>
      <div className="footer-links">
        <a href="#"><Github size={18} /></a>
        <a href="#"><Linkedin size={18} /></a>
        <a href="#"><Twitter size={18} /></a>
      </div>
      <small>© 2026 • React + Framer Motion</small>
    </div>
  </footer>
);

/* ═══════════════════════════════════════════
   APP
   ═══════════════════════════════════════════ */
export default function App() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <>
      <motion.div className="progress-bar" style={{ scaleX }} />
      {/* <ParticleCanvas /> -- removed for extreme performance */}
      <Navbar />
      <TerminalHero />
      <Marquee
        items={[
          'C++',
          'JavaScript',
          'React.js',
          'Node.js',
          'Express',
          'MongoDB',
          'SQL',
          'Redis',
          'Docker',
          'Git',
          'GitHub'
        ]}
      />
      <About />
      <Skills />
      <Marquee items={['Problem Solver', 'Full Stack Dev', 'Open Source', 'Hackathon Winner', 'DSA Enthusiast']} reverse />
      <HorizontalProjects />
      <Education />
      <Hackathons />
      <Contact />
      <Footer />
    </>
  );
}
