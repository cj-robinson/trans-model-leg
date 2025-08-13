<script>
  import { onMount, afterUpdate } from "svelte";
  import { fly } from "svelte/transition";
  import * as d3 from "d3";
  import Papa from "papaparse";
  import { flip } from "svelte/animate";
  import { assets } from "$app/paths";
  import { beforeUpdate } from "svelte";


  export let step;
  let previousStep = undefined;
  $: scrollDirection = "";

  beforeUpdate(() => {
    // Capture the value before the update
    previousStep = step;
  });

  $: {
    if (step !== previousStep) {
      // Only compare when both are defined numbers
      if (step !== undefined && previousStep !== undefined) {
        scrollDirection = step > previousStep ? "down" : "up";
      }
      // Create special case for when step becomes undefined
      else if (step === undefined && previousStep !== undefined) {
        scrollDirection = "exit"; // New state for exiting
      }
      // Log both values to help debug
      console.log(
        `Direction: ${scrollDirection}, Previous: ${previousStep}, Current: ${step}`
      );
    }
  }

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
    const billsResponse = await fetch(`${assets}/fiwsa_bills_updated.csv`);
    const billsCsvText = await billsResponse.text();
    const parsed = Papa.parse(billsCsvText, { header: true });
    billsData = parsed.data.filter(
      (bill) => bill.state && bill.text && bill.text.trim()
    );

    // Fetch only the original and Montana act texts and HTML
    const originalActTextResponse = await fetch(`${assets}/original_act.txt`);
    originalActText = await originalActTextResponse.text();

    const montanaActTextResponse = await fetch(`${assets}/montana_act.txt`);
    montanaActText = await montanaActTextResponse.text();

    const originalActHTMLResponse = await fetch(`${assets}/original_act.html`);
    originalActHTML = await originalActHTMLResponse.text();

    const montanaActHTMLResponse = await fetch(`${assets}/montana_act.html`);
    montanaActHTML = await montanaActHTMLResponse.text();

    // Update the bill objects with HTML content
    originalBill.html = originalActHTML;
    montanaBill.html = montanaActHTML;
  });

  let introBills = [originalBill];
  let smallBills = [];

  $: {
    let newBills = [];
    let newSmallBills = [];
    // For steps 0-3, show bills traditionally with full HTML
    if (step >= 0 || scrollDirection === "exit") {
      newBills.push(originalBill);
    }
    if (step >= intro_montana_step && step < add_small_bills_step) {
      newBills.push(montanaBill);
    }
    if (step >= add_small_bills_step || scrollDirection === "exit") {
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
        "color",
        step >= change_text_step ? "var(--leggreen)" : "transparent"
      );

    d3.select("#original-bill-title").classed(
      "highlight-bill-title",
      step >= zoom_step
    );

    d3.selectAll(".chart-container").style(
      "padding",
      step >= add_small_bills_step ? "0 0" : "70px 0"
    );
  });

  let width;
  let height;
</script>

<div
  class="chart-container"
  bind:offsetWidth={width}
  bind:offsetHeight={height}
  style:padding={step >= add_small_bills_step ? "0 0" : "70px 0"}
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
          {#if bill.id === "original"}
            2020
          {/if}
          {#if bill.id === "montana"}
            2021
          {/if}
        </div>
        <div
          class="bill"
          class:original-bill={bill.id === "original"}
          style:height={step >= add_small_bills_step || scrollDirection === "exit"? "200px" : "400px"}
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
            {bill.text}
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
    color: transparent;
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

  @keyframes highlight {
    from {
      background-position: right;
    }
    to {
      background-position: left;
    }
  }
</style>
