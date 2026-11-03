# signal/noise

the x articles you bookmarked and ghosted, ranked weekly. tech, gtm, growth. no larp.

A plain static site. No login, no backend, no database. Hosted on GitHub Pages.

## Files
- `index.html`, `js/home.js`, `styles.css`: the site
- `highlight.html`: "pay to get highlighted" page (bookings happen by X DM)
- `data/articles.json`: the curated articles
- `data/sponsored.json`: paid highlights currently running (starts empty)

## Weekly update
Edit `data/articles.json` (add new articles, update saves/views). The "this week" boards use the 7 days up to the newest article.

## Adding a paid highlight
Copy an article object into `data/sponsored.json` and add `"tier": "frontpage"` or `"tier": "spotlight"`. Remove it after 7 days.

"Mark read" is saved in each visitor's browser (localStorage).
