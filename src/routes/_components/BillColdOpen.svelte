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

  // // Function to create visualization blocks from HTML content
  // function createVisualizationBlocks(htmlContent) {
  //   if (!htmlContent) return [];

  //   // Create a temporary div to parse the HTML
  //   const tempDiv = document.createElement("div");
  //   tempDiv.innerHTML = htmlContent;

  //   // Extract character data with their types
  //   const characters = [];

  //   function traverseNode(node) {
  //     if (node.nodeType === Node.TEXT_NODE) {
  //       const text = node.textContent;
  //       const parent = node.parentElement;
  //       const isRegular = parent && parent.classList.contains("regular-text");
  //       const isCopied = parent && parent.classList.contains("copied-language");

  //       // Default to regular if no specific class found
  //       const type = isCopied ? "copied" : "regular";

  //       for (let i = 0; i < text.length; i++) {
  //         characters.push({
  //           char: text[i],
  //           type: type,
  //         });
  //       }
  //     } else if (node.nodeType === Node.ELEMENT_NODE) {
  //       for (let child of node.childNodes) {
  //         traverseNode(child);
  //       }
  //     }
  //   }

  //   traverseNode(tempDiv);

  //   const totalChars = characters.length;
  //   if (totalChars === 0) return [];

  //   const charsPerRow = Math.ceil(totalChars / 20);
  //   const rows = [];

  //   for (let rowIndex = 0; rowIndex < 20; rowIndex++) {
  //     const startIndex = rowIndex * charsPerRow;
  //     const endIndex = Math.min(startIndex + charsPerRow, totalChars);
  //     const rowChars = characters.slice(startIndex, endIndex);

  //     // Skip empty rows
  //     if (rowChars.length === 0) continue;

  //     // Group consecutive characters of the same type into segments
  //     const segments = [];
  //     let currentSegment = null;

  //     for (let char of rowChars) {
  //       if (!currentSegment || currentSegment.type !== char.type) {
  //         if (currentSegment) segments.push(currentSegment);
  //         currentSegment = {
  //           type: char.type,
  //           count: 1,
  //         };
  //       } else {
  //         currentSegment.count++;
  //       }
  //     }

  //     if (currentSegment) segments.push(currentSegment);

  //     // Calculate proportional widths
  //     const totalRowChars = rowChars.length;
  //     const segmentsWithWidths = segments.map((segment) => ({
  //       type: segment.type,
  //       width: (segment.count / totalRowChars) * 100, // percentage
  //     }));

  //     rows.push({
  //       index: rowIndex,
  //       segments: segmentsWithWidths,
  //       totalChars: totalRowChars,
  //     });
  //   }

  //   return rows;
  // }

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
    
    const montanaActHTMLResponse = await fetch("/montana_act.html");
    montanaActHTML = await montanaActHTMLResponse.text();
    
    // Update the bill objects with HTML content
    originalBill.html = originalActHTML;
    montanaBill.html = montanaActHTML;

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
      
      // Create simplified bill content with just year and state
      const year = bill.year_start || "";
      const state = bill.state || "";
      const simplifiedHtml = `<div class="bill-simple-content"><div class="bill-state">${state}</div><div class="bill-year">${year}</div></div>`;
      
      return {
        ...bill,
        id:
          bill.id ||
          bill.bill_number ||
          bill.state + "-" + (bill.bill_number || i),
        visualizationData: highlightedText,
        html: highlightedText, // Keep the full highlighted text for display
        simplifiedHtml: simplifiedHtml, // Store simplified version separately
        type: "visualization",
      };
    });
  });

  let bills = [originalBill];

  let allBills = [];
  let montanaVisualizationBlocks = [];

  // Calculate positions in a circle with random offset for movement
  function calculateCirclePositions(numItems, radius) {
    const positions = [];
    for (let i = 0; i < numItems; i++) {
      const angle = (i / numItems) * 2 * Math.PI; // angle in radians
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      // // Add small random offset for floating effect
      // const offset = { 
      //   x: Math.random() * 10 - 5, 
      //   y: Math.random() * 10 - 5 
      // };
      
      positions.push({ 
        // x: x + offset.x, 
        // y: y + offset.y,
        x: x,
        y: y,        
        baseX: x,
        baseY: y
      });
    }
    return positions;
  }
  
  $: {
    let newBills = [];
    
    if (step < 4) {
      // For steps before circle layout, show bills traditionally with full HTML
      if (step >= 0 && step <= 3) {
        newBills.push(originalBill);
      }
      if (step >= 1 && step <= 3) {
        newBills.push(montanaBill);
      }
    } else {
      // For step 4 and beyond, arrange all bills in a layout
      const allBillsForLayout = [originalBill, ...processedBills];
      
      // Calculate positions for bills - use larger radius for full text
      const radius = Math.min(width, height) * 0.30; // Make radius responsive to container size and slightly larger
      const positions = calculateCirclePositions(allBillsForLayout.length, radius);
      
      // Add position data to each bill
      newBills = allBillsForLayout.map((bill, index) => {
        // Use full HTML for all bills, not simplified version
        return {
          ...bill,
          displayHtml: bill.html, // Always use full HTML content
          position: positions[index] || { x: 0, y: 0 }
        };
      });
      
      // Position Idaho bill in the center
      newBills[0] = {
        ...newBills[0],
        position: { x: 0, y: 0 }
      };
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

    // // Add floating animation to bills when in layout
    // if (step >= 4) {
    //   bills.forEach((bill, index) => {
    //     if (bill.position) {
    //       // Select the bill element
    //       const billElement = d3.select(`.bill:nth-child(${index + 1})`);
          
    //       // Apply floating animation with random duration between 3-5 seconds
    //       const floatDuration = 3000 + Math.random() * 2000;
          
    //       // Generate random offsets for the floating motion
    //       const offsetX = (Math.random() * 10) - 5;
    //       const offsetY = (Math.random() * 10) - 5;
          
    //       // Apply the floating animation with proper centering
    //       billElement
    //         .transition()
    //         .duration(floatDuration)
    //         .ease(d3.easeSinInOut)
    //         .style("transform", `translate(calc(${bill.position.x + offsetX}px - 50%), calc(${bill.position.y + offsetY}px - 50%))`)
    //         .on("end", function repeat() {
    //           // Create a continuous floating effect
    //           d3.select(this)
    //             .transition()
    //             .duration(floatDuration)
    //             .ease(d3.easeSinInOut)
    //             .style("transform", `translate(calc(${bill.position.x - offsetX}px - 50%), calc(${bill.position.y - offsetY}px - 50%))`)
    //             .on("end", function() {
    //               d3.select(this)
    //                 .transition()
    //                 .duration(floatDuration)
    //                 .ease(d3.easeSinInOut)
    //                 .style("transform", `translate(calc(${bill.position.x + offsetX}px - 50%), calc(${bill.position.y + offsetY}px - 50%))`)
    //                 .on("end", repeat);
    //             });
    //         });
    //     }
    //   });
    // }
  });

  let width;
  let height;

</script>

<div
  class="chart-container"
  bind:offsetWidth={width}
  bind:offsetHeight={height}
>
  <div class="bill-row" class:circle-layout={step >= 4}>
    {#each bills as bill, index (bill.id)}
      <div
        class="bill"
        class:processed-bill={step >= 4}
        class:center-bill={bill.id === "original" && step >= 4}
        style={step >= 4 && bill.position ? `transform: translate(calc(${bill.position.x}px - 50%), calc(${bill.position.y}px - 50%))` : ''}
        animate:flip={{}}
        in:fly={{
          x: step >= 4 ? 0 : bill.id === "original" ? -200 : 200,
          y: step >= 4 ? 0 : 0,
          duration: 2000,
          delay: step >= 4 ? index * 100 : 300,
        }}
        out:fly={{ x: bill.id === "original" ? -200 : 200, duration: 500 }}
      >
        <div class="bill-content" class:montana-bill={bill.type === "montana"} class:mini-text={step >= 4}>
          {#if step >= 4 && bill.displayHtml}
            <div class="mini-bill-content">
              {@html bill.displayHtml}
            </div>
          {:else}
            {@html bill.html}
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
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

  .chart-container:has(.circle-layout) {
    align-items: center;
    padding: 0;
    height: 100vh;
    min-height: 100vh;
    position: relative;
  }

  .bill-row {
    transition: all 0.8s ease;
    position: relative;
  }

  .bill-row.circle-layout {
    display: flex;
    position: relative;
    width: 100%;
    height: 100%;
    margin: 0 auto;
    justify-content: center;
    align-items: center;
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

  .circle-layout .bill {
    position: absolute;
    transform-origin: center;
    margin: 0;
    padding: 8px;
    left: 50%;
    top: 50%;
    /* The actual positioning will be done by inline styles */
  }
  
  .center-bill {
    /* Ensure the center bill is perfectly centered with no extra padding */
    padding: 5px !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
  }

  :global(.processed-bill) {
    border: 1px solid black;
    width: 120px !important;
    height: 160px !important;
    padding: 5px;
    margin: 0 8px;
    background: white;
    display: inline-block;
    text-align: left;
    overflow: hidden;
    word-wrap: break-word;
    hyphens: auto;
    transition: all 0.5s ease;
    font-size: 0.15rem;
    line-height: 1.1;
    overflow-y: hidden;
  }

  /* Single visualization bill (before circle layout) should be larger */
  .bill-row:not(.circle-layout) .processed-bill {
    width: 300px !important;
    height: 400px !important;
    text-align: left;
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

  /* Style for bill simple content (state and year) */
  :global(.bill-simple-content) {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
    padding: 0; /* Remove any padding */
    margin: 0; /* Remove any margin */
  }
  
  .center-bill :global(.bill-content) {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
    padding: 0;
    margin: 0;
  }
  
  :global(.bill-state) {
    font-size: 1.2rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }
  
  :global(.bill-year) {
    font-size: 0.9rem;
  }
  
  .mini-text {
    font-size: 0.15rem !important;
    line-height: 1.1 !important;
  }
  
  .mini-text :global(h1) {
    font-size: 0.3rem !important;
    margin: 0.2rem 0 !important;
  }
  
  .mini-text :global(p) {
    margin: 0.1rem 0 !important;
  }
  
  .mini-bill-content {
    width: 100%;
    height: 100%;
    overflow: hidden;
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

  .circle-layout .bill .bill-content {
    max-height: none;
    padding-top: 0;
    padding: 0;
    margin: 0;
    height: 100%;
    width: 100%;
    font-size: 0.15rem;
    line-height: 1.1;
    overflow: hidden;
    text-align: left;
  }

  /* Keep visualization styles since they might be used elsewhere */
  /* These are still needed for the visualization blocks */
  :global(.visualization-row) {
    display: flex;
    height: 15px;
    border: 1px solid #eee;
    margin-bottom: 1px;
    flex: 1;
    min-height: 8px;
  }

  :global(.circle-layout .visualization-row) {
    height: auto;
    flex: 1;
    margin-bottom: 2px;
    min-height: 10px;
  }

  :global(.visualization-container) {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  :global(.circle-layout .visualization-container) {
    height: 100%;
    gap: 2px;
  }

  :global(.visualization-segment) {
    height: 100%;
    border-right: 1px solid rgba(255, 255, 255, 0.3);
  }

  :global(.visualization-segment:last-child) {
    border-right: none;
  }

  :global(.segment-regular) {
    background-color: #666; /* Same gray as regular text */
  }

  :global(.segment-copied) {
    background-color: green; /* Green for copied language */
  }
  
  :global(.mini-text .copied-language) {
    color: green !important;
    font-weight: bold;
  }
  
  :global(.mini-text .regular-text) {
    color: #333 !important;
  }
</style>
