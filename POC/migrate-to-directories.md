# Migration to Feature Directories

## Pattern for Migration

Each HTML file should be moved to its own directory as `index.html`:

- `home.html` → `home/index.html`
- `discovery.html` → `discovery/index.html`
- `login.html` → `login/index.html`
- etc.

## Path Updates Required

### In HTML files:
1. CSS: `css/main.css` → `../css/main.css`
2. JS: `js/...` → `../js/...`
3. Features: `features/...` → `../features/...`
4. Data: `data/...` → `../data/...`
5. Services: `services/...` → `../services/...`
6. Navigation links: `home.html` → `../home/`, `discovery.html` → `../discovery/`, etc.

### In JavaScript files:
1. Navigation: `window.location.href = 'home.html'` → `window.location.href = '../home/'`
2. Links: `href="home.html"` → `href="../home/"`

## Files to Migrate

- [x] discovery/index.html
- [x] home/index.html
- [x] login/index.html
- [x] dashboard/index.html
- [ ] wizard/index.html
- [ ] knowledge/index.html
- [ ] signup/index.html
- [ ] projects/index.html
- [ ] create-project/index.html
- [ ] project/index.html
- [ ] opportunities/index.html
- [ ] matches/index.html
- [ ] proposals/index.html
- [ ] create-proposal/index.html
- [ ] pipeline/index.html
- [ ] collaboration/index.html
- [ ] profile/index.html
- [ ] onboarding/index.html
- [ ] notifications/index.html
- [ ] admin/index.html
- [ ] admin-vetting/index.html
- [ ] admin-moderation/index.html
- [ ] admin-audit/index.html
- [ ] admin-reports/index.html


