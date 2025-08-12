<script>
  import { onMount, afterUpdate } from "svelte";
  import { scaleLinear, scaleSqrt } from "d3-scale";
  import { extent, min, max } from "d3-array";
  import { fly, fade } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import * as d3 from "d3";
  import Papa from "papaparse";
  import { flip } from "svelte/animate";
  import { assets } from "$app/paths";

  export let step;

  let billsData = [];
  let akActResponse = "";
  let akActHTML = "";
  let miActResponse = "";
  let miActHTML = "";
  let scActResponse = "";
  let scActHTML = "";

  // Bill objects for display, each with an id and html
  let akBill = { id: "", html: "" };
  let miBill = { id: "", html: "" };
  let scBill = { id: "", html: "" };

  let mi_bill_step = 1;
  let scroll_step = 2;
  let highlight_changed_text_step = 2;
  let sc_bill_step = 5;
  let sc_scroll_bill_step = 6;
  let highlight_changed_text_step2 = 6;
  let add_small_bills_step = 7;

  onMount(async () => {
    // Fetch and parse CSV
    const billsResponse = await fetch(`${assets}/safe_act.csv`);
    const billsCsvText = await billsResponse.text();
    const parsed = Papa.parse(billsCsvText, { header: true });
    billsData = parsed.data.filter(
      (bill) => bill.state && bill.text && bill.text.trim()
    );

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
  let smallBills = [];

  $: {
    let newBills = [];
    let newSmallBills = [];
    if (step >= 0) {
      newBills.push(akBill);
    }
    if (step >= mi_bill_step && step < sc_bill_step) {
      newBills.push(miBill);
    }
    if (step === scroll_step) {
      scrollTo(scrollBillNodes[0], 3750);
      scrollTo(scrollBillNodes[1], 2020);
    }
    if (step === scroll_step - 1 || step === sc_bill_step) {
      scrollTo(scrollBillNodes[0], 0);
    }
    if (step >= sc_bill_step && step < add_small_bills_step) {
      newBills.push(scBill);
    }
    if (step === sc_scroll_bill_step) {
      scrollTo(scrollBillNodes[0], 2800);
      scrollTo(scrollBillNodes[1], 1730);
    }
    if (step === sc_scroll_bill_step - 1) {
      scrollTo(scrollBillNodes[0], 0);
      scrollTo(scrollBillNodes[1], 0);
    }
    if (step >= add_small_bills_step) {
      newSmallBills.push(billsData);
    }
    if (step < add_small_bills_step) {
      newSmallBills = [0];
    }
    if (step === add_small_bills_step) {
      scrollTo(scrollBillNodes[0], 0);
    }
    smallBills = newSmallBills[0];
    introBills = [...newBills];
    console.log(step);
  }

  afterUpdate(() => {
    d3.selectAll(".bill.scroll-bill").style(
      "overflow-y",
      step < scroll_step || step === undefined ? "hidden" : "scroll"
    );

    // setTimeout(() => {
    // Fade out: select all fade-out spans, cascade by index

    // // Fade out: select all fade-out spans, cascade by index
    // d3.selectAll("p.bold")
    //   .transition()
    //   .duration(1000)
    //   .style("font-weight", step === bold_text_step || step === bold_text_step2 ? "700" : "200")
    //   }, 10);

    // d3.selectAll(".added_text")
    //   .transition()
    //   .delay((d, i) => i * 100)
    //   .duration(100)
    //   .style("color", step >= highlight_changed_text_step ? "transparent" : "black");

    setTimeout(() => {
      // Fade out: select all fade-out spans, cascade by index
      d3.selectAll('[class^="ngram-text-fade-out-"]')
        .transition()
        .delay((d, i) => i * 100)
        .duration(100)
        .style(
          "color",
          step >= highlight_changed_text_step ? "transparent" : "black"
        );
    }, 2000);

    setTimeout(() => {
      // Fade in: select all fade-in spans, cascade by index
      d3.selectAll('[class^="ngram-text-fade-in-"]')
        .transition()
        .delay((d, i) => i * 100)
        .duration(100)
        .style(
          "color",
          step >= highlight_changed_text_step ? "green" : "transparent"
        );
    }, 2000);

    // Fade in: select all fade-in spans, cascade by index
    d3.selectAll(".transparent")
      .transition()
      .delay((d, i) => i * 100)
      .duration(200)
      .style(
        "color",
        step >= highlight_changed_text_step + 1 ? "black" : "transparent"
      );
  });

  $: if (step === highlight_changed_text_step2) {
    setTimeout(() => {
      // Fade out: select all fade-out spans, cascade by index
      d3.selectAll('[class^="sc-ngram-text-fade-out-"]')
        .transition()
        .delay((d, i) => i * 50)
        .duration(100)
        .style(
          "color",
          step >= highlight_changed_text_step2 ? "transparent" : "black"
        );
    }, 1000);

    setTimeout(() => {
      // Fade in: select all fade-in spans, cascade by index
      d3.selectAll('[class^="sc-ngram-text-fade-in-"]')
        .transition("y")
        .delay((d, i) => i * 50)
        .duration(100)
        .style(
          "color",
          step >= highlight_changed_text_step2 ? "green" : "transparent"
        );
    }, 1000);

    setTimeout(() => {
      // Fade in: select all fade-in spans, cascade by index
      d3.selectAll(".sc-transparent")
        .transition()
        .delay((d, i) => i * 50)
        .duration(100)
        .style(
          "color",
          step >= highlight_changed_text_step2 ? "black" : "trasnparent"
        );
    }, 2000);
  }

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
        class="bill scroll-bill"
        class:original-bill={bill.id === "ak"}
        bind:this={scrollBillNodes[index]}
        style:height={step >= add_small_bills_step ? "200px" : "400px"}
        style:transition="height 1000ms cubic-bezier(0.33, 1, 0.68, 1)"
        animate:flip
        in:fly={{
          duration: 1000,
          x: 0, // Slide in from the left
          y: 200, // No vertical movement
        }}
        out:fly={{
          duration: 1000,
          x: 0, // Slide out to the right
          y: -100, // No vertical movement
        }}
      >
        <div>
          {#if bill.id == "ak"}{/if}
        </div>
        <div class="bill-content">
          {@html bill.html}
        </div>
      </div>
    {/each}
  </div>
  <div class="bill-box">
    {#each smallBills as bill, index (bill.bill_id)}
      <div class="small-bill" animate:flip={{}} in:fly={{}}>
        <div class="small-bill-content-header">
          {bill.state} - {bill.year_start}
        </div>
        <div class="small-bill-content">
          {bill.text}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>


 
  :global(.transparent),
  :global(.sc-transparent) {
    color: transparent;
  }

  :global([class^="sc-ngram-text-fade-in-"]) {
    color: transparent;
  }
  :global([class^="ngram-text-fade-in-"]) {
    color: transparent;
  }

  :global(p.bold) {
    font-weight: 700;
  }

  :global([class^="ngram-text-fade-in-"]) {
    font-weight: 200 !important;
  }
</style>
