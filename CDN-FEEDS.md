# External CDN Feeds for Kamiskaze Player

This document explains how to use external CDN/S3 sources with the Kamiskaze audio/video player.

## Overview

The Kamiskaze player now supports loading playlists from external CDN sources, including:
- GitHub Pages repositories
- AWS S3 buckets  
- Generic CDN services
- Any CORS-enabled web server

## Feed Format

External CDN feeds use an extended JSON format that includes source configuration:

```json
{
  "id": "unique-feed-id",
  "title": "Feed Display Name",
  "description": "Optional description",
  "source": {
    "type": "cdn",
    "baseUrl": "https://your-cdn.com/media/",
    "corsProxy": "https://cors-anywhere.herokuapp.com/",
    "headers": {
      "User-Agent": "Kamiskaze-Player/1.0"
    }
  },
  "tracks": [
    {
      "id": "track-1",
      "title": "Track Title",
      "artist": "Artist Name",
      "audioUrl": "path/to/audio.mp3",
      "videoUrl": "path/to/video.mp4",
      "albumArt": "path/to/artwork.jpg",
      "thumbnail": "path/to/thumb.jpg",
      "description": "Track description",
      "duration": 180,
      "metadata": {
        "genre": "Genre",
        "year": 2024
      }
    }
  ],
  "metadata": {
    "genre": "Overall Genre",
    "year": 2024,
    "label": "Record Label",
    "website": "https://website.com"
  }
}
```

## GitHub Pages Setup

For GitHub Pages hosting:

1. **Create a public repository** with your media files
2. **Enable GitHub Pages** in repository settings
3. **Organize your files:**
   ```
   your-repo/
   ├── feed.json
   ├── audio/
   │   ├── track1.mp3
   │   └── track2.mp3
   ├── video/
   │   └── concert.mp4
   └── images/
       ├── album1.jpg
       └── thumb1.jpg
   ```

4. **Use this feed format:**
   ```json
   {
     "id": "my-github-feed",
     "title": "My Band's Music",
     "source": {
       "type": "cdn",
       "baseUrl": "https://username.github.io/repository-name/"
     },
     "tracks": [
       {
         "id": "track1",
         "title": "Song Title",
         "audioUrl": "audio/track1.mp3",
         "albumArt": "images/album1.jpg"
       }
     ]
   }
   ```

5. **Access your feed at:** `https://username.github.io/repository-name/feed.json`

## CORS Considerations

### GitHub Pages
- ✅ **Automatic CORS support** for public repositories
- ✅ **jsDelivr CDN fallback** if direct access fails
- ✅ **File size limits:** Up to 100MB per file

### AWS S3
```json
{
  "source": {
    "type": "s3",
    "baseUrl": "https://bucket-name.s3.amazonaws.com/path/",
    "corsProxy": "https://cors-anywhere.herokuapp.com/"
  }
}
```

### Generic CDN
```json
{
  "source": {
    "type": "generic",
    "baseUrl": "https://your-cdn.com/media/",
    "headers": {
      "Authorization": "Bearer your-token"
    }
  }
}
```

## URL Resolution

The player resolves media URLs as follows:

1. **Absolute URLs** (starting with `http://` or `https://`) are used as-is
2. **Relative URLs** are resolved against the `baseUrl`
3. **GitHub URLs** are automatically optimized using jsDelivr CDN
4. **CORS proxy** is applied if specified

## Error Handling

The player includes robust error handling:

- **CORS errors:** Automatic fallback to jsDelivr for GitHub sources
- **Media loading failures:** Graceful fallback to default album art
- **Network timeouts:** User-friendly error messages
- **Invalid formats:** Format validation with helpful suggestions

## Adding External Feeds

1. **Via UI:** Use the "Add Feed" form in the player settings
2. **Direct URL:** Enter the full URL to your feed JSON file
3. **Local testing:** Use `file://` URLs for local development

## Best Practices

### File Organization
```
cdn-root/
├── feeds/
│   ├── album1.json
│   └── album2.json
├── audio/
│   ├── mp3/
│   └── flac/
├── video/
│   ├── mp4/
│   └── webm/
└── images/
    ├── albums/
    └── thumbnails/
```

### Performance
- **Use compressed formats:** MP3 for audio, MP4 for video
- **Optimize images:** JPEG for photos, PNG for graphics
- **Enable CDN caching:** Set appropriate cache headers
- **Consider file sizes:** Keep individual files under 100MB for GitHub Pages

### CORS Configuration
For your own CDN, add these headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, HEAD, OPTIONS
Access-Control-Allow-Headers: Range, Content-Type
```

## Examples

See included example files:
- `sample-cdn-feed.json` - Basic CDN feed
- `github-pages-feed-example.json` - GitHub Pages specific
- `cdn-feed-schema.json` - Complete JSON schema

## Troubleshooting

### Common Issues

**Feed won't load:**
- Check URL accessibility in browser
- Verify JSON format validity
- Ensure CORS headers are set

**Media won't play:**
- Verify file formats are supported
- Check file paths are correct
- Test direct file access

**GitHub Pages issues:**
- Ensure repository is public
- Check GitHub Pages is enabled
- Verify file extensions are allowed

### Debug Mode
Enable browser developer console to see detailed error messages and URL resolution logs.