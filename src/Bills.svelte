<script>
  export let step;
  
  import { scaleLinear, scaleSqrt } from "d3-scale";
  import { extent, min, max } from "d3-array";
  import { fly } from 'svelte/transition';
  import { onMount } from 'svelte';

  let width;
  let height;
  let showSecondBill = false;
  let showGrid = false;
  let visibleBills = [];
  let staggerTimeouts = [];
  let isTransitioning = false; // Flag to track transition state
  
  // For loading the CSV data
  let billsData = [];
  let loading = true;
  let error = null;

  $: if (step === 1) {
    showSecondBill = false;
    setTimeout(() => {
      showSecondBill = true;
    }, 400); // adjust delay as needed
  } else {
    showSecondBill = false;
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
      
      // Start with just the first two bills
      console.log("Step 4 initiated once");
      
      // After a delay, add the rest of the bills
      const transitionTimeout = setTimeout(() => {
        isTransitioning = false;
        console.log("Transition complete, showing all bills");
      }, 1200); // Time for the initial two bills to transition
      
      staggerTimeouts.push(transitionTimeout);
    } else {
      // Reset for other steps
      showGrid = false;
      isTransitioning = false;
    }
  }
  
  // Watch for step changes
  $: handleStepChange(step);

  // Function to fetch and parse the CSV data
  async function loadBillsData() {
    try {
      const response = await fetch('/fiwsa_bills_updated.csv');
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const text = await response.text();
      const rows = text.trim().split('\n');
      const headers = rows[0].split(',');
      
      // Parse CSV into an array of objects
      const parsedData = rows.slice(1).map(row => {
        // Handle commas inside quotes properly
        const values = [];
        let currentValue = '';
        let insideQuotes = false;
        
        for (let i = 0; i < row.length; i++) {
          const char = row[i];
          
          if (char === '"' && (i === 0 || row[i - 1] !== '\\')) {
            insideQuotes = !insideQuotes;
          } else if (char === ',' && !insideQuotes) {
            values.push(currentValue);
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        
        // Add the last value
        values.push(currentValue);
        
        // Create an object from headers and values
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        
        return obj;
      });
      
      // Filter for bills with actual text
      billsData = parsedData.filter(bill => bill.text && bill.text.length > 100);
      console.log(`Loaded ${billsData.length} bills with text`);
      
      // Select bills that have the relevant highlight text (about sports)
      selectedBills = billsData.slice(0, 10); // Take first 10 bills for now
      
      loading = false;
    } catch (e) {
      console.error("Error loading CSV:", e);
      error = e.message;
      loading = false;
    }
  }
  
  // Variable to store selected bills for the visualization
  let selectedBills = [];
  
  // Extract bill text and highlights based on index
  function getBillContent(index) {
    if (!selectedBills.length) return { billText: "", highlightText: "" };
    
    const bill = selectedBills[index % selectedBills.length];
    // Extract a sample of the bill text (first 200 chars)
    const billText = bill.text ? bill.text.substring(0, 200) : "";
    
    // For highlights, we'll look for phrases related to "biological sex" or similar terms
    const billFullText = bill.text || "";
    let highlightText = "";
    
    // Common phrases in these bills we want to highlight
    const possibleHighlights = [
      "biological sex",
      "inherent differences between men and women",
      "sex assigned at birth",
      "Save Women's Sports",
      "separate sex-specific teams"
    ];
    
    // Find the first match in the text
    for (const phrase of possibleHighlights) {
      if (billFullText.includes(phrase)) {
        highlightText = phrase;
        break;
      }
    }
    
    // If no matches found, use the bill title as highlight
    if (!highlightText && bill.title) {
      highlightText = bill.title.substring(0, 40);
    }
    
    return { billText, highlightText };
  }
  
  // Initialize data on component mount
  onMount(() => {
    loadBillsData();
  });

  // Helper to highlight text
  function getHighlighted(text, highlight, step) {
    if (step === 2 || step === 3 || step === 4) {
      // Only highlight in steps 2, 3, 4
      if (!highlight) return `<div class="bill-content">${text}</div>`;
      
      // Use regex for whole word match, escape special chars
      const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'g');
      
      // Wrap the entire content in a div to ensure proper text flow
      return `<div class="bill-content">${text.replace(
        regex,
        `<span class="highlight">${highlight}</span>`
      )}</div>`;
    }
    return `<div class="bill-content">${text}</div>`;
  }
  
  // Helper to get bill info for display
  function getBillInfo(index) {
    if (loading || !selectedBills.length) {
      return { 
        billText: "Loading bill content...", 
        highlightText: ""
      };
    }
    
    const bill = selectedBills[index % selectedBills.length];
    const shortText = bill.text ? 
      bill.text.substring(0, 200) + "..." : 
      "Bill text not available";
    
    // Find highlight text
    let highlightText = "";
    const possibleHighlights = [
      "biological sex",
      "inherent differences",
      "sex assigned at birth",
      "Save Women's Sports",
      "separate sex-specific teams"
    ];
    
    for (const phrase of possibleHighlights) {
      if (bill.text && bill.text.includes(phrase)) {
        highlightText = phrase;
        break;
      }
    }
    
    return { billText: shortText, highlightText, bill };
  }

</script>


<div
  class="chart-container"
  bind:offsetWidth={width}
  bind:offsetHeight={height}
>
  {#if loading}
    <div class="loading-indicator">Loading bill data...</div>
  {:else if error}
    <div class="error-message">Error loading data: {error}</div>
  {:else if step === 0}
    <!-- Step 0: One bill with text -->
    {#if selectedBills.length > 0}
      <div class="bill">
        <div class="bill-header">
          <span class="bill-state">{getBillInfo(0).bill?.state || ''}</span>
          <span class="bill-number">{getBillInfo(0).bill?.bill_number || ''}</span>
        </div>
        {@html getHighlighted(getBillInfo(0).billText, getBillInfo(0).highlightText, step)}
      </div>
    {:else}
      <div class="bill">No bill data available</div>
    {/if}
  {:else if step === 1}
    <!-- Step 1: Two bills side by side, second bill flies in from right after delay -->
    <div class="bill-row">
      <div class="bill">
        <div class="bill-header">
          <span class="bill-state">{getBillInfo(0).bill?.state || ''}</span>
          <span class="bill-number">{getBillInfo(0).bill?.bill_number || ''}</span>
        </div>
        {@html getHighlighted(getBillInfo(0).billText, getBillInfo(0).highlightText, step)}
      </div>
      {#if showSecondBill}
        <div class="bill" in:fly={{ x: 500, duration: 700 }}>
          <div class="bill-header">
            <span class="bill-state">{getBillInfo(1).bill?.state || ''}</span>
            <span class="bill-number">{getBillInfo(1).bill?.bill_number || ''}</span>
          </div>
          {@html getHighlighted(getBillInfo(1).billText, getBillInfo(1).highlightText, step)}
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
        {@html getHighlighted(getBillInfo(0).billText, getBillInfo(0).highlightText, step)}
      </div>
      
      <div class="bill">
        <div class="bill-header">
          <span class="bill-state">{getBillInfo(1).bill?.state || ''}</span>
          <span class="bill-number">{getBillInfo(1).bill?.bill_number || ''}</span>
        </div>
        {@html getHighlighted(getBillInfo(1).billText, getBillInfo(1).highlightText, step)}
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
        {@html getHighlighted(getBillInfo(0).billText, getBillInfo(0).highlightText, step)}
      </div>
      
      <div class="bill bill-two text-invisible">
        <div class="bill-header">
          <span class="bill-state">{getBillInfo(1).bill?.state || ''}</span>
          <span class="bill-number">{getBillInfo(1).bill?.bill_number || ''}</span>
        </div>
        {@html getHighlighted(getBillInfo(1).billText, getBillInfo(1).highlightText, step)}
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
          {@html getHighlighted(getBillInfo(0).billText, getBillInfo(0).highlightText, step)}
        </div>
        
        <div
          class="bill no-text text-invisible {isTransitioning ? 'transitioning from-bill-two' : ''}"
        >
          <div class="bill-header small">
            <span class="bill-state">{getBillInfo(1).bill?.state || ''}</span>
            <span class="bill-number">{getBillInfo(1).bill?.bill_number || ''}</span>
          </div>
          {@html getHighlighted(getBillInfo(1).billText, getBillInfo(1).highlightText, step)}
        </div>
        
        <!-- Remaining bills (only visible after transition) -->
        {#if !isTransitioning}
          {#each Array(8) as _, i}
            <div 
              class="bill no-text text-invisible" 
              in:fly={{ 
                x: (i % 4 < 2 ? -200 + (i % 2) * 200 : i % 2 * 200), 
                y: (i < 4 ? -200 : 200), 
                duration: 1000, 
                delay: 100 + i * 100 
              }}
            >
              <div class="bill-header small">
                <span class="bill-state">{getBillInfo(i + 2).bill?.state || ''}</span>
                <span class="bill-number">{getBillInfo(i + 2).bill?.bill_number || ''}</span>
              </div>
              {@html getHighlighted(getBillInfo(i + 2).billText, getBillInfo(i + 2).highlightText, step)}
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
    border-color: black; 
    border-style: solid;
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
    height: 400px;
    padding: 20px;
    margin: 0 10px;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
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
    width: 120px;
    height: 160px;
    padding: 10px;
    margin: 0;
    font-size: 0.25rem; /* Very small font so the text structure fits in the smaller bill */
    border-width: 2px;
    overflow: hidden;
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
    background: #0074d9;
    color: #fff;
    padding: 2px 4px;
    border-radius: 3px;
    font-weight: bold;
    transition: background 0.5s;
    display: inline;
    white-space: normal; /* Allow wrapping within the highlighted text */
  }

  /* Style for step 3 where all text is invisible, only highlight backgrounds remain */
  .text-invisible :global(.bill-content) {
    color: transparent; /* Make regular text invisible */
  }
  
  /* Make highlight text also invisible but keep the background */
  .text-invisible :global(.highlight) {
    color: transparent; /* Make highlight text invisible too */
  }
  
  :global(.bill-content) {
    width: 100%;
    text-align: left;
    line-height: 1.5;
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
    border: 2px solid #0074d9;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  /* Special styling for highlights in the small bills */
  .no-text :global(.highlight) {
    padding: 2px 2px;
    border-radius: 2px;
  }
  
  /* Special styles for the transitioning bills */
  .transitioning {
    transition: all 1.2s cubic-bezier(0.22, 1, 0.36, 1);
    transform-origin: center center;
  }
  
  /* Styles for the transition effect */
  .from-bill-one {
    animation: move-bill-one 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  
  .from-bill-two {
    animation: move-bill-two 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  
  @keyframes move-bill-one {
    0% {
      transform: translate(calc(-50% + 160px), 0) scale(2.5);
    }
    100% {
      transform: translate(0, 0) scale(1);
    }
  }
  
  @keyframes move-bill-two {
    0% {
      transform: translate(calc(50% - 160px), 0) scale(2.5);
    }
    100% {
      transform: translate(0, 0) scale(1);
    }
  }
  
  .loading-indicator {
    font-size: 1.5rem;
    padding: 2rem;
    color: #555;
    text-align: center;
  }
  
  .error-message {
    color: #d9534f;
    padding: 1rem;
    border: 1px solid #d9534f;
    border-radius: 4px;
    background-color: #f9f2f2;
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
    color: #0074d9;
  }
  
  .bill-number {
    color: #111;
  }
  
  /* Adjust bill content to account for header */
  .bill-content {
    margin-top: 30px;
  }
  
  .no-text .bill-content {
    margin-top: 20px;
  }

</style>