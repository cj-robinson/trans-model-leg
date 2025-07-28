<script>
  export let step;
  
  import { scaleLinear, scaleSqrt } from "d3-scale";
  import { extent, min, max } from "d3-array";
  import { fly, fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { onMount } from 'svelte';
  import Papa from 'papaparse';

  let width;
  let height;
  let showSecondBill = false;
  let showGrid = false;
  let visibleBills = [];
  let staggerTimeouts = [];
  let isTransitioning = false; // Flag to track transition state
  let showAdditionalBills = false; // Flag to control when additional bills appear

  // For fading first bill text to blue
  let fadeToBlue = false;
  // For fading first bill text to transparent in step 3
  let fadeToTransparent = false;
  
  // For loading the CSV data
  let billsData = [];
  let selectedBills = []; // Initialize selectedBills array
  let loading = true;
  let error = null;


// Show second bill with a delay when step === 1
$: if (step === 1) {
  showSecondBill = false;
  setTimeout(() => {
    showSecondBill = true;
  }, 700);
} else {
  showSecondBill = false;
}

// Fade first bill text to blue in step 0
$: if (step === 2) {
  fadeToBlue = false;
  setTimeout(() => {
    fadeToBlue = true;
  }, 400); // Delay before fading to blue
} else {
  fadeToBlue = false;
}

// Fade first bill text to transparent in step 3
$: if (step === 3) {
  fadeToTransparent = false;
  setTimeout(() => {
    fadeToTransparent = true;
  }, 400); // Delay before fading to transparent
} else {
  fadeToTransparent = false;
}

  // Using a non-reactive approach to manage step transitions
  let previousStep = -1;
  
  function handleStepChange(newStep) {
    // Only process if the step has actually changed
    if (newStep === previousStep) return;
    
    // Update the previous step tracker
    previousStep = newStep;
    
    // Clean up any existing animations
    staggerTimeouts.forEach(id => {
      clearTimeout(id);
      clearInterval(id);
    });
    staggerTimeouts = [];
    
    if (newStep === 4) {
      // Step 4 initialization
      showGrid = true;
      isTransitioning = true;
      showAdditionalBills = false; // Start with just the first two bills
      
      console.log("Step 4 initiated once");
      
      // After a short delay, mark transition as complete
      const transitionTimeout = setTimeout(() => {
        isTransitioning = false;
        console.log("First two bills transition complete");
      }, 600); // Shortened time for the first two bills transition
      
      // Show additional bills shortly after the first bills start moving
      const additionalBillsTimeout = setTimeout(() => {
        // Once the first two bills are in place, show the additional bills with fade in
        showAdditionalBills = true;
        console.log("Showing additional bills");
      }, 300); // Start fading in additional bills halfway through the first two bills transition
      
      staggerTimeouts.push(transitionTimeout);
      staggerTimeouts.push(additionalBillsTimeout);
      staggerTimeouts.push(transitionTimeout);
    } else if (newStep !== 1) {
      // Reset for other steps except step 1
      showGrid = false;
      isTransitioning = false;
      showAdditionalBills = false;
    }
  }
  
  // Watch for step changes
  $: handleStepChange(step);

  // Function to fetch and parse the CSV data
  async function loadBillsData() {
    try {
      console.log("Loading bill data...");
      const response = await fetch('/fiwsa_bills_updated.csv');
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const text = await response.text();
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
      billsData = parsed.data.filter(bill => bill.text && bill.text.length > 100);
      selectedBills = billsData.slice(0, 10); // Take first 10 bills for now
      console.log(`Selected ${selectedBills.length} bills for display`);
      
      loading = false;
      return { success: true };
    } catch (e) {
      console.error("Error loading CSV:", e);
      error = e.message;
      loading = false;
      return { success: false, error: e.message };
    }
  }
  
  // Initialize selectedBills once at the top level
  // (Removed duplicate declaration)
  
  // --- N-gram extraction from original_act.txt ---
  // Dynamically load the act text from static/original_act.txt
  let originalActText = '';
  let actNGrams = [];

  async function loadOriginalActText() {
    try {
      const response = await fetch('/original_act.txt');
      if (!response.ok) throw new Error('Failed to load original_act.txt');
      originalActText = await response.text();
      actNGrams = getNGrams(originalActText.toLowerCase());
    } catch (e) {
      console.error('Error loading original_act.txt:', e);
      originalActText = '';
      actNGrams = [];
    }
  }

  // Utility: get all n-grams from a string (n=4 to 8)
  function getNGrams(text, minN = 4, maxN = 8) {
    const words = text.replace(/[^a-zA-Z0-9' ]/g, '').split(/\s+/).filter(Boolean);
    const ngrams = new Set();
    for (let n = minN; n <= maxN; n++) {
      for (let i = 0; i <= words.length - n; i++) {
        ngrams.add(words.slice(i, i + n).join(' '));
      }
    }
    return Array.from(ngrams);
  }

  // Helper: find all n-grams from act in bill text
  function findMatchingNGrams(billText) {
    const text = billText.toLowerCase();
    if (!actNGrams || actNGrams.length === 0) return [];
    return actNGrams.filter(ngram => text.includes(ngram));
  }

  // Extract bill text and highlights based on index
  function getBillContent(index) {
    if (!selectedBills.length) return { billText: "", highlightNGrams: [] };
    const bill = selectedBills[index % selectedBills.length];
    let billText = bill.text ? bill.text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim() : "";
    const highlightNGrams = findMatchingNGrams(billText);
    return { billText, highlightNGrams };
  }
  
  // Initialize data on component mount
  onMount(async () => {
    // Load original act text first to ensure it's available immediately
    console.log("Loading original act text...");
    await loadOriginalActText();
    console.log("Original act text loaded, length:", originalActText.length);

    console.log("Component mounted, loading bill data...");
    // Load data immediately when component mounts
    const result = await loadBillsData();
    
    // If we don't have any bills after loading, try once more
    if ((!result.success || selectedBills.length === 0) && !error) {
      console.log("No bills loaded on first attempt, trying again after delay...");
      // Wait a moment before trying again
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadBillsData();
      
      // If we still don't have data, log an error
      if (selectedBills.length === 0) {
        console.error("Failed to load bill data after multiple attempts");
      } else {
        console.log(`Successfully loaded ${selectedBills.length} bills on second attempt`);
      }
    } else {
      console.log(`Successfully loaded ${selectedBills.length} bills on first attempt`);
    }
  });

  // Helper to highlight all matching n-grams in the bill text
  function getHighlighted(text, highlightNGrams, step, index, fadeToBlue = false) {
    // Special case: When on step 0 and it's the first bill, fade to blue
    if (step === 0 && index === 0) {
      return `<div class=\"bill-content\"><span class=\"fade-to-blue${fadeToBlue ? ' blue' : ''}\">${text}</span></div>`;
    }
    // Special case: When on step 2 and it's the first bill, fade to blue
    if (step === 2 && index === 0) {
      return `<div class=\"bill-content\"><span class=\"fade-to-blue${fadeToBlue ? ' blue' : ''}\">${text}</span></div>`;
    }
    // Special case: When on step 3 and it's the first bill, keep blue text always visible
    if (step === 3 && index === 0) {
      return `<div class=\"bill-content\"><span class=\"blue-text\">${text}</span></div>`;
    }
    // Special case: When on step 3 and it's the second bill, fade only the regular text to transparent, keep highlights visible
    if (step === 3 && index === 1) {
      // Apply highlights first, then make the non-highlighted text transparent
      if (!highlightNGrams || highlightNGrams.length === 0) return `<div class=\"bill-content fade-to-transparent${fadeToTransparent ? ' transparent' : ''}\">${text}</div>`;
      
      let highlightedText = text;
      // Sort n-grams by length descending to avoid nested highlights
      const sortedNGrams = [...highlightNGrams].sort((a, b) => b.length - a.length);
      for (const ngram of sortedNGrams) {
        const escaped = ngram.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'gi');
        highlightedText = highlightedText.replace(regex, match => `<span class="highlight">${match}</span>`);
      }
      return `<div class=\"bill-content fade-to-transparent${fadeToTransparent ? ' transparent' : ''}\">${highlightedText}</div>`;
    }
    // Special case: When on step 4 and it's the first bill (original act), make text blue instead of highlighting
    if (step === 4 && index === 0) {
      return `<div class=\"bill-content\"><span class=\"blue-text\">${text}</span></div>`;
    }
    
    if (step === 2 || step === 3 || step === 4) {
      if (!highlightNGrams || highlightNGrams.length === 0) return `<div class="bill-content">${text}</div>`;
      let highlightedText = text;
      // Sort n-grams by length descending to avoid nested highlights
      const sortedNGrams = [...highlightNGrams].sort((a, b) => b.length - a.length);
      for (const ngram of sortedNGrams) {
        const escaped = ngram.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'gi');
        highlightedText = highlightedText.replace(regex, match => `<span class="highlight">${match}</span>`);
      }
      return `<div class="bill-content">${highlightedText}</div>`;
    }
    return `<div class="bill-content">${text}</div>`;
  }
  
  // Helper to get bill info for display
  function getBillInfo(index) {
    // Special case for index 0 - return original act text
    if (index === 0) {
      // Format the original act text to be more readable
      let formattedText = originalActText;
      formattedText = formattedText.replace(/[\r\n]+/g, " ");
      formattedText = formattedText.replace(/\s+/g, " ").trim();
      return {
        billText: formattedText,
        highlightNGrams: [],
        bill: { state: "ID", bill_number: "HB 500" }
      };
    }

    if (loading) {
      return {
        billText: "Loading bill content...",
        highlightNGrams: [],
        bill: { state: "...", bill_number: "..." }
      };
    }
    if (!selectedBills || !selectedBills.length) {
      console.warn(`No bills available yet for index ${index}`);
      return {
        billText: "Bill data not available",
        highlightNGrams: [],
        bill: { state: "N/A", bill_number: "N/A" }
      };
    }
    // For indices > 0, adjust index to get the correct bill from selectedBills
    const adjustedIndex = (index - 1) % selectedBills.length;
    const bill = selectedBills[adjustedIndex];
    if (!bill) {
      console.warn(`No bill found at index ${adjustedIndex}`);
      return {
        billText: "Bill data not available",
        highlightNGrams: [],
        bill: { state: "N/A", bill_number: "N/A" }
      };
    }
    let fullText = bill.text ? bill.text : "Bill text not available";
    fullText = fullText.replace(/<[^>]*>/g, "");
    fullText = fullText.replace(/[0-9]+/g, "");
    fullText = fullText.replace(/[\r\n]+/g, " ");
    fullText = fullText.replace(/\s+/g, " ").trim();
    const highlightNGrams = findMatchingNGrams(fullText);
    return { billText: fullText, highlightNGrams, bill };
  }

</script>


<div
  class="chart-container"
  bind:offsetWidth={width}
  bind:offsetHeight={height}
>
  {#if step === 0}
    <!-- Step 0: One bill with text, fade to blue -->
    <div class="bill" in:fade={{ duration: 1000, delay: 200 }}>
      <div class="bill-header">
        <span class="bill-state">{getBillInfo(0).bill?.state || ''}</span>
        <span class="bill-number">{getBillInfo(0).bill?.bill_number || ''}</span>
      </div>
      {@html getHighlighted(getBillInfo(0).billText, getBillInfo(0).highlightNGrams, step, 0, fadeToBlue)}
    </div>
  {:else if step === 1}
    <!-- Step 1: Two bills side by side, second bill flies in from right after delay -->
    <div class="bill-row">
      <div class="bill">
        <div class="bill-header">
          <span class="bill-state">{getBillInfo(0).bill?.state || ''}</span>
          <span class="bill-number">{getBillInfo(0).bill?.bill_number || ''}</span>
        </div>
        {@html getHighlighted(getBillInfo(0).billText, getBillInfo(0).highlightNGrams, step, 0)}
      </div>
      {#if showSecondBill}
        <div class="bill" in:fly={{ x: 500, duration: 700 }}>
          <div class="bill-header">
            <span class="bill-state">{getBillInfo(1).bill?.state || ''}</span>
            <span class="bill-number">{getBillInfo(1).bill?.bill_number || ''}</span>
          </div>
          {@html getHighlighted(getBillInfo(1).billText, getBillInfo(1).highlightNGrams, step, 1)}
        </div>
      {/if}
    </div>
  {:else if step === 2}
    <!-- Step 2: Two bills, highlight language -->
    <div class="bill-row">
      <div class="bill">
        <div class="bill-header">
          <span class="bill-state">{getBillInfo(0).bill?.state || ''}</span>
          <span class="bill-number">{getBillInfo(0).bill?.bill_number || ''}</span>
        </div>
        <div class="fade-highlights-step2 fade-text-step2">
          {@html getHighlighted(getBillInfo(0).billText, getBillInfo(0).highlightNGrams, step, 0, fadeToBlue)}
        </div>
      </div>
      <div class="bill">
        <div class="bill-header">
          <span class="bill-state">{getBillInfo(1).bill?.state || ''}</span>
          <span class="bill-number">{getBillInfo(1).bill?.bill_number || ''}</span>
        </div>
        <div class="fade-highlights-step2 fade-text-step2">
          {@html getHighlighted(getBillInfo(1).billText, getBillInfo(1).highlightNGrams, step, 1)}
        </div>
      </div>
    </div>
  {:else if step === 3}
    <!-- Step 3: Text becomes invisible but highlights remain -->
    <div class="bill-row bill-row-step3">
      <div class="bill bill-one text-invisible">
        <div class="bill-header">
          <span class="bill-state">{getBillInfo(0).bill?.state || ''}</span>
          <span class="bill-number">{getBillInfo(0).bill?.bill_number || ''}</span>
        </div>
        <div class="fade-highlights">
          {@html getHighlighted(getBillInfo(0).billText, getBillInfo(0).highlightNGrams, step, 0, fadeToBlue)}
        </div>
      </div>
      <div class="bill bill-two text-invisible">
        <div class="bill-header">
          <span class="bill-state">{getBillInfo(1).bill?.state || ''}</span>
          <span class="bill-number">{getBillInfo(1).bill?.bill_number || ''}</span>
        </div>
        <div class="fade-highlights">
          {@html getHighlighted(getBillInfo(1).billText, getBillInfo(1).highlightNGrams, step, 1, false, fadeToTransparent)}
        </div>
      </div>
    </div>
  {:else if step === 4}
    <!-- Step 4: Grid of 10 bills, highlight, no text visible, animated in staggered -->
    {#if showGrid}
      <div class="bill-grid">
        <!-- First two bills - transform from step 3 -->
        <div
          class="bill no-text text-invisible {isTransitioning ? 'transitioning from-bill-one' : ''}"
        >
          <div class="bill-header small">
            <span class="bill-state">{getBillInfo(0).bill?.state || ''}</span>
            <span class="bill-number">{getBillInfo(0).bill?.bill_number || ''}</span>
          </div>
          <div class="bill-content in-grid fade-highlights">{@html getHighlighted(getBillInfo(0).billText, getBillInfo(0).highlightNGrams, step, 0).replace('bill-content','bill-content in-grid')}</div>
        </div>
        <div
          class="bill no-text text-invisible {isTransitioning ? 'transitioning from-bill-two' : ''}"
        >
          <div class="bill-header small">
            <span class="bill-state">{getBillInfo(1).bill?.state || ''}</span>
            <span class="bill-number">{getBillInfo(1).bill?.bill_number || ''}</span>
          </div>
          <div class="bill-content in-grid fade-highlights">{@html getHighlighted(getBillInfo(1).billText, getBillInfo(1).highlightNGrams, step, 1).replace('bill-content','bill-content in-grid')}</div>
        </div>
        <!-- Remaining bills: fade in after the first two have moved -->
        {#if showAdditionalBills}
          {#each Array(8) as _, i}
            <div 
              class="bill no-text text-invisible bill-fade-in"
              style="animation-delay: {100 + i * 60}ms;"
            >
              <div class="bill-header small">
                <span class="bill-state">{getBillInfo(i + 2).bill?.state || ''}</span>
                <span class="bill-number">{getBillInfo(i + 2).bill?.bill_number || ''}</span>
              </div>
              <div class="bill-content in-grid fade-highlights">{@html getHighlighted(getBillInfo(i + 2).billText, getBillInfo(i + 2).highlightNGrams, step, i + 2).replace('bill-content','bill-content in-grid')}</div>
            </div>
          {/each}
        {/if}
      </div>
    {/if}
  {/if}
</div>

<style>

  .chart-container {
    height: 80vh;
    max-width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 80vh;
    flex-direction: column;
    overflow: auto;
  }

  .bill {
    border: 2px solid black;
    width: 300px;
    height: 400px; /* Reduced height for compact grid */
    padding: 14px;
    margin: 0 8px;
    background: white;
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    font-size: .25rem;
    position: relative;
    transition: opacity 0.8s;
    border-radius: 5px;
    text-align: left;
    overflow-wrap: break-word;
    word-wrap: break-word;
    hyphens: auto;
  }

  /* Smaller bills for grid step */
  .bill.no-text {
    width: 100px;
    height: 140px;
    padding: 6px;
    margin: 0;
    font-size: 0.1rem; /* Smaller font for compact grid */
    border-width: 2px;
  }

  .bill-row {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    width: 100%;
    gap: 20px;
  }

  :global(.highlight) {
    background: green;
    color: #fff;
    border-radius: 1.5px;
    transition: background 0.5s;
    display: inline;
    white-space: normal; /* Allow wrapping within the highlighted text */
  }
  
  :global(.blue-text) {
    color: #0074d9;
    transition: color 0.5s;
    white-space: normal;
  }

  :global(.fade-to-blue) {
    color: black;
    transition: color 1s cubic-bezier(0.22, 1, 0.36, 1);
    white-space: normal;
  }
  
  :global(.fade-to-blue.blue) {
    color:green;
  }

  /* Style for step 3 where all text is invisible, only highlight backgrounds remain */
  .text-invisible :global(.bill-content):not(:has(.blue-text)) {
    color: transparent !important; /* Make regular text invisible except blue-text */
    transition: color 1.2s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .text-invisible :global(.highlight) {
    color: transparent !important; /* Make regular text invisible */
    transition: color 1.2s cubic-bezier(0.22, 1, 0.36, 1);
  }

  :global(.fade-to-transparent) {
    color: black;
    transition: color 1.2s cubic-bezier(0.22, 1, 0.36, 1);
    white-space: normal;
  }

  :global(.fade-to-transparent.transparent) {
    color: transparent;
  }
  
  /* Keep highlight background visible even when text is transparent */
  :global(.fade-to-transparent.transparent .highlight) {
    color: transparent; /* Hide text inside highlight */
    background: green !important; /* Keep background color */
  }

  /* Ensure blue-text is always visible, even in .text-invisible */
  .text-invisible :global(.blue-text) {
    color: green !important;
    transition: color 0.5s;
  }

  /* Fade in highlights in step 3 and fade out text before grid */
  .fade-highlights-step2 :global(.highlight) {
    opacity: 0;
    animation: fadeHighlight 1.2s forwards;
    animation-delay: 0.2s;
    transition: color 1.2s cubic-bezier(0.22, 1, 0.36, 1), background 1.2s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .fade-text-step2 :global(.bill-content),
  .fade-text-step2 :global(.highlight) {
    transition: color 1.2s cubic-bezier(0.22, 1, 0.36, 1), background 1.2s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .fade-highlights :global(.highlight) {
    opacity: 1;
    transition: opacity 0.2s;
  }

  @keyframes fadeHighlight {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }
  
  @keyframes fadeIn {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }
  
  /* Blue text stays visible in all steps - no transparency applied */
  /* .text-invisible :global(.blue-text) {
    color: transparent !important;
  } */
  
  :global(.bill-content) {
    width: 100%;
    text-align: left;
    line-height: 1.4;
    max-height: 80%;
    overflow-y: auto; /* Enable vertical scroll for overflow text only in content */
    white-space: pre-wrap; /* Preserve line breaks and whitespace */
    padding-top: 32px; /* Default for single/row bills */
  }

  :global(.bill-content.in-grid) {
    padding-top: 10px !important; /* Smaller padding for grid bills */
    font-size: .08rem !important; /* Smaller font size for grid bills */
  }

  .bill-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 10px;
    width: 100%;
    max-width: 700px;
    justify-items: center;
    align-items: center;
    margin: 0 auto;
    padding: 10px 0;
  }

  .no-text {
    background: #f8f8f8;
    border: 2px solid black;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  /* Special styling for highlights in the small bills */
  .no-text :global(.highlight) {
    padding: 0.5px 1px;
    border-radius: 1px;
  }
  
  /* Special styles for the transitioning bills */
  .transitioning {
    transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease-out;
    transform-origin: center center;
    will-change: transform, opacity;
  }
  
  /* Styles for the transition effect */
  .from-bill-one {
    animation: move-bill-one 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  
  .from-bill-two {
    animation: move-bill-two 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  
  /* Animation for additional bills fading in */
  .bill-fade-in {
    opacity: 0;
    animation: fadeIn 0.8s ease-out forwards;
    will-change: opacity;
  }
  
  @keyframes move-bill-one {
    0% {
      transform: translate(calc(-50% + 160px), 0) scale(2.5);
      opacity: 1;
    }
    100% {
      transform: translate(0, 0) scale(1);
      opacity: 1;
    }
  }
  
  @keyframes move-bill-two {
    0% {
      transform: translate(calc(50% - 160px), 0) scale(2.5);
      opacity: 1;
    }
    100% {
      transform: translate(0, 0) scale(1);
      opacity: 1;
    }
  }

  .bill-header {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    background-color: #f0f0f0;
    border-bottom: 1px solid #ddd;
    padding: 8px 10px;
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
    font-weight: bold;
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
  }
  
  .bill-header.small {
    padding: 4px 6px;
    font-size: 0.6rem;
  }
  
  .bill-state {
    color: black;
  }
  
  .bill-number {
    color:  #111;
  }
  
  /* Bill content styling is now applied through :global selectors */

</style>