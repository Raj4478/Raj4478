// Renders assets/stats.svg from the GitHub GraphQL API. Run daily by .github/workflows/stats.yml.
// Usage: GITHUB_TOKEN=... node scripts/stats.mjs [login]
import fs from 'node:fs';

const login = process.argv[2] || process.env.GITHUB_LOGIN || 'Raj4478';
const token = process.env.STATS_TOKEN || process.env.GITHUB_TOKEN;
if (!token) throw new Error('Set GITHUB_TOKEN (or STATS_TOKEN to include private contribution counts).');

const query = `query($login: String!) { user(login: $login) {
  pullRequests(states: MERGED) { totalCount }
  repositories(ownerAffiliations: OWNER, privacy: PUBLIC) { totalCount }
  contributionsCollection {
    totalCommitContributions totalPullRequestContributions restrictedContributionsCount
    contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }
  } } }`;
const response = await fetch('https://api.github.com/graphql', {
  method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'profile-stats' },
  body: JSON.stringify({ query, variables: { login } })
});
const { data, errors } = await response.json();
if (errors || !data?.user) throw new Error(`GitHub API error: ${JSON.stringify(errors || response.status)}`);
const user = data.user;
const calendar = user.contributionsCollection.contributionCalendar;
const days = calendar.weeks.flatMap(week => week.contributionDays);

// Streaks: today may still be empty, so the current streak may end yesterday.
let longest = 0, run = 0;
for (const day of days) { run = day.contributionCount ? run + 1 : 0; longest = Math.max(longest, run); }
let current = 0;
for (let i = days.length - 1; i >= 0; i--) {
  if (days[i].contributionCount) current++;
  else if (i === days.length - 1) continue;
  else break;
}
const best = days.reduce((top, day) => day.contributionCount > top.contributionCount ? day : top, days[0]);
const activeDays = days.filter(day => day.contributionCount).length;

const fmt = n => n.toLocaleString('en-US');
const shortDate = date => new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const levels = ['#161b33', '#2e3a8c', '#4f46e5', '#6d8bfa', '#7dd3fc'];
const level = count => count === 0 ? 0 : count < 4 ? 1 : count < 10 ? 2 : count < 20 ? 3 : 4;

const cell = 11, gap = 3, gridX = 470, gridY = 74;
const cells = calendar.weeks.map((week, w) => week.contributionDays.map(day => {
  const weekday = new Date(`${day.date}T00:00:00Z`).getUTCDay();
  return `<rect x="${gridX + w * (cell + gap)}" y="${gridY + weekday * (cell + gap)}" width="${cell}" height="${cell}" rx="2.5" fill="${levels[level(day.contributionCount)]}" style="animation-delay:${(w * 0.025).toFixed(3)}s"><title>${day.contributionCount} on ${day.date}</title></rect>`;
}).join('')).join('\n      ');
const months = [];
calendar.weeks.forEach((week, w) => {
  const first = week.contributionDays[0];
  if (first && new Date(`${first.date}T00:00:00Z`).getUTCDate() <= 7 && w > 0) {
    months.push(`<text x="${gridX + w * (cell + gap)}" y="${gridY - 10}">${new Date(`${first.date}T00:00:00Z`).toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' })}</text>`);
  }
});
const gridWidth = calendar.weeks.length * (cell + gap) - gap;

const stat = (x, y, value, label, fill) => `<g transform="translate(${x} ${y})"><text class="v" fill="${fill}">${value}</text><text y="22" class="l">${label}</text></g>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="260" viewBox="0 0 1280 260" role="img" aria-labelledby="title desc">
  <title id="title">GitHub activity for ${login}</title>
  <desc id="desc">${fmt(calendar.totalContributions)} contributions in the last year, ${fmt(user.pullRequests.totalCount)} merged pull requests, ${fmt(user.contributionsCollection.totalCommitContributions)} commits, a current streak of ${current} days and a longest streak of ${longest} days.</desc>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#070812"/><stop offset="1" stop-color="#0c0e22"/></linearGradient>
    <linearGradient id="a" x1="0" x2="1"><stop offset="0" stop-color="#818cf8"/><stop offset="1" stop-color="#60a5fa"/></linearGradient>
    <linearGradient id="b" x1="0" x2="1"><stop offset="0" stop-color="#60a5fa"/><stop offset="1" stop-color="#5eead4"/></linearGradient>
    <linearGradient id="c" x1="0" x2="1"><stop offset="0" stop-color="#a78bfa"/><stop offset="1" stop-color="#f472b6"/></linearGradient>
    <radialGradient id="haze"><stop offset="0" stop-color="#4f46e5" stop-opacity=".22"/><stop offset="1" stop-color="#4f46e5" stop-opacity="0"/></radialGradient>
    <clipPath id="clip"><rect width="1280" height="260" rx="22"/></clipPath>
  </defs>
  <style>
    text { font-family: ui-sans-serif, -apple-system, "Segoe UI", Inter, Roboto, Helvetica, Arial, sans-serif; }
    .mono, .months text { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace; }
    .v { font-size: 34px; font-weight: 800; letter-spacing: -1px; }
    .l { font-size: 12.5px; fill: #9ca3c7; }
    .months text { font-size: 10px; fill: #6b7299; }
    .grid rect { animation: pop .5s ease-out both; }
    @keyframes pop { from { opacity: 0; } to { opacity: 1; } }
    @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
  </style>
  <g clip-path="url(#clip)">
    <rect width="1280" height="260" fill="url(#bg)"/>
    <ellipse cx="300" cy="130" rx="420" ry="200" fill="url(#haze)"/>
    <text x="40" y="44" class="mono" font-size="11" font-weight="700" letter-spacing="1.8" fill="#a5b4fc">GITHUB · LAST 12 MONTHS</text>
    ${stat(40, 100, fmt(calendar.totalContributions), 'contributions', 'url(#a)')}
    ${stat(240, 100, fmt(user.pullRequests.totalCount), 'merged pull requests', 'url(#c)')}
    ${stat(40, 178, `${current}d`, 'current streak', 'url(#b)')}
    ${stat(240, 178, `${longest}d`, 'longest streak', 'url(#b)')}
    <g class="months">${months.join('')}</g>
    <g class="grid">
      ${cells}
    </g>
    <g class="mono" font-size="10.5" fill="#8b93c9">
      <text x="${gridX}" y="${gridY + 7 * (cell + gap) + 18}">${activeDays} active days · ${fmt(user.contributionsCollection.totalCommitContributions)} commits · best day ${best.contributionCount} on ${shortDate(best.date)}</text>
      <g transform="translate(${gridX + gridWidth - 112} ${gridY + 7 * (cell + gap) + 8})"><text x="-8" y="10" text-anchor="end">less</text>${levels.map((color, i) => `<rect x="${i * 15}" width="${cell}" height="${cell}" rx="2.5" fill="${color}"/>`).join('')}<text x="${levels.length * 15 + 4}" y="10">more</text></g>
    </g>
  </g>
  <rect x=".5" y=".5" width="1279" height="259" rx="22" fill="none" stroke="#ffffff" stroke-opacity=".07"/>
</svg>
`;
fs.mkdirSync('assets', { recursive: true });
fs.writeFileSync('assets/stats.svg', svg);
console.log(`stats.svg: ${calendar.totalContributions} contributions, ${user.pullRequests.totalCount} merged PRs, streak ${current}/${longest}`);
