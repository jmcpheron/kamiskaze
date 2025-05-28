# CLAUDE.md - Development Guidelines

## Build & Testing Commands
- **Quick Test**: `python3 -m http.server 8001` then open `http://localhost:8001`
- **Comprehensive Testing**: See `TESTING.md` for full testing procedures and Claude Code workflows
- **Stop Test Server**: `pkill -f "python3 -m http.server"`
- No build process required - static HTML/CSS/JS
- **Important**: Always use local server (not file://) for proper CORS and media file handling

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