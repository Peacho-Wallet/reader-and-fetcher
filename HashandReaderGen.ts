import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import * as crypto from 'crypto';
import * as fs from 'fs';
import fetch from 'node-fetch';

async function generateHashAndReaderView(url: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }
  const data = await response.text();
  const dataWithoutStyles = data.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  const dom = new JSDOM(dataWithoutStyles, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  const hash = crypto.createHash('sha256').update(url).digest('hex');
  const directoryPath = 'reader_views';
  const filePath = `${directoryPath}/${hash}.html`;

  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath);
  }

  const document = dom.window.document;

  const contentElement = document.createElement('div');
  contentElement.innerHTML = article.content;

  const paragraphs = contentElement.getElementsByTagName('p');
  const paragraphsArray = Array.from(paragraphs);

  const imgElements = Array.from(paragraphsArray[0].querySelectorAll('img'));

  imgElements.forEach((imgElement) => {
    imgElement.setAttribute('style', 'max-width: 100%');
  });

  paragraphsArray.forEach((paragraph, index) => {
    if (index !== 0) {
      const imgElements = Array.from(paragraph.querySelectorAll('img'));
      imgElements.forEach((imgElement) => {
        const wrapperElement = document.createElement('div');
        wrapperElement.setAttribute('style', 'text-align: center; margin-top: 1rem; margin-bottom: 1rem;');
        wrapperElement.appendChild(imgElement);
        paragraph.appendChild(wrapperElement);
      });
    }
  });

  const formattedHtml = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${article.title}</title>
        <link href='https://fonts.googleapis.com/css?family=Lexend Deca' rel='stylesheet'>
      </head>
      <body>
        <h1>${article.title}</h1>
        ${contentElement.innerHTML}
      </body>
      <style>
        body {
          padding: 0 28%;
          text-align: center;
          font-family: 'Lexend Deca', sans-serif;
          line-height: 1.6;
        }
      </style>
    </html>
  `;

  fs.writeFileSync(filePath, formattedHtml, 'utf8');
  console.log('Reader view stored successfully.');
}

const url1 = 'https://www.politico.eu/article/turkey-sweden-nato-jens-stoltenberg-agrees-to-back-swedens-membership-bid/';
const url2 = 'https://news.yahoo.com/tuberville-blockade-over-abortion-policy-120331767.html';
const url3 = 'https://www.washingtonpost.com/national-security/2023/07/06/trump-documents-case-prosecutor-threats/';

generateHashAndReaderView(url1);
generateHashAndReaderView(url2);
generateHashAndReaderView(url3);
