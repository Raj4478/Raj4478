// Builds the open-source and project cards in assets/. Run: node scripts/build-cards.mjs
import fs from 'node:fs';

const esc = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const SANS = 'ui-sans-serif, -apple-system, &quot;Segoe UI&quot;, Inter, Roboto, Helvetica, Arial, sans-serif';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, &quot;Liberation Mono&quot;, monospace';

// Greedy word wrap by an average glyph width; good enough for short titles.
function wrap(text, maxChars) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    if ((line + ' ' + word).trim().length > maxChars && line) { lines.push(line); line = word; }
    else line = (line + ' ' + word).trim();
  }
  if (line) lines.push(line);
  return lines;
}

function frame({ width, height, title, desc, accent, body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">${esc(title)}</title>
  <desc id="desc">${esc(desc)}</desc>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b0d1d"/><stop offset="1" stop-color="#121531"/></linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${accent[0]}"/><stop offset="1" stop-color="${accent[1]}"/></linearGradient>
    <radialGradient id="glow" cx="1" cy="0" r="1"><stop offset="0" stop-color="${accent[1]}" stop-opacity=".22"/><stop offset="1" stop-color="${accent[1]}" stop-opacity="0"/></radialGradient>
    <clipPath id="clip"><rect width="${width}" height="${height}" rx="18"/></clipPath>
  </defs>
  <style>
    .sans { font-family: ${SANS}; } .mono { font-family: ${MONO}; }
    .shine { animation: shine 6s ease-in-out infinite; }
    @keyframes shine { 0%, 100% { opacity: .55; } 50% { opacity: 1; } }
    @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
  </style>
  <g clip-path="url(#clip)">
    <rect width="${width}" height="${height}" fill="url(#bg)"/>
    <rect width="${width}" height="${height}" fill="url(#glow)" class="shine"/>
    <rect x="20" width="${width - 40}" height="3" rx="1.5" fill="url(#accent)"/>
${body}
  </g>
  <rect x=".5" y=".5" width="${width - 1}" height="${height - 1}" rx="18" fill="none" stroke="#ffffff" stroke-opacity=".09"/>
</svg>
`;
}

const prs = [
  { file: 'oss-nest', org: 'nestjs', repo: 'nest', number: 17625, title: 'fix(core): clean up repeated shutdown signal listeners', note: 'Fixed process-listener leaks from repeated shutdown-hook registration, with regression tests', add: 309, del: 35, merged: '14 Sep 2026', accent: ['#f43f5e', '#fb7185'], mark: 'N' },
  { file: 'oss-mermaid', org: 'mermaid-js', repo: 'mermaid', number: 8236, title: 'fix(ci): shard scoped e2e runs to avoid snapshot timeouts', note: 'Split scoped end-to-end runs across two CI shards to stop Markdown snapshot timeouts', add: 2, del: 2, merged: '15 Sep 2026', accent: ['#ec4899', '#f472b6'], mark: 'M' },
  { file: 'oss-vitest', org: 'vitest-dev', repo: 'vitest', number: 11271, title: 'fix(reporter): agent reporter respects --silent', note: 'Made the agent/minimal reporter honour an explicit silent setting, keeping its default', add: 28, del: 1, merged: '17 Sep 2026', accent: ['#84cc16', '#facc15'], mark: 'V' }
];

for (const pr of prs) {
  const width = 420, height = 230;
  const titleLines = wrap(pr.title, 34).slice(0, 2);
  const noteLines = wrap(pr.note, 52).slice(0, 2);
  const total = pr.add + pr.del;
  const addWidth = Math.max(6, Math.round(110 * pr.add / total));
  const body = `    <g class="sans">
      <rect x="24" y="26" width="36" height="36" rx="10" fill="url(#accent)" fill-opacity=".18" stroke="url(#accent)" stroke-opacity=".6"/>
      <text x="42" y="50" text-anchor="middle" font-size="17" font-weight="800" fill="${pr.accent[1]}">${pr.mark}</text>
      <text x="72" y="41" class="mono" font-size="12" fill="#9ca3c7">${esc(pr.org)}/</text>
      <text x="72" y="58" font-size="16" font-weight="800" fill="#ffffff">${esc(pr.repo)} <tspan class="mono" font-size="13" font-weight="600" fill="#8b93c9">#${pr.number}</tspan></text>
      <g transform="translate(${width - 104} 30)">
        <rect width="80" height="24" rx="12" fill="#8957e5" fill-opacity=".2" stroke="#a371f7" stroke-opacity=".7"/>
        <path d="M14 7 v10 M14 7 a2.4 2.4 0 1 0 0.01 0 M22 17 a2.4 2.4 0 1 0 0.01 0 M14 10 c0 4 8 2 8 7" fill="none" stroke="#d2a8ff" stroke-width="1.6" stroke-linecap="round"/>
        <text x="50" y="16.5" text-anchor="middle" class="mono" font-size="11" font-weight="700" fill="#d2a8ff">MERGED</text>
      </g>
${titleLines.map((line, i) => `      <text x="24" y="${102 + i * 22}" font-size="16" font-weight="700" fill="#e5e7ff">${esc(line)}</text>`).join('\n')}
${noteLines.map((line, i) => `      <text x="24" y="${152 + i * 18}" font-size="12.5" fill="#9ca3c7">${esc(line)}</text>`).join('\n')}
      <g transform="translate(24 196)" class="mono" font-size="11.5">
        <text fill="#3fb950">+${pr.add}</text><text x="${String(pr.add).length * 7 + 14}" fill="#f85149">−${pr.del}</text>
        <rect x="${(String(pr.add).length + String(pr.del).length) * 7 + 34}" y="-9" width="${addWidth}" height="9" rx="2" fill="#3fb950"/>
        <rect x="${(String(pr.add).length + String(pr.del).length) * 7 + 34 + addWidth + 2}" y="-9" width="${112 - addWidth}" height="9" rx="2" fill="#f85149" fill-opacity=".85"/>
        <text x="${width - 48}" text-anchor="end" fill="#8b93c9">merged ${pr.merged}</text>
      </g>
    </g>`;
  fs.writeFileSync(`assets/${pr.file}.svg`, frame({ width, height, title: `${pr.org}/${pr.repo} #${pr.number}: merged`, desc: `${pr.title}. ${pr.note}. +${pr.add} −${pr.del}, merged ${pr.merged}.`, accent: pr.accent, body }));
}

const projects = [
  { file: 'project-outreach', name: 'Job Outreach CRM', kicker: 'AI AGENT · TELEGRAM', blurb: 'A Telegram bot that turns a hiring post into a tailored application, then finds jobs on its own every morning.', points: ['Gemini with Google Search grounding + structured output', 'Gmail send with resume attached, durable send ledger', '119 tests · owner-only · no invented claims'], stack: ['Node.js', 'Gemini', 'Telegram', 'Vercel', 'Actions'], accent: ['#ff7a59', '#22d3ee'], badge: 'PRIVATE' },
  { file: 'project-fieldnotes', name: 'Fieldnotes Studio', kicker: 'AI PIPELINE · CONTENT', blurb: 'Turns a topic, link, or video into a ready-to-post Instagram carousel, Reel, and caption, with every claim cited.', points: ['Research, copy, and a second-model audit before display', 'HTML → Playwright renders, FFmpeg Reels', 'Runs on free tiers via Telegram, Actions, or CLI'], stack: ['Python', 'Gemini', 'Playwright', 'FFmpeg', 'Workers'], accent: ['#a78bfa', '#f472b6'], badge: 'PRIVATE' },
  { file: 'project-socially', name: 'Socially', kicker: 'SOCIAL PLATFORM', blurb: 'A social platform built for speed: fast first load, better Core Web Vitals, real beta users.', points: ['1.8 s initial page load', '+35% Core Web Vitals', '200+ beta users'], stack: ['Next.js', 'TypeScript', 'Tailwind'], accent: ['#60a5fa', '#5eead4'], badge: 'PUBLIC' },
  { file: 'project-hospital', name: 'Hospital Management', kicker: 'FULL STACK · RBAC', blurb: 'Role-based hospital system for admins, doctors, and patients.', points: ['API response 850 ms → 320 ms', '40% faster patient check-in', 'RBAC for admin / doctor / patient'], stack: ['React', 'Node.js', 'MongoDB', 'JWT'], accent: ['#818cf8', '#60a5fa'], badge: 'PUBLIC' }
];

for (const p of projects) {
  const width = 620, height = 270;
  const blurb = wrap(p.blurb, 72).slice(0, 2);
  let x = 26;
  const chips = p.stack.map(item => {
    const w = item.length * 7.2 + 22;
    const chip = `<rect x="${x}" y="226" width="${w}" height="22" rx="11" fill="url(#accent)" fill-opacity=".14"/><text x="${x + w / 2}" y="241" text-anchor="middle">${esc(item)}</text>`;
    x += w + 8;
    return chip;
  }).join('');
  const body = `    <g class="sans">
      <text x="26" y="46" class="mono" font-size="11" font-weight="700" letter-spacing="1.8" fill="${p.accent[0]}">${esc(p.kicker)}</text>
      <g transform="translate(${width - 98} 30)"><rect width="72" height="22" rx="11" fill="#ffffff" fill-opacity=".06" stroke="#ffffff" stroke-opacity=".18"/><text x="36" y="15" text-anchor="middle" class="mono" font-size="10.5" font-weight="700" fill="#c7cbe6">${p.badge}</text></g>
      <text x="26" y="82" font-size="26" font-weight="800" letter-spacing="-.5" fill="#ffffff">${esc(p.name)}</text>
${blurb.map((line, i) => `      <text x="26" y="${110 + i * 20}" font-size="14" fill="#b4b9dd">${esc(line)}</text>`).join('\n')}
${p.points.map((point, i) => `      <circle cx="31" cy="${161 + i * 21}" r="3" fill="url(#accent)"/><text x="44" y="${166 + i * 21}" font-size="13" fill="#e2e4f7">${esc(point)}</text>`).join('\n')}
      <g class="mono" font-size="11" fill="#e2e4f7">${chips}</g>
    </g>`;
  fs.writeFileSync(`assets/${p.file}.svg`, frame({ width, height, title: p.name, desc: `${p.blurb} ${p.points.join('. ')}. Built with ${p.stack.join(', ')}.`, accent: p.accent, body }));
}
console.log('cards built');

const stack = [
  { label: 'LANGUAGES', color: '#818cf8', items: ['TypeScript', 'JavaScript', 'Python', 'SQL'] },
  { label: 'BACKEND', color: '#60a5fa', items: ['NestJS', 'Node.js', 'Express', 'FastAPI', 'Django', 'REST', 'WebSockets', 'JWT'] },
  { label: 'CLOUD & DEVOPS', color: '#5eead4', items: ['AWS SQS', 'S3', 'Lambda', 'EC2', 'Docker', 'GitHub Actions', 'Vercel'] },
  { label: 'DATA', color: '#a78bfa', items: ['PostgreSQL', 'MongoDB', 'TypeORM', 'Migrations', 'Query tuning'] },
  { label: 'FRONTEND', color: '#f472b6', items: ['React', 'Next.js', 'Redux Toolkit', 'Tailwind CSS', 'i18n'] },
  { label: 'AI & TESTING', color: '#facc15', items: ['Gemini API', 'Structured output', 'Playwright', 'Jest', 'Vitest', 'node:test'] }
];
{
  const width = 1280, height = 280, colWidth = 386, colGap = 21, rowHeight = 128;
  const blocks = stack.map((group, index) => {
    const x0 = 40 + (index % 3) * (colWidth + colGap), y0 = 40 + Math.floor(index / 3) * rowHeight;
    let x = 0, y = 26;
    const chips = group.items.map(item => {
      const w = item.length * 7.4 + 24;
      if (x + w > colWidth) { x = 0; y += 32; }
      const chip = `<rect x="${x}" y="${y}" width="${w}" height="24" rx="12" fill="${group.color}" fill-opacity=".1" stroke="${group.color}" stroke-opacity=".35"/><text x="${x + w / 2}" y="${y + 16}" text-anchor="middle">${esc(item)}</text>`;
      x += w + 8;
      return chip;
    }).join('');
    return `    <g transform="translate(${x0} ${y0})"><circle cx="5" cy="5" r="4" fill="${group.color}"/><text x="16" y="10" class="mono" font-size="11" font-weight="700" letter-spacing="1.8" fill="${group.color}">${esc(group.label)}</text><g class="sans" font-size="12.5" fill="#e2e4f7">${chips}</g></g>`;
  }).join('\n');
  fs.writeFileSync('assets/stack.svg', frame({ width, height, title: 'Stack', desc: stack.map(group => `${group.label}: ${group.items.join(', ')}`).join('. '), accent: ['#818cf8', '#5eead4'], body: blocks }));
}
console.log('stack built');
