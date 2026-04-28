# Work Log

## 2026-04-28

### Platform Shift

- Reworked the product from a single voice tool into a multi-tool `ko-workspace` platform
- Added a shared static app shell for home and tool pages
- Added dedicated static tool pages under `tools/{slug}/`
- Updated titles, descriptions, canonical URLs, and OG URLs per tool page

### Implemented Tools

- Voice: speech-to-text and script builder
- Text: AI markdown cleanup, character counter, line-break cleaner, extractor, duplicate-line remover, find-replace, case converter, text diff
- Image: QR generator, image resizer, image converter, image compressor
- PDF: merge, split, extract pages, image-to-pdf, pdf-to-image
- Subtitle: SRT cleaner, SRT/VTT converter, subtitle timing shift

### Security And Deployment

- Kept the initial scope browser-only for Cloudflare Pages static deployment
- Updated `_headers` CSP to allow the minimum required browser-side tool libraries
- Added `worker-src` for PDF rendering worker usage
- Updated GitHub Actions deploy flow to copy the `tools/` directory into `.cloudflare-dist/`
- Updated `site.webmanifest` for the `ko-workspace` platform
- Expanded `sitemap.xml` to include tool pages

### Notes

- Initial advanced features such as OCR, background removal, PDF password removal, PDF compression, and AI summary/translation remain excluded from the static-only launch scope
- Ad slots remain separated from the work surface and hidden when unused

### Webcam Recorder Update

- Added optional webcam background effects: blur, solid color, and user-uploaded image background
- Kept background removal/transparency out of scope
- Loaded MediaPipe segmentation only when a background effect is enabled
- Kept uploaded background images local to the browser; files are not sent to an application server
- Updated CSP to allow the pinned MediaPipe CDN and WASM execution needed for browser-side segmentation
