import fs from "fs";
import { XMLParser } from "fast-xml-parser";

const FEED_URL = "https://kanishkkunal.com/rss.xml";
const TAG_OPEN = "<!-- FEED-START -->";
const TAG_CLOSE = "<!-- FEED-END -->";

const xmlParser = new XMLParser({
  ignoreAttributes: true,
  trimValues: true,
});

async function fetchArticles() {
  const response = await fetch(FEED_URL);

  if (!response.ok) {
    throw new Error(`Failed to fetch RSS feed: ${response.status}`);
  }

  const xmlText = await response.text();
  const parsed = xmlParser.parse(xmlText);

  const items = parsed?.rss?.channel?.item;
  if (!items) return "";

  const itemsArray = Array.isArray(items) ? items : [items];

  const sortedItems = itemsArray.sort((a, b) => {
    const dateA = new Date(a.pubDate || 0);
    const dateB = new Date(b.pubDate || 0);
    return dateB - dateA;
  });

  return sortedItems
    .slice(0, 5)
    .map(({ title, link }) => `- [${title}](${link})`)
    .join("\n");
}

async function main() {
  const readme = fs.readFileSync("./README.md", "utf8");

  const start = readme.indexOf(TAG_OPEN);
  const end = readme.indexOf(TAG_CLOSE);

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("README feed markers not found or malformed");
  }

  const before = readme.slice(0, start + TAG_OPEN.length);
  const after = readme.slice(end);

  const posts = await fetchArticles();

  const updated = `${before}\n${posts}\n${after}`;

  fs.writeFileSync("./README.md", updated.trim() + "\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
