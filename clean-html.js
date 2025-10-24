const fs = require("fs");
const path = require("path");

const folderPath = process.argv[2] || "./"; 

// Regex patterns
// More flexible: removes any comment containing "HTTrack Website Copier"
const httrackRegex = /<!--[\s\S]*?HTTrack Website Copier[\s\S]*?-->/gi;

// Removes <meta name="generator" ...>
const generatorRegex = /<meta[^>]+name=["']generator["'][^>]*>/gi;

// Whitelisted safe meta tags
const safeMetaKeywords = ["charset", "viewport", "description", "keywords", "author", "robots"];

function cleanFile(filePath) {
  let content = fs.readFileSync(filePath, "utf-8");

  // Remove HTTrack comments
  content = content.replace(httrackRegex, "");

  // Remove <meta name="generator">
  content = content.replace(generatorRegex, "");

  // Remove IE conditional comments (optional, but useful)
  content = content.replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, "");

  // Fix trailing HTTrack comments after </html>
  content = content.replace(/<\/html>\s*<!--[\s\S]*?-->\s*$/gi, "</html>");

  // Process meta tags line by line
  const lines = content.split(/\r?\n/);
  const cleanedLines = [];
  const seenMeta = new Set();

  for (let line of lines) {
    if (line.toLowerCase().includes("<meta")) {
      const lower = line.toLowerCase();
      const match = safeMetaKeywords.find((kw) => lower.includes(kw));

      if (match) {
        if (!seenMeta.has(match)) {
          seenMeta.add(match);
          cleanedLines.push(line);
        }
      }
      // Skip non-whitelisted meta tags
    } else {
      cleanedLines.push(line);
    }
  }

  // Save cleaned content
  fs.writeFileSync(filePath, cleanedLines.join("\n"), "utf-8");
  console.log(`✅ Cleaned: ${filePath}`);
}

function scanDir(dir) {
  fs.readdirSync(dir).forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      scanDir(filePath); // Recurse into subfolders
    } else if (file.toLowerCase().endsWith(".html")) {
      cleanFile(filePath);
    }
  });
}

scanDir(folderPath);
console.log("🎉 All HTML files cleaned!");
