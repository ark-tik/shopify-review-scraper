const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function scrapeShopifyReviews(url) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Wait for potential dynamic content and scroll to load reviews
        await page.waitForTimeout(3000);

        // Scroll down to trigger any lazy loading
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight / 2);
        });

        await page.waitForTimeout(2000);

        // Scroll down more to ensure reviews are loaded
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
        });

        await page.waitForTimeout(2000);

        // First, expand all "show more" buttons to get full review content
        const showMoreButtons = await page.$$('[data-testid="review-item-show-more-button"]');
        console.log(`Found ${showMoreButtons.length} "show more" buttons`);

        for (const button of showMoreButtons) {
            try {
                await button.click();
                await page.waitForTimeout(500); // Wait for content to expand
            } catch (error) {
                console.log('Could not click show more button:', error.message);
            }
        }

        const reviews = await page.evaluate(() => {
            // Use the correct selector based on the actual HTML structure
            const reviewElements = document.querySelectorAll('[data-merchant-review]');
            console.log(`Found ${reviewElements.length} review elements`);

            return Array.from(reviewElements).map((review, index) => {
                console.log(`Processing review ${index + 1}`);

                // Extract star rating by looking at the aria-label or counting stars in the rating container
                const ratingContainer = review.querySelector('[aria-label*="out of 5 stars"]');
                let rating = '';

                if (ratingContainer) {
                    // Extract rating from aria-label like "4 out of 5 stars"
                    const ariaLabel = ratingContainer.getAttribute('aria-label');
                    const match = ariaLabel.match(/(\d+)\s+out of \d+ stars/);
                    if (match) {
                        rating = match[1];
                    }
                } else {
                    // Fallback: count filled stars within the rating container only
                    const ratingDiv = review.querySelector('.tw-flex.tw-relative.tw-space-x-0\\.5');
                    if (ratingDiv) {
                        const filledStars = ratingDiv.querySelectorAll('.tw-fill-fg-primary');
                        rating = filledStars.length.toString();
                    }
                }

                // Get review content from the paragraph with break-words class
                const content = review.querySelector('p.tw-break-words')?.textContent?.trim() || '';

                // Get store name from the heading element
                const storeName = review.querySelector('.tw-text-heading-xs.tw-text-fg-primary')?.textContent?.trim() || '';

                // Get date from the tertiary text element
                const dateElement = review.querySelector('.tw-text-body-xs.tw-text-fg-tertiary');
                const date = dateElement?.textContent?.trim() || '';

                // Get the metadata container
                const metadataContainer = review.querySelector('.tw-order-2.lg\\:tw-order-1');
                let country = '';
                let appUsageDuration = '';

                if (metadataContainer) {
                    // Get direct child divs that contain the metadata
                    const childDivs = Array.from(metadataContainer.children).filter(child =>
                        child.tagName === 'DIV' && child.textContent.trim() !== storeName
                    );

                    // Extract text from each div, cleaning up whitespace
                    const cleanTexts = childDivs
                        .map(div => div.textContent?.replace(/\s+/g, ' ').trim())
                        .filter(text => text && text !== storeName);

                    if (cleanTexts.length >= 1) {
                        country = cleanTexts[0] || '';
                    }
                    if (cleanTexts.length >= 2) {
                        appUsageDuration = cleanTexts[1] || '';
                    }
                }

                return {
                    rating: rating.toString(),
                    storeName,
                    country,
                    appUsageDuration,
                    date,
                    content,
                    helpful: '' // Not visible in the structure
                };
            });
        });

        await browser.close();
        return reviews;
    } catch (error) {
        await browser.close();
        throw error;
    }
}

function generateCSV(reviews) {
    const headers = ['Rating', 'Store Name', 'Country', 'App Usage Duration', 'Date', 'Content'];
    const csvContent = [
        headers.join(','),
        ...reviews.map(review => [
            review.rating,
            `"${review.storeName.replace(/"/g, '""')}"`,
            `"${review.country.replace(/"/g, '""')}"`,
            `"${review.appUsageDuration.replace(/"/g, '""')}"`,
            `"${review.date.replace(/"/g, '""')}"`,
            `"${review.content.replace(/"/g, '""')}"`
        ].join(','))
    ].join('\n');

    return csvContent;
}

function generateFileName(format = 'csv') {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    const timestamp = today.getTime();
    return `shopify-reviews-${dateString}-${timestamp}.${format}`;
}

function generateJSON(reviews) {
    return JSON.stringify(reviews, null, 2);
}

async function main() {
    const url = process.argv[2];
    const format = process.argv[3] || 'csv';

    if (!url) {
        console.error('Usage: node shopify-review-scraper.js <shopify-app-review-url> [csv|json]');
        console.error('Examples:');
        console.error('  node shopify-review-scraper.js "https://apps.shopify.com/flow/reviews?ratings[]=4"');
        console.error('  node shopify-review-scraper.js "https://apps.shopify.com/flow/reviews?ratings[]=4" json');
        process.exit(1);
    }

    if (!['csv', 'json'].includes(format.toLowerCase())) {
        console.error('Error: Output format must be either "csv" or "json"');
        process.exit(1);
    }

    try {
        console.log('Scraping reviews from:', url);
        const reviews = await scrapeShopifyReviews(url);

        if (reviews.length === 0) {
            console.log('No reviews found. The page structure might have changed or no reviews exist.');
            return;
        }

        let content;
        let fileName;

        if (format.toLowerCase() === 'json') {
            content = generateJSON(reviews);
            fileName = generateFileName('json');
        } else {
            content = generateCSV(reviews);
            fileName = generateFileName('csv');
        }

        const filePath = path.join(__dirname, fileName);
        fs.writeFileSync(filePath, content, 'utf8');

        console.log(`Successfully scraped ${reviews.length} reviews`);
        console.log(`Output saved to: ${fileName} (${format.toUpperCase()} format)`);

    } catch (error) {
        console.error('Error scraping reviews:', error.message);
        process.exit(1);
    }
}

main();