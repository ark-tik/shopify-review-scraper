# Shopify Review Scraper

A Node.js tool that scrapes Shopify app reviews and exports them to CSV format using Puppeteer.

## Features

- Scrapes reviews from Shopify app pages
- Extracts review content, ratings, and metadata
- Exports data to CSV format
- Handles dynamic content loading and pagination
- Expands "show more" buttons to get full review content

## Prerequisites

- Node.js (version 14 or higher)
- npm (Node Package Manager)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd shopify-review-scraper
```

2. Install dependencies:
```bash
npm install
```

## Usage

### Basic Usage

1. Run the scraper with a URL:
```bash
node shopify-review-scraper.js "https://apps.shopify.com/flow/reviews?ratings[]=4"
```

2. Specify output format (CSV or JSON):
```bash
node shopify-review-scraper.js "https://apps.shopify.com/flow/reviews?ratings[]=4" json
```

3. Scrape multiple pages (1-20 pages):
```bash
node shopify-review-scraper.js "https://apps.shopify.com/flow/reviews?ratings[]=4" json 3
```

### Command Line Arguments

```
node shopify-review-scraper.js <url> [format] [pages]
```

- `url`: Shopify app review URL (required)
- `format`: Output format - `csv` or `json` (default: csv)
- `pages`: Number of pages to scrape, 1-20 (default: 1)

### Examples

```bash
# Scrape one page, output to CSV
node shopify-review-scraper.js "https://apps.shopify.com/flow/reviews?ratings[]=4"

# Scrape one page, output to JSON
node shopify-review-scraper.js "https://apps.shopify.com/flow/reviews?ratings[]=4" json

# Scrape 5 pages, output to JSON
node shopify-review-scraper.js "https://apps.shopify.com/flow/reviews?ratings[]=4" json 5
```

### How it works

The scraper will:
- Launch a headless browser
- Navigate to the specified URL (and subsequent pages if specified)
- Load and expand review content to avoid truncation
- Extract review data including ratings, content, store info, and metadata
- Combine all reviews from multiple pages
- Save results to a timestamped file

## Output

The scraper generates a CSV file containing the scraped review data with relevant fields such as:
- Review content
- Star ratings
- Reviewer information
- Review dates
- Other metadata

## Dependencies

- **puppeteer**: ^21.0.0 - For web scraping and browser automation

## License

MIT

## Notes

- The scraper runs in headless mode by default
- It includes delays and scrolling to handle dynamic content loading
- Make sure to comply with the website's terms of service and robots.txt when scraping