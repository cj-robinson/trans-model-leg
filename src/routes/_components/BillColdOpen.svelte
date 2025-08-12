<script>
  import { onMount, afterUpdate } from "svelte";
  import { fly } from "svelte/transition";
  import * as d3 from "d3";
  import Papa from "papaparse";
  import { flip } from "svelte/animate";
  import { assets } from '$app/paths';

  export let step;

  let billsData = [];
  let originalActHTML = "";
  let montanaActHTML = "";
  let originalActText = "";
  let montanaActText = "";
  
  // Bill objects for display, each with an id and html
  let originalBill = { id: "original", html: ""};
  let montanaBill = { id: "montana", html: ""};

  let change_text_step = 3;
  let intro_montana_step = 2;
  let add_small_bills_step = 5;  

  onMount(async () => {
      // Fetch and parse CSV
    const billsResponse = await fetch(`${assets}/fiwsa_bills_updated.csv`);
    const billsCsvText = await billsResponse.text();
    const parsed = Papa.parse(billsCsvText, { header: true });
    billsData = parsed.data.filter(
      (bill) =>
        bill.state && bill.text && bill.text.trim()
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
    if (step >= 0) {
      newBills.push(originalBill);
    }
    if (step >= intro_montana_step && step < add_small_bills_step) {
      newBills.push(montanaBill);
    }
    if (step >= add_small_bills_step) {
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
      .style("color", step >= change_text_step ? "green" : "transparent");
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
    {#each introBills as bill, index (bill.id)}
      <div
        class="bill"
        class:original-bill={bill.id === "original"}
        style:height="{step >= add_small_bills_step ? '200px' : '400px'}"
        style:transition="height 1000ms cubic-bezier(0.33, 1, 0.68, 1)"        
        animate:flip={{}}
        in:fly={{
          x: bill.id === "original" ? -200 : 200,
          y: 0,
          duration: 2000,
          delay: 300,
        }}
        out:fly={{}}
      >
        <div class="bill-content" class:montana-bill={bill.id === "montana"}>
          {@html bill.html}
        </div>
      </div>
    {/each}
  </div>
  <div class="bill-box">
    {#each smallBills as bill, index (bill.bill_id)}
      <div
        class="small-bill"
        animate:flip={{}}
        in:fly={{}}
      >           
       <div class="small-bill-content-header">{bill.state} - {bill.year_start}</div>
        <div class="small-bill-content">
          {bill.text}
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




</style>
