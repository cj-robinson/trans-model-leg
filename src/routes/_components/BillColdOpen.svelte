<script>
  import { onMount, afterUpdate } from "svelte";
  import { fly } from "svelte/transition";
  import * as d3 from "d3";
  import Papa from "papaparse";
  import { flip } from "svelte/animate";

  export let step;

  let billsData = [];
  let originalActHTML = "";
  let montanaActHTML = "";
  let originalActText = "";
  let montanaActText = "";
  
  // Bill objects for display, each with an id and html
  let originalBill = { id: "original", html: "", type: "original" };
  let montanaBill = { id: "montana-viz", html: "", type: "montana" };

  onMount(async () => {
      // Fetch and parse CSV
    const billsResponse = await fetch("/fiwsa_bills_updated.csv");
    const billsCsvText = await billsResponse.text();
    const parsed = Papa.parse(billsCsvText, { header: true });
    billsData = parsed.data.filter(
      (bill) =>
        bill.state && bill.text && bill.text.trim()
    );
 
    // Fetch only the original and Montana act texts and HTML
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
  });

  let bills = [originalBill];

  let allBills = [];
  let montanaVisualizationBlocks = [];
  
  $: {
    let newBills = [];
    
    // For steps 0-3, show bills traditionally with full HTML
    if (step >= 0) {
      newBills.push(originalBill);
    }
    if (step >= 1) {
      newBills.push(montanaBill);
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
  });

  let width;
  let height;

</script>

<div
  class="chart-container"
  bind:offsetWidth={width}
  bind:offsetHeight={height}
>
  <div class="bill-row">
    {#each bills as bill, index (bill.id)}
      <div
        class="bill"
        animate:flip={{}}
        in:fly={{
          x: bill.id === "original" ? -200 : 200,
          y: 0,
          duration: 2000,
          delay: 300,
        }}
        out:fly={{ x: bill.id === "original" ? -200 : 200, duration: 500 }}
      >
        <div class="bill-content" class:montana-bill={bill.type === "montana"}>
          {@html bill.html}
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

  .bill-row {
    transition: all 0.8s ease;
    position: relative;
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
    overflow-y: hidden;
    word-wrap: break-word;
    hyphens: auto;
  }

  /* All processed-bill styles removed as they are no longer used */

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
    font-size: 0.5rem;
  }

</style>
