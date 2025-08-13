<script>
  import { onMount, afterUpdate } from "svelte";
  import { fly } from "svelte/transition";
  import * as d3 from "d3";
  import Papa from "papaparse";
  import { flip } from "svelte/animate";
  import { assets } from "$app/paths";
  import { beforeUpdate } from "svelte";

  // Removed HighlightHTML import
  import StepTracker from "./StepTracker.svelte";

  export let step;

  $: scrollDirection = "";

  let billsData = [];
  let originalActHTML = "";
  let montanaActHTML = "";
  let originalActText = "";
  let montanaActText = "";

  // Bill objects for display, each with an id and html
  let originalBill = { id: "original", html: "" };
  let montanaBill = { id: "montana", html: "" };

  let zoom_step = 1;
  let intro_montana_step = 2;
  let change_text_step = 3;
  let add_small_bills_step = 4;
  onMount(async () => {
    // Fetch and parse CSV
    const billsResponse = await fetch(`${assets}/fiwsa_bills_with_highlights.csv`);
    const billsCsvText = await billsResponse.text();
    const parsed = Papa.parse(billsCsvText, { header: true });
    // Fetch only the original and Montana act texts and HTML
    const originalActTextResponse = await fetch(`${assets}/original_act.txt`);
    originalActText = await originalActTextResponse.text();

    // Bills data already has highlighting, just need to structure it
    billsData = parsed.data
      .filter((bill) => bill.state && bill.highlighted_html && bill.highlighted_html.trim())
      .map((bill) => {
        return {
          ...bill,
          html: bill.highlighted_html
        };
      });

    const montanaActTextResponse = await fetch(`${assets}/montana_act.txt`);
    montanaActText = await montanaActTextResponse.text();

    const originalActHTMLResponse = await fetch(`${assets}/original_act.html`);
    originalActHTML = await originalActHTMLResponse.text();

    const montanaActHTMLResponse = await fetch(`${assets}/montana_act.html`);
    montanaActHTML = await montanaActHTMLResponse.text();

    // Update the bill objects with HTML content
    originalBill.html = originalActHTML;
    montanaBill.html = montanaActHTML;
    let newBills = [];
    newBills.push(originalBill); 
    introBills = newBills;

  });

  let smallBills = [];
  let introBills = [];


  $: if (step !== undefined) {
    let newBills = [];
    let newSmallBills = [];
    // For steps 0-3, show bills traditionally with full HTML
    if (step === undefined || step >=0) {
      newBills.push(originalBill);
    }
    if (step >= intro_montana_step && step < add_small_bills_step) {
      newBills.push(montanaBill);
    }
    if (step >= add_small_bills_step || scrollDirection == "exit") {
      newSmallBills.push(billsData);
    }
    introBills = newBills;
    smallBills = newSmallBills[0];
    console.log(step);
  }

  afterUpdate(() => {
    // Fade out: select all fade-out spans, cascade by index
    d3.selectAll('[class^="ngram-text-fade-out-"]')
      .transition()
      .delay((d, i) => i * 100)
      .duration(100)
      .style("color", step >= change_text_step ? "transparent" : "black");

    // Fade in: select all fade-in spans, cascade by index
    d3.selectAll('[class^="ngram-text-fade-in-"]')
      .transition("y")
      .delay((d, i) => i * 100)
      .duration(100)
      .style(
        "background-color",
        step >= change_text_step? "var(--leggreen)" : "transparent"
      );

    d3.select("#original-bill-title").classed(
      "highlight-bill-title",
      step >= zoom_step
    );

  });

  let width;
  let height;
  let scrollReminderTimeout;
  let showScrollReminder = false;
let y = 0; // Initialize with 0 so isAtTop is true on initial load

$: isAtTop = (y === undefined || y < 50); // Handle possible undefined value

// Hide scroll reminder when user scrolls down
$: if (!isAtTop && showScrollReminder) {
  showScrollReminder = false;
  if (scrollReminderTimeout) {
    clearTimeout(scrollReminderTimeout);
    scrollReminderTimeout = null;
  }
}

// Setup timeout when component mounts
onMount(() => {
  // Start the timeout if step is undefined and we're at the top
  if (step === undefined) {
    scrollReminderTimeout = setTimeout(() => {
      // Double-check we're still at top when timeout completes
      if (isAtTop && step === undefined) {
        showScrollReminder = true;
      }
    }, 5000); // 5 seconds
  }
  
  // Cleanup function
  return () => {
    if (scrollReminderTimeout) clearTimeout(scrollReminderTimeout);
  };
});
</script>

<svelte:window bind:scrollY={y}/>

<StepTracker {step} bind:scrollDirection />
{#if showScrollReminder}
  <div class="scroll-reminder" 
       transition:fly={{ y: 20, duration: 400 }}>
    <div class="scroll-icon">↓</div>
    <div class="scroll-text">Scroll down to continue</div>
  </div>
{/if}
<div
  class="chart-container"
  bind:offsetWidth={width}
  bind:offsetHeight={height}
>
  <div class="bill-row">
    {#each introBills as bill, index (bill.id)}
      <div
        class="bill-container"
        class:zoom-in={step === zoom_step}
        animate:flip={{}}
        in:fly={{
          x: bill.id === "original" ? -200 : 200,
          y: 0,
          duration: 2000,
          delay: 300,
        }}
        out:fly={{}}
      >
        <div class="bill-year">
          {#if bill.id === "original" && step >= 4}
            2020
          {/if}
        </div>
        <div
          class="bill"
          class:original-bill={bill.id === "original"}
          style:height={step >= add_small_bills_step ||
          scrollDirection === "exit"
            ? "200px"
            : "400px"}
          style:transition="height 1000ms cubic-bezier(0.33, 1, 0.68, 1)"
        >
          <div class="bill-content" class:montana-bill={bill.id === "montana"}>
            {@html bill.html}
          </div>
        </div>
      </div>
    {/each}
  </div>
  <div class="bill-box">
    {#each smallBills as bill, index (bill.bill_id)}
      <div
        class="small-container"
        animate:flip={{}}
        in:fly={{
          x: 0,
          y: 40,
          duration: 600,
          delay: index * 120,
        }}
      >
        <div class="small-bill-year">
          {bill.year_start}
        </div>
        <div class="small-bill">
          <div class="small-bill-state">
            {bill.state}
          </div>
          <div class="small-bill-content">
            {@html bill.html}
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  :global(.montana-bill p) {
    color: gray;
  }

  :global(.montana-bill [class^="ngram-text-fade-in-"]) {
    color: white;
    border-radius: 2px;

  }
  :global(.bill) {
    transform: scale(1, 1);
  }

  :global(.highlight-bill-title) {
    animation-name: highlight;
    animation-duration: 0.75s;
    animation-fill-mode: forwards;
    background-image: linear-gradient(to right, yellow 50%, transparent 50%);
    background-size: 200% 100%;
    background-position: right;
  }

.chart-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 80vh; /* Use viewport height */
  align-items: center;
}  

  .zoom-in {
    animation: zoomIn 2000ms cubic-bezier(0.33, 1, 0.68, 1) forwards;
  }

  .zoom-out {
    animation: zoomOut 2000ms cubic-bezier(0.33, 1, 0.68, 1) forwards;
  }

  @keyframes zoomIn {
    from {
      transform: scale(1);
    }
    to {
      transform: scale(2);
    }
  }

  @keyframes zoomOut {
    from {
      transform: scale(2);
    }
    to {
      transform: scale(1);
    }
  }


  @keyframes highlight {
    from {
      background-position: right;
    }
    to {
      background-position: left;
    }
  }


  /* scroll reminder */
  
  .scroll-reminder {
    position: fixed;
    font-family: "Georgia", serif;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--leggreen);
    color: white;
    padding: 0.8rem 1.5rem;
    border-radius: 2rem;
    opacity: .5;
    display: flex;
    align-items: center;
    gap: 0.8rem;
    z-index: 1000;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
  
  .scroll-icon {
    font-size: 1.5rem;
    animation: bounce 1.5s infinite;
  }
  
  .scroll-text {
    font-size: 0.9rem;
    font-weight: 500;
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

  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-5px);
    }
    60% {
      transform: translateY(-3px);
    }
  }
</style>
