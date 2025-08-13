import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

// Path configuration
const INPUT_CSV = path.join('static', 'fiwsa_bills_updated.csv');
const ORIGINAL_ACT = path.join('static', 'original_act.txt');
const OUTPUT_CSV = path.join('static', 'fiwsa_bills_with_highlights.csv');

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

  const matches = [];
  const minLength = 5; // 5-word phrases
  
  // Create a set of n-grams from the target text for faster lookup
  const targetNgrams = new Set();
  for (let i = 0; i <= targetWords.length - minLength; i++) {
    targetNgrams.add(targetWords.slice(i, i + minLength).join(" "));
  }
  
  // Find matching n-grams in the source text
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
      // Skip ahead past this match
      i += j - 1;
    }
  }
  return matches;
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
  // Clean both texts for matching
  const cleanedText = cleanText(text);
  const cleanedOriginal = cleanText(originalText);
  
  // Create word position mappings from original to cleaned
  const originalWords = text.split(/\s+/);
  const cleanedWords = cleanedText.split(/\s+/).filter(word => word);
  
  // Build a mapping of cleaned text positions to original text positions
  const positionMap = [];
  let cleanedIndex = 0;
  
  for (let i = 0; i < originalWords.length; i++) {
    // Skip words that would be removed by cleaning (numbers, punctuation only words, etc.)
    const cleanedWord = cleanText(originalWords[i]);
    if (cleanedWord && cleanedWord.trim().length > 0) {
      positionMap[cleanedIndex] = i;
      cleanedIndex++;
    }
  }
  
  // Find matching phrases using the cleaned texts
  const cleanedMatches = findMatchingPhrases(cleanedText, cleanedOriginal);
  
  // Map cleaned text positions back to original text positions
  const originalMatches = cleanedMatches.map(match => ({
    start: positionMap[match.start],
    end: positionMap[match.end]
  }));
  
  // Create HTML with highlighted phrases
  return wrapWithHighlights(text, originalMatches);
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