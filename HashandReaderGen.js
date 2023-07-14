const { createWindow } = require('domino');
const readability = require('readability-js');
const crypto = require('crypto');
const fs = require('fs');
const fetch = require('node-fetch');

async function generateHashAndReaderView(url) {
  const window = createWindow('');
  const { document } = window;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }
    const data = await response.text();

    document.body.innerHTML = data;
    const reader = new readability.Readability(document);
    const parsedArticle = reader.parse();

    const hash = crypto.createHash('sha256').update(data).digest('hex');
    const filePath = `reader_views/${hash}.html`;

    fs.writeFile(filePath, parsedArticle.content, (err) => {
      if (err) {
        console.error('Error storing reader view:', err);
        return;
      }

      console.log('Reader view stored successfully.');
    });
  } catch (err) {
    console.error('Error fetching URL:', err);
  }
}

// Usage
const url = 'https://www.washingtonpost.com/national-security/2023/07/06/trump-documents-case-prosecutor-threats/'; // Replace with your URL
generateHashAndReaderView(url);
