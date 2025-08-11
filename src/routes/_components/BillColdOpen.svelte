<script>
  import { onMount, afterUpdate } from "svelte";
  import { scaleLinear, scaleSqrt } from "d3-scale";
  import { extent, min, max } from "d3-array";
  import { fly, fade } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import * as d3 from "d3";
  import Papa from "papaparse";
  import { flip } from "svelte/animate";

  export let step;

  let billsData = [];
  let originalActHTML = "";
  let montanaActHTML = "";
  let originalActText = "";
  let montanaActText = "";

  let processedBills = [];
  // Bill objects for display, each with an id and html
  let originalBill = { id: "original", html: "", type: "original" };
  let montanaBill = { id: "montana-viz", html: "", type: "montana" };

  // Function to generate 5-word n-grams from text
  function generateNGrams(text, n = 5) {
    if (!text) return [];
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2); // Only words with 3+ characters
    const ngrams = [];
    for (let i = 0; i <= words.length - n; i++) {
      ngrams.push(words.slice(i, i + n).join(" "));
    }
    return ngrams;
  }

  // Function to create visualization blocks from HTML content
  function createVisualizationBlocks(htmlContent) {
    if (!htmlContent) return [];

    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

    // Extract character data with their types
    const characters = [];

    function traverseNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        const parent = node.parentElement;
        const isRegular = parent && parent.classList.contains("regular-text");
        const isCopied = parent && parent.classList.contains("copied-language");

        // Default to regular if no specific class found
        const type = isCopied ? "copied" : "regular";

        for (let i = 0; i < text.length; i++) {
          characters.push({
            char: text[i],
            type: type,
          });
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        for (let child of node.childNodes) {
          traverseNode(child);
        }
      }
    }

    traverseNode(tempDiv);

    const totalChars = characters.length;
    if (totalChars === 0) return [];

    const charsPerRow = Math.ceil(totalChars / 20);
    const rows = [];

    for (let rowIndex = 0; rowIndex < 20; rowIndex++) {
      const startIndex = rowIndex * charsPerRow;
      const endIndex = Math.min(startIndex + charsPerRow, totalChars);
      const rowChars = characters.slice(startIndex, endIndex);

      // Skip empty rows
      if (rowChars.length === 0) continue;

      // Group consecutive characters of the same type into segments
      const segments = [];
      let currentSegment = null;

      for (let char of rowChars) {
        if (!currentSegment || currentSegment.type !== char.type) {
          if (currentSegment) segments.push(currentSegment);
          currentSegment = {
            type: char.type,
            count: 1,
          };
        } else {
          currentSegment.count++;
        }
      }

      if (currentSegment) segments.push(currentSegment);

      // Calculate proportional widths
      const totalRowChars = rowChars.length;
      const segmentsWithWidths = segments.map((segment) => ({
        type: segment.type,
        width: (segment.count / totalRowChars) * 100, // percentage
      }));

      rows.push({
        index: rowIndex,
        segments: segmentsWithWidths,
        totalChars: totalRowChars,
      });
    }

    return rows;
  }

  // Function to highlight copied language in bill text
  function highlightCopiedLanguage(billText, originalText) {
    const originalNGrams = new Set(generateNGrams(originalText));

    // Split text into tokens (words and non-words)
    const tokens = billText.split(/(\s+|[^\w\s]+)/);
    const words = [];
    const tokenMap = [];

    // Build a map of words to their token indices - only meaningful words
    tokens.forEach((token, index) => {
      const cleanWord = token.toLowerCase().replace(/[^\w]/g, "");
      if (cleanWord && cleanWord.length > 2) { // Only words with 3+ characters
        words.push(cleanWord);
        tokenMap.push(index);
      }
    });

    // Find non-overlapping matching 5-word sequences
    const highlightedPositions = new Set();
    let matchCount = 0;
    
    for (let i = 0; i <= words.length - 5; i++) {
      // Skip if any position in this 5-word window is already highlighted
      let canHighlight = true;
      for (let j = i; j < i + 5; j++) {
        if (highlightedPositions.has(j)) {
          canHighlight = false;
          break;
        }
      }
      
      if (canHighlight) {
        const ngram = words.slice(i, i + 5).join(" ");
        if (originalNGrams.has(ngram)) {
          matchCount++;
          // Mark all 5 positions as highlighted
          for (let j = i; j < i + 5; j++) {
            highlightedPositions.add(j);
          }
        }
      }
    }

    console.log(`Found ${matchCount} matching 5-word sequences, ${highlightedPositions.size} words highlighted`);

    // Apply highlighting to tokens
    let wordPosition = 0;
    const result = tokens.map((token, index) => {
      const cleanWord = token.toLowerCase().replace(/[^\w]/g, "");
      if (cleanWord && cleanWord.length > 2) {
        const isHighlighted = highlightedPositions.has(wordPosition);
        wordPosition++; // Increment for next word
        
        if (isHighlighted) {
          return `<span class="copied-language">${token}</span>`;
        }
      }
      return `<span class="regular-text">${token}</span>`;
    });

    return result.join("");
  }

  onMount(async () => {
    // Fetch and parse CSV
    const billsResponse = await fetch("/fiwsa_bills_updated.csv");
    const billsCsvText = await billsResponse.text();
    const parsed = Papa.parse(billsCsvText, { header: true });
    billsData = parsed.data.filter(
      (bill) =>
        bill.state && bill.text && bill.text.trim()
    );

    const originalActTextResponse = await fetch("/original_act.txt");
    originalActText = await originalActTextResponse.text();

    const montanaActTextResponse = await fetch("/montana_act.txt");
    montanaActText = await montanaActTextResponse.text();

    const originalActHTMLResponse = await fetch("/original_act.html");
    originalActHTML = await originalActHTMLResponse.text();
    originalBill = { id: "original", html: originalActHTML, type: "original" };

    const montanaActHTMLResponse = await fetch("/montana_act.html");
    montanaActHTML = await montanaActHTMLResponse.text();
    montanaBill = { id: "montana", html: montanaActHTML, type: "montana" };

    // Process bills with copied language highlighting
    processedBills = billsData.map((bill, i) => {
      // Remove HTML tags from original text if exists
      let cleanText = bill.text.replace(/<[^>]*>/g, "");
      // Remove line numbers at the start of lines (e.g., '  12 ', '12.', '12:')
      cleanText = cleanText.replace(/^[ \t]*\d{1,4}[\.\:\)]?\s+/gm, "");
      // Do not truncate; let CSS handle overflow
      const highlightedText =
        "<div>" +
        highlightCopiedLanguage(cleanText, originalActText) +
        "</div>";
      const proccessedText = createVisualizationBlocks(highlightedText);
      console.log(proccessedText);
      return {
        ...bill,
        id:
          bill.id ||
          bill.bill_number ||
          bill.state + "-" + (bill.bill_number || i),
        visualizationData: proccessedText,
        type: "visualization",
      };
    });
  });

  let bills = [originalBill];

  let allBills = [];
  let montanaVisualizationBlocks = [];

  $: {
    let newBills = [];
    if (step >= 0 && step <= 2) {
      newBills.push(originalBill);
    }
    if (step >= 1 && step <= 4) {
      newBills.push(montanaBill);
    }
    if (step >= 4) {
      // Create visualization for Montana bill and add it as a special bill type
      if (montanaBill.html) {
        montanaVisualizationBlocks = createVisualizationBlocks(
         highlightCopiedLanguage(montanaActText, originalActText)
        );
        
        // Add visualization as a special bill object
        newBills.push({
          id: "montana-viz",
          html: "", // Will be handled specially in template
          type: "visualization",
          visualizationData: montanaVisualizationBlocks,
        });
      }
    }
    if (step >= 5) {
      newBills.push(...processedBills);
    }
    bills = newBills;
  }

  afterUpdate(() => {
    // Fade out: select all fade-out spans, cascade by index
    d3.selectAll('[class^="ngram-text-fade-out-"]')
      .transition()
      .delay((d, i) => i * 100)
      .duration(100)
      .style("color", step >= 2 ? "transparent" : "black");

    // Fade in: select all fade-in spans, cascade by index
    d3.selectAll('[class^="ngram-text-fade-in-"]')
      .transition("y")
      .delay((d, i) => i * 100)
      .duration(100)
      .style("color", step >= 2 ? "green" : "transparent");

    d3.selectAll('[class^="ngram-text-fade-in-"]')
      .transition("x")
      .duration(2000)
      .style("background", step >= 3 ? "green" : "transparent");

    d3.selectAll(".montana-bill .regular-text")
      .style("background", step >= 3 ? "transparent" : undefined) // Set initial state
      .transition()
      .duration(2000)
      .style("background", step >= 3 ? "grey" : undefined);
  });

  let width;
  let height;
</script>

<div
  class="chart-container"
  bind:offsetWidth={width}
  bind:offsetHeight={height}
>
  <div class="bill-row" class:grid-layout={step >= 5}>
    {#each bills as bill, index (bill.id)}
      <div
        class="bill"
        class:processed-bill={step>=4 && bill.type === "visualization"}                      

        animate:flip={{ duration: 800, easing: cubicOut }}
        in:fly={{
          x: step >= 5 ? 0 : bill.type === "original" ? -200 : 200,
          y: step >= 5 ? 100 : 0,
          duration: 500,
          delay: step >= 5 ? index * 100 : 500,
        }}
        out:fly={{ x: bill.type === "original" ? -200 : 200, duration: 500 }}
      >
        <div class="bill-content" class:montana-bill={bill.type === "montana"}>
          {#if bill.type === "visualization"}
            {#if bill.visualizationData && bill.visualizationData.length > 0}
              <div class="visualization-container">
                {#each bill.visualizationData as row}
                  <div class="visualization-row">
                    {#each row.segments as segment}
                      <div
                        class="visualization-segment"
                        class:segment-regular={segment.type === "regular"}
                        class:segment-copied={segment.type === "copied"}
                        style="width: {segment.width}%"
                      ></div>
                    {/each}
                  </div>
                {/each}
              </div>
            {/if}
          {:else}
            {@html bill.html}
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  /* original bill styling */

  :global(h1.header) {
    font-weight: 200;
    text-align: center;
    line-height: 0.5;
    opacity: 1 !important;
  }

  :global(.leg-desc) {
    display: flex;
    justify-content: space-between;
    align-items: center;
    opacity: 1 !important;
  }
  :global(.line) {
    display: flex;
    align-items: baseline;
  }

  :global(.montana-bill p) {
    color: gray;
  }

  :global(.montana-bill [class^="ngram-text-fade-in-"]) {
    color: transparent;
  }

  :global(.line-num) {
    min-width: 2.2em;
    text-align: left;
    flex-shrink: 0;
    color: #888;
    font-variant-numeric: tabular-nums;
    line-height: 0;
    vertical-align: baseline;
    display: inline-block;
    opacity: 1 !important;
  }

  .chart-container {
    height: 80vh;
    max-width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 80vh;
    flex-direction: column;
    overflow: auto;
    transition: all 0.8s ease;
  }

  .chart-container:has(.grid-layout) {
    align-items: start;
    padding: 0;
    height: 100vh;
    min-height: 100vh;
    overflow-y: auto;
  }

  .bill-row {
    transition: all 0.8s ease;
  }

  .bill-row.grid-layout {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 15px;
    max-width: 95vw;
    width: 100%;
    margin: 0 auto;
    padding: 20px;
    box-sizing: border-box;
  }

  .bill {
    border: 1px solid black;
    width: 300px;
    height: 400px;
    padding: 14px;
    margin: 0 8px;
    background: white;
    display: inline-block;
    text-align: left;
    overflow-wrap: break-word;
    overflow-y: hidden;
    word-wrap: break-word;
    hyphens: auto;
    transition: all 0.3s ease;
  }

  .grid-layout .bill {
    width: auto;
    height: auto;
    min-height: 100px;
    margin: 0;
    display: block;
    padding: 8px;
  }

  :global(.processed-bill) {
    border: 1px solid black;
    width: 50px !important;
    height: 100px !important; /* Reduced height for compact grid */
    padding: 14px;
    margin: 0 8px;
    background: white;
    display: inline-block;
    text-align: left;
    overflow-wrap: break-word;
    word-wrap: break-word;
    hyphens: auto;
    transition: all 0.3s ease;
  }

  /* Single visualization bill (step 4) should be larger */
  .bill-row:not(.grid-layout) .processed-bill {
    width: 300px !important;
    height: 400px !important;
  }

  :global(.processed-bill .bill-content) {
    width: 100%;
    height: 100%;
  }

  :global(.regular-text) {
    color: #666;
  }

  :global(.bill-header) {
    margin-bottom: 8px;
    padding-bottom: 4px;
    border-bottom: 1px solid #eee;
    font-size: 0.6rem;
  }

  :global(.bill-text) {
    line-height: 1.3;
    font-family: "Courier New", Courier, monospace;
  }

  @keyframes fadeHighlight {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }

  @keyframes fadeIn {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }

  :global(.bill-content p) {
    margin: 0;
    padding: 0;
  }

  .bill-content {
    font-family: "Courier New", Courier, monospace;
    color: black;
    width: 100%;
    text-align: left;
    line-height: 1;
    margin-top: 0;
    margin-bottom: 0;
    padding-top: 0;
    padding-bottom: 0;
    max-height: 80%;
    padding-top: 32px; /* Default for single/row bills */
    font-size: 0.5rem;
  }

  .grid-layout .bill .bill-content {
    max-height: none;
    padding-top: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .visualization-row {
    display: flex;
    height: 15px;
    border: 1px solid #eee;
    margin-bottom: 1px;
    flex: 1;
    min-height: 8px;
  }

  .grid-layout .visualization-row {
    height: auto;
    flex: 1;
    margin-bottom: 2px;
    min-height: 10px;
  }

  .visualization-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .grid-layout .visualization-container {
    height: 100%;
    gap: 2px;
  }

  .visualization-segment {
    height: 100%;
    border-right: 1px solid rgba(255, 255, 255, 0.3);
  }

  .visualization-segment:last-child {
    border-right: none;
  }

  .segment-regular {
    background-color: #666; /* Same gray as regular text */
  }

  .segment-copied {
    background-color: green; /* Green for copied language */
  }
</style>
