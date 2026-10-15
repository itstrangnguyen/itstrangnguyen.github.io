# Trang Nguyen — Portfolio

Plain HTML + one CSS file. No build step. Open `index.html` in a browser to preview.

Style: dark theme, font Be Vietnam Pro (Google Fonts). All colours sit at the top of `style.css`.

## Folders

```
index.html            Home: Automation + Strategy & Campaigns + Contact
about.html            Background, skills, experience
style.css             All styles. Project accent colours under "Accents"
script.js             Shows a dashed box for any image file still missing
projects/
  _template.html      Copy this for every new case study
  feedback-categorizer.html
assets/
  images/<project>/   Screenshots and visuals
  videos/             MP4 files (under ~10 MB each)
  pdf/                Brand book, Meta Ads plan (downloads)
  cv/                 CV_TrangNguyen.pdf
  fitfrisch/          The landing page itself
```

## Add a project

1. Copy `projects/_template.html` and rename it.
2. Set the accent class on `<body>`. For a new colour, add one line to "Accents" in `style.css`.
3. Fill the blocks; delete the ones you don't need.
4. On `index.html`, copy the commented `NEW PROJECT` card and fill it in.

## Add an image

Save the file under the path shown in the dashed box. It appears on reload; no HTML edit needed.

## Files still missing

The site shows a dashed box with the expected path wherever a file is missing.

**About**
- `assets/images/trang.jpg` (portrait, about 800 × 1000 px)

**Feedback Categorizer**
- `assets/images/feedback/slack-app-myslack.png`
- `assets/images/feedback/slack-message-negative.png`
- `assets/images/feedback/slack-message-positive.png`
- Gemini agent prompt: paste it into `projects/feedback-categorizer.html` and delete the yellow box.

**mai.premiumlinen**
- `assets/videos/mai-dressed-for-saigon-heat.mp4` (until then, the video cover shows)
- `assets/images/mai/carousel-1.jpg` … `carousel-6.jpg`
- `assets/images/mai/content-cockpit-sheet.png` (the sheet after Gemini filled it in)
- Owner's feedback: paste it into the quote and delete the yellow box.
- Owner's OK for the product photos: delete the yellow box once you have it.

**Molly Mutt**
- `assets/videos/molly-reel-1.mp4`, `molly-reel-2.mp4`, `molly-reel-3.mp4`
- `assets/images/molly/review-static.jpg`, `review-story.jpg`, `review-carousel.jpg`
- Results after 18 Oct 2026: replace the yellow box.

**PDF downloads**
- `assets/pdf/mai-premiumlinen-brand-book.pdf`: fix the lorem ipsum on the Iconography page and the typos before publishing.

## Publish (free)

GitHub Pages: create a repository, upload all files, then Settings → Pages → Deploy from branch `main`, folder `/root`. Your site goes live at `https://<username>.github.io/<repository>/`.
