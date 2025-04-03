# CLAUDE.md - Development Guidelines

## Build & Testing Commands
- Open `test-player.html` in browser to test player functionality
- No build process required - static HTML/CSS/JS

## Code Style Guidelines

### JavaScript
- Use ES6+ features (arrow functions, template literals, destructuring)
- Indent with 2 spaces
- Semicolons required
- camelCase for variables and functions
- Handle errors with try/catch blocks and show user notifications

### HTML/CSS
- Use semantic HTML5 elements
- CSS variables for colors, spacing, and transitions
- Mobile-first responsive design
- BEM-like naming convention for CSS classes

### Audio/Media
- Support multiple formats (MP3, MP4, WebM, MKV)
- Always provide fallback for missing album art
- Handle playback state persistence in localStorage