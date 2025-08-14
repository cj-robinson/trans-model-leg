<script>
  import Scrolly from "./_components/Scrolly.svelte";
  import BillColdOpen from "./_components/BillColdOpen.svelte";
  import ACLUChart from "./_components/ACLUChart.svelte";
  import SAFEActTextChange from "./_components/SAFEActTextChange.svelte";
  import Methodology from "./_components/Methodology.svelte";
  import Map from "./_components/Map.svelte";

  import doc from "./_data/doc.json";

  import "../app.css";

  import { onMount } from "svelte";

  let value1; // For the first Scrolly
  let value2; // For the second Scrolly

  // Extract steps from the first object in the coldopen array
  const steps = Object.values(doc.coldopen[0]);

  // Extract steps from the first object in the safesteps array
  const safe_steps = Object.values(doc.safegraphic[0]);
</script>

<svelte:head>
  <title>The Legislative Network Behind State Trans Laws</title>
</svelte:head>

<section>
  <div class="section-container">
    <div class="steps-container">
      <Scrolly bind:value={value1}>
        {#each steps as text, i}
          <div class="step" class:active={value1 === i}>
            <div class="step-content">{@html text}</div>
          </div>
        {/each}
        <div class="spacer"/>
      </Scrolly>
    </div>
    <div class="sticky">
      <div class="bill-sticky-container">
        <BillColdOpen step={value1} />
      </div>  
    </div>
  </div>
  <br />
  <br />
  <br />
  <div class="body-text">
    <div class="hero">
      {@html doc.headline}
    </div>
    <p><a href="https://cj-robinson.github.io">By C.J. Robinson</a></p>
    <div>{@html doc.intro}</div>

    <div class="graphic-title">
      Anti-LGBTQ legislation significantly increased in recent years
    </div>
    <div class="graphic-sub">
      Number of anti-LGBTQ legislation introduced in the United States, as
      tracked by the ACLU
    </div>
    <ACLUChart />
    <br />
    <div>{@html doc.intro2}</div>
    <div>{@html doc.intro3}</div>
    <div>{@html doc.intro4}</div>
    <h3>{@html doc.safesubtitle}</h3>
    <div>{@html doc.safeactintro}</div>
  </div>
  <div class="section-container">
    <div class="steps-container">
      <div class="spacer" />
      <Scrolly bind:value={value2}>
        {#each safe_steps as text, i}
          <div class="step" class:active={value2 === i}>
            <div class="step-content">{@html text}</div>
          </div>
        {/each}
        <div class="spacer" />
      </Scrolly>
    </div>
    <div class="sticky">
        <SAFEActTextChange step={value2} />
    </div>
  </div>
  <div class="body-text">
    <div>{@html doc.safeact2}</div>
    <h3>{@html doc.fiwsasubtitle}</h3>
    <p>{@html doc.fiwsa}</p>
    <h3>{@html doc.kicker}</h3>
    <p>{@html doc.rep1}</p>
    <div class="graphic-title">
      Model Legislation is Introduced Around the Country, Often by Less
      Well-Resourced Legislatures
    </div>
    <div class="graphic-sub">
      Legislation introduced in the United States utilizing language found in
      model bills
    </div>
    <Map />
    <p>{@html doc.rep2}</p>
    <br />
    <br />
    <br />
    <hr>
    <Methodology />
  </div>
</section>

<style>
  :global(body) {
    overflow-x: hidden;
    font-family: "Georgia", serif;
    font-optical-sizing: auto;
    font-style: normal;
  }

  .container {
    height: 100vh;
  }

  .body-text {
    max-width: 700px;
    margin: auto;
    font-size: 1.2em;
  }

  .hero {
    display: flex;
    font-family: "Libre Franklin", sans-serif;

    place-items: center;
    flex-direction: column;
    justify-content: center;
    text-align: center;
  }

  .hero h2 {
    margin-top: 0;
    font-weight: 200;
  }

  .spacer {
    height: 40vh;
  }

  .sticky {
    position: sticky;
    top: 10%;
    flex: 1 1 60%;
    width: 60%;
  }

  .section-container {
    text-align: center;
    transition: background 100ms;
    display: flex;
    background-color: #f0f0f0; /* Light gray */
  }

  .step-content {
    font-size: 1rem;
    background: whitesmoke;
    color: #ccc;
    border-radius: 5px;
    padding: 0.5rem 1rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    transition: background 500ms ease;
    box-shadow: 1px 1px 10px rgba(0, 0, 0, 0.2);
    text-align: left;
    width: 75%;
    margin: auto;
    max-width: 500px;
  }

  .step.active .step-content {
    background: white;
    color: black;
  }

  .steps-container,
  .sticky {
    height: 100%;
  }

  .steps-container {
    transform: translate3d(0, 0, 0);
    position: relative;
    padding: 0;
    z-index: 10;
    max-width: 35rem;
    margin: 0 auto;
    padding-bottom: 4em;
  }

  .step {
    color: black;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 90svh;
  }

  .step > * {
    width: 700px;
    margin-left: 1.3em;
    margin-right: 1.3em;
    text-align: left;
    padding: 1.2em !important;
  }

  .section-container {
    flex-direction: column-reverse;
  }

  .sticky {
    width: 95%;
    margin: auto;
  }
  /* } */
</style>
