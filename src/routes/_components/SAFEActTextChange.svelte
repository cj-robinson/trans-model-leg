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
    originalBill = { id: "original", html: originalActHTML, type: "original" };

    const montanaActHTMLResponse = await fetch("/montana_act.html");
    montanaActHTML = await montanaActHTMLResponse.text();
    montanaBill = { id: "montana", html: montanaActHTML, type: "montana" };
  });    

</script>