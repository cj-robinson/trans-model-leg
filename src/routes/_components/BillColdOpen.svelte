<script>
  import { onMount, afterUpdate } from 'svelte';
  import { scaleLinear, scaleSqrt } from "d3-scale";
  import { extent, min, max } from "d3-array";
  import { fly, fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import * as d3 from 'd3';
  import Papa from 'papaparse';
  import { flip } from 'svelte/animate';

  export let step;

  let billsData = [];
  let originalActHTML = "";
  let montanaActHTML = "";

  onMount(async () => {
    // Fetch and parse CSV
    const billsResponse = await fetch('/fiwsa_bills_updated.csv');
    const billsCsvText = await billsResponse.text();
    const parsed = Papa.parse(billsCsvText, { header: true });
    billsData = parsed.data;

    const originalActHTMLResponse = await fetch('/original_act.html');
    originalActHTML = await originalActHTMLResponse.text();

    const montanaActHTMLResponse = await fetch('/montana_act.html');
    montanaActHTML = await montanaActHTMLResponse.text();    
  });

  let bills = [originalActHTML]

  let allBills = []

  $: {
    let newBills = [];
    if (step >= 0 && step <= 2) {
      newBills.push(originalActHTML);
    }
    if (step >= 1 && step <= 3) {
      newBills.push(montanaActHTML);
    }
    if (step >= 4) {
      newBills.push()
    }
    bills = newBills;
  }

  afterUpdate(() => {
    // Fade out: select all fade-out spans, cascade by index
    d3.selectAll('[class^="ngram-text-fade-out-"]')
      .transition()
      .delay((d, i) => i * 200)
      .duration(100)
      .style('color', step >= 2 ? 'transparent' : 'black');

    // Fade in: select all fade-in spans, cascade by index
    d3.selectAll('[class^="ngram-text-fade-in-"]')
      .transition()
      .delay((d, i) => i * 200)
      .duration(300)
      .style('color', step >= 2 ? 'green' : 'transparent');
  });

  let width;
  let height;
</script>


<div
  class="chart-container"
  bind:offsetWidth={width}
  bind:offsetHeight={height}
>
    <!-- Step 0: One bill with text -->
    <!-- <div class="bill-row">
      {#if step >= 0 && step < 3}

        <div class="bill" 
          in:fade
          out:fly={{ x: -500, duration: 2000 }}>
          >
          <div class="bill-content original-bill">
            {@html originalActHTML}
          </div>
        </div>
      {/if}
      
      {#if step >= 1}
        <div class="bill" 
            transition:fly={{ x: 500, duration: 2000 }}>
          <div class="bill-content original-bill montana-bill">
            {@html montanaActHTML}
          </div>
        </div>
      {/if}
    </div> -->

    <div class="bill-row">
    {#each bills as bill (bill)}
        <div class="bill" 
             animate:flip={{ duration: 800, easing: cubicOut }}
             in:fly={{ x: bill === originalActHTML ? -200 : 200, duration: 500, delay: 500 }}
             out:fly={{ x: bill === originalActHTML ? -200 : 200, duration: 500 }}
             >
          <div class="bill-content original-bill montana-bill">
            {@html bill}
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
    line-height: .5;
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
  }

  .bill {
    border: 1px solid black;
    width: 300px;
    height: 400px; /* Reduced height for compact grid */
    padding: 14px;
    margin: 0 8px;
    background: white;
    font-size: .5rem;
    display: inline-block;

    text-align: left;
    overflow-wrap: break-word;
    overflow-y: hidden;
    word-wrap: break-word;
    hyphens: auto;
  }

  :global(.original-bill) {
    padding-top:0px !important;
  }

  .bill-row {
    text-align: center;
  }

  /* N-gram match transitions for step 3 */
   :global(.bill-content .ngram-match) {
    transition: opacity 1.2s cubic-bezier(0.22,1,0.36,1), color 1.2s cubic-bezier(0.22,1,0.36,1);
    color: inherit;
    opacity: 1;
  }
   :global(.bill-content .ngram-fadeout) {
    opacity: 0;
  }
   :global(.bill-content .ngram-fadein-green) {
    opacity: 1;
    color: #1ec742;
  }

  @keyframes fadeHighlight {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }
  
  @keyframes fadeIn {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }

  :global(.bill-content p) {
    margin: 0;
    padding: 0;
  }  
  
  .bill-content {
    font-family: 'Courier New', Courier, monospace;
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
  }

</style>