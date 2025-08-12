<script>
  import { onMount, afterUpdate } from "svelte";
  import { scaleLinear, scaleSqrt } from "d3-scale";
  import { extent, min, max } from "d3-array";
  import { fly, fade } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import * as d3 from "d3";
  import Papa from "papaparse";
  import { flip } from "svelte/animate";
  import { assets } from '$app/paths';

  export let step;

  let billsData = [];
  let akActResponse = "";
  let akActHTML = "";
  let miActResponse = "";
  let miActHTML = "";
  let scActResponse = ""
  let scActHTML = ""
 

  // Bill objects for display, each with an id and html
  let akBill = { id: "", html: "" };
  let miBill = { id: "", html: "" };
  let scBill = { id: "", html: "" };

  let mi_bill_step = 1;
  let scroll_step = 2;
  let bold_text_step = 2;
  let highlight_changed_text_step = 3; 
  let sc_bill_step = 4; 
  let sc_scroll_bill_step = 5;

  onMount(async () => {
    // Fetch and parse CSV
    // const billsResponse = await fetch(`${assets}/fiwsa_bills_updated.csv`);
    // const billsCsvText = await billsResponse.text();
    // const parsed = Papa.parse(billsCsvText, { header: true });
    // billsData = parsed.data.filter(
    //   (bill) =>
    //     bill.state && bill.text && bill.text.trim()
    // );

    const akActResponse = await fetch(`${assets}/ak_safe.html`);
    akActHTML = await akActResponse.text();
    akBill = { id: "ak", html: akActHTML };

    const miActResponse = await fetch(`${assets}/mi_safe.html`);
    miActHTML = await miActResponse.text();
    miBill = { id: "mi", html: miActHTML };

    const scActResponse = await fetch(`${assets}/sc_safe.html`);
    scActHTML = await scActResponse.text();
    scBill = { id: "sc", html: scActHTML };    
  });


  let scrollBillNodes = []; // Array to hold references to all bill nodes

  const scrollTo = (node, top) => {
    const scroll = () =>
      node.scroll({
        top: top,
        behavior: "smooth",
      });
    scroll();

    return { update: scroll };
  };

  let introBills = [akBill];

  $: {
    let newBills = [];
    if (step >= 0 || step === undefined) {
      newBills.push(akBill);
    }
    if (step >= mi_bill_step && step < sc_bill_step) {
      newBills.push(miBill);
    }
    if (step === scroll_step) {
      scrollTo(scrollBillNodes[0],3750);
      scrollTo(scrollBillNodes[1], 1880);
    }
    if (step === scroll_step - 1) {
      scrollTo(scrollBillNodes[0],0);      
    }    
    if (step >= sc_bill_step) {
      newBills.push(scBill);
    }
    if (step === sc_scroll_bill_step) {
      scrollTo(scrollBillNodes[0],3750);
      scrollTo(scrollBillNodes[1], 1880);
    }    
    if (step === sc_scroll_bill_step - 1) {
      scrollTo(scrollBillNodes[0],0);
      scrollTo(scrollBillNodes[1], 0);

    }      
    introBills = [...newBills];
    console.log(introBills);
  }

   afterUpdate(() => {
    d3.selectAll(".scroll-bill")
        .style("overflow", step < scroll_step ? "hidden" : "scroll");

    setTimeout(() => {
      // Fade out: select all fade-out spans, cascade by index

      // Fade out: select all fade-out spans, cascade by index
      d3.selectAll("p.bold")
        .transition()
        .duration(1000)
    .style("font-weight", step >= bold_text_step ? "700" : "200")
    }, 10);

    d3.selectAll(".added_text")
      .transition()
      .delay((d, i) => i * 100)
      .duration(100)
      .style("color", step >= highlight_changed_text_step ? "transparent" : "black");

  });
 
  let width;
  let height;
</script>

<div
  class="chart-container"
  bind:offsetWidth={width}
  bind:offsetHeight={height}
>
  {#each introBills as bill, index (bill.id)}
    <div
      class="bill scroll-bill"
      bind:this={scrollBillNodes[index]} 
      animate:flip
  in:fly={{
    duration: 1000,
    x: 0, // Slide in from the left
    y: 200 // No vertical movement
  }}
  out:fly={{
    duration: 1000,
    x: 0, // Slide out to the right
    y: -100 // No vertical movement
  }}
    >
      <div>
        {#if bill.id == "ak"}
          <p>Original Bill</p>
        {/if}
      </div>
      <div class="bill-content">
        {@html bill.html}
      </div>
    </div>
  {/each}
</div>
