const http = require('http');
const https = require('https');

// Function to fetch HTML content from Time.com
function fetchTimeStories(callback) {
    https.get('https://time.com', (res) => {
        let data = '';

        // A chunk of data has been received
        res.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received
        res.on('end', () => {
            callback(data);
        });

    }).on('error', (err) => {
        console.error('Error fetching HTML:', err.message);
        callback(null);
    });
}

// Function to strip HTML tags from a string
function stripHtmlTags(str) {
    return str.replace(/<\/?[^>]+(>|$)/g, "").trim();
}

// Function to extract the latest six stories using refined string operations
function extractStories(htmlContent) {
    const stories = [];
    let searchStart = htmlContent.indexOf('<main'); // Target main content area
    if (searchStart === -1) searchStart = 0; // Fallback if <main> is not found

    // Loop to extract six stories
    for (let i = 0; i < 6; i++) {
        // Find the start of an article/story
        const articleStart = htmlContent.indexOf('<article', searchStart);
        if (articleStart === -1) break; // Exit if no more articles are found

        // Find the title within the article tag
        const titleStart = htmlContent.indexOf('<h2', articleStart);
        if (titleStart === -1) break; // Exit if no more titles are found
        const titleTagStart = htmlContent.indexOf('>', titleStart) + 1;
        const titleTagEnd = htmlContent.indexOf('</h2>', titleTagStart);
        let title = htmlContent.substring(titleTagStart, titleTagEnd).trim();
        
        // Strip HTML tags from the title
        title = stripHtmlTags(title);

        // Find the link within the article tag
        const linkStart = htmlContent.indexOf('href="', articleStart) + 6;
        const linkEnd = htmlContent.indexOf('"', linkStart);
        let link = htmlContent.substring(linkStart, linkEnd).trim();

        // Ensure the link is correctly formatted
        if (!link.startsWith('http')) {
            link = `https://time.com${link}`;
        }

        if (title && link) {
            stories.push({ title: title, link: link });
        }

        // Update searchStart to continue searching for the next story, move past the current article
        searchStart = articleStart + 1;
    }

    return stories;
}

// Create a simple HTTP server
const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/getTimeStories') {
        fetchTimeStories((htmlContent) => {
            if (htmlContent) {
                const stories = extractStories(htmlContent);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(stories));
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error fetching stories');
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

// Start the server on port 3000
server.listen(3000, () => {
    console.log('Server is listening on port 3000');
});
