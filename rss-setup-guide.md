# RSS Feed Setup Guide for Linkity Link

## Option 1: Manual RSS Generation (Recommended)

1. **Open the RSS Generator**: Open `generate-rss.html` in your browser
2. **Generate RSS**: Click the "Generate RSS Feed" button
3. **Download**: The `rss.xml` file will be downloaded automatically
4. **Upload**: Upload the `rss.xml` file to your website root
5. **Access**: Your RSS feed will be available at `https://linkitylink.lol/rss.xml`

## Option 2: Using RSS.app (Third-party Service)

1. Go to [RSS.app](https://rss.app/)
2. Create a new RSS feed
3. Set the source to your Raindrop.io collection
4. Configure the feed settings
5. Get the RSS feed URL and add it to your site

## Option 3: Using Zapier or IFTTT

1. Set up a Zapier/IFTTT automation
2. Trigger: New bookmark in Raindrop.io
3. Action: Update RSS feed
4. Connect to your website

## Option 4: GitHub Actions (Automatic)

If you have Node.js installed:

1. Install dependencies: `npm install`
2. Generate RSS: `npm run generate-rss`
3. The GitHub Action will automatically update the RSS feed every 6 hours

## Testing Your RSS Feed

1. Use an RSS reader like Feedly, Inoreader, or NetNewsWire
2. Add your feed URL: `https://linkitylink.lol/rss.xml`
3. Verify that new bookmarks appear in the feed

## RSS Feed Features

- **Title**: Linkity Link
- **Description**: A curated collection of interesting links by Brad Barrish
- **Language**: English
- **Update Frequency**: Every 6 hours (with GitHub Actions) or manual
- **Items**: Up to 50 most recent bookmarks
- **Content**: Includes title, link, description, and publication date

## Troubleshooting

- **CORS Issues**: The client-side generator may have CORS issues. Use the manual generation method.
- **API Limits**: Raindrop.io has rate limits. The generator respects these limits.
- **File Upload**: Make sure to upload the `rss.xml` file to your website's root directory. 