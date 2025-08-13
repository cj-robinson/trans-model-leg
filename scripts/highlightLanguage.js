import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

// Get input filename from command line arguments or use default
const inputFileName = process.argv[2] || 'fiwsa_bills_updated.csv';
const originalFileName = process.argv[3] || 'original_act.text';

// Path configuration
const INPUT_CSV = path.join('static', inputFileName);
const ORIGINAL_ACT = path.join('static', originalFileName);

// Generate output filename based on input filename
const outputFileName = inputFileName.replace('.csv', '_with_highlights.csv');
const OUTPUT_CSV = path.join('static', outputFileName);

// Log the configuration
console.log('📄 Configuration:');
console.log(`   Input CSV: ${INPUT_CSV}`);
console.log(`   Original Act: ${ORIGINAL_ACT}`);
console.log(`   Output CSV: ${OUTPUT_CSV}`);

/**
 * Cleans text by removing HTML, numbers, parenthetical content, and punctuation
 */
function cleanText(text) {
  // Remove style tags and their contents
  let cleaned = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  // Remove all HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, "");
  
  // Handle line numbers at the beginning of lines (like "1.1 ")
  cleaned = cleaned.replace(/^\s*\d+\.\d+\s+/gm, "");
  
  // Handle line numbers in the middle of text (like " 1.11 ")
  cleaned = cleaned.replace(/\s+\d+\.\d+\s+/g, " ");
  
  // Fix words that have numbers at the end followed by space (like "desig6 nated")
  cleaned = cleaned.replace(/(\w+)(\d+)(\s+)(\w+)/g, "$1$4");
  
  // Fix words with numbers embedded within them
  cleaned = cleaned.replace(/(\d+)(\w+)/g, "$2"); // Like "1initiated"
  cleaned = cleaned.replace(/(\w+)(\d+)(\w+)/g, "$1$3"); // Like "desig6nated"
  cleaned = cleaned.replace(/(\w*\s+\w*)(\d+)(\w+)/g, "$1$3"); // Like "ust be 1initiated"
  
  // Remove remaining numbers with decimal points and standalone numbers
  cleaned = cleaned.replace(/\b\d+\.\d+\b|\b\d+\b/g, "");
  
  // Remove any content in parentheses
  cleaned = cleaned.replace(/\([^)]*\)/g, "");
  
  // Remove punctuation
  cleaned = cleaned.replace(/[.,;:!?()"']/g, " ");
  
  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  
  return cleaned;
}

/**
 * Finds matching phrases between source and target text
 */
function findMatchingPhrases(sourceText, targetText) {
  const sourceWords = sourceText.toLowerCase().split(/\s+/).filter((word) => word);
  const targetWords = targetText.toLowerCase().split(/\s+/).filter((word) => word);

  let matches = [];
  const minLength = 5; // 5-word phrases
  
  // Create a set of n-grams from the target text for faster lookup
  const targetNgrams = new Set();
  for (let i = 0; i <= targetWords.length - minLength; i++) {
    targetNgrams.add(targetWords.slice(i, i + minLength).join(" "));
  }
  
  // Find matching n-grams in the source text without skipping
  for (let i = 0; i <= sourceWords.length - minLength; i++) {
    const ngram = sourceWords.slice(i, i + minLength).join(" ");
    if (targetNgrams.has(ngram)) {
      // Try to extend the match
      let j = minLength;
      while (
        i + j < sourceWords.length &&
        i + j < targetWords.length &&
        sourceWords[i + j].toLowerCase() === targetWords[i + j].toLowerCase()
      ) {
        j++;
      }
      matches.push({
        start: i,
        end: i + j - 1,
      });
      // No longer skip ahead - allow overlapping matches
    }
  }
  
  // Sort matches by start position
  matches.sort((a, b) => a.start - b.start);
  
  // Merge overlapping matches
  matches = mergeOverlappingMatches(matches);
  
  return matches;
}

/**
 * Merges overlapping matches into single spans
 */
function mergeOverlappingMatches(matches) {
  if (matches.length <= 1) return matches;
  
  const mergedMatches = [matches[0]];
  
  for (let i = 1; i < matches.length; i++) {
    const current = matches[i];
    const previous = mergedMatches[mergedMatches.length - 1];
    
    // Check if current match overlaps with previous match
    if (current.start <= previous.end + 1) {
      // Merge by extending the end position of the previous match
      previous.end = Math.max(previous.end, current.end);
    } else {
      // No overlap, add as new match
      mergedMatches.push(current);
    }
  }
  
  return mergedMatches;
}

/**
 * Wraps matched phrases with highlight spans
 */
function wrapWithHighlights(text, matches) {
  if (matches.length === 0) {
    return `<p>${text}</p>`;
  }
  const words = text.split(/\s+/);
  let html = "";
  let lastIndex = 0;
  matches.forEach((match) => {
    // Add text before match
    if (match.start > lastIndex) {
      html += words.slice(lastIndex, match.start).join(" ") + " ";
    }
    // Add matched text with span
    html += `<span class="copied-language">${words.slice(match.start, match.end + 1).join(" ")}</span> `;
    lastIndex = match.end + 1;
  });
  // Add remaining text
  if (lastIndex < words.length) {
    html += words.slice(lastIndex).join(" ");
  }
  return `<p>${html.trim()}</p>`;
}

/**
 * Creates HTML with highlighted phrases matching the original text
 */
function createHighlightedHtml(text, originalText) {
  // Clean both texts for matching and display
  const cleanedText = cleanText(text);
  const cleanedOriginal = cleanText(originalText);
  
  // Find matching phrases using the cleaned texts
  const matches = findMatchingPhrases(cleanedText, cleanedOriginal);
  
  // Create HTML with highlighted phrases using the cleaned text
  return wrapWithHighlights(cleanedText, matches);
}

async function preprocessBills() {
  console.log('🔍 Reading original act text...');
  const originalActText = fs.readFileSync(ORIGINAL_ACT, 'utf-8');
  
  console.log('📊 Reading bill data from CSV...');
  const billsCSV = fs.readFileSync(INPUT_CSV, 'utf-8');
  const parsedBills = Papa.parse(billsCSV, { header: true });
  
  console.log(`🔄 Processing ${parsedBills.data.length} bills...`);
  const processedBills = parsedBills.data
    .filter(bill => bill.state && bill.text && bill.text.trim())
    .map((bill, index) => {
      if (index % 10 === 0) {
        console.log(`   ⚙️ Processed ${index} of ${parsedBills.data.length} bills`);
      }
      
      // Generate highlighted HTML
      const html = createHighlightedHtml(bill.text, originalActText);
      
      return {
        ...bill,
        highlighted_html: html
      };
    });
  
  console.log('💾 Writing processed bills to CSV...');
  const outputCSV = Papa.unparse(processedBills);
  fs.writeFileSync(OUTPUT_CSV, outputCSV);
  
  console.log('✅ Processing complete!');
  console.log(`📁 Output saved to: ${OUTPUT_CSV}`);
}

preprocessBills().catch(err => {
  console.error('❌ Error processing bills:', err);
  process.exit(1);
});