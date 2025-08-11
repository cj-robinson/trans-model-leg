<script>
  import Scrolly from "../Scrolly.svelte";
  import BillColdOpen from "./_components/BillColdOpen.svelte";
  import ACLUChart from "./_components/ACLUChart.svelte";
  import doc from "./_data/doc.json";
  import { onMount } from "svelte";

  let value;
  const steps = [
    "<p>This is Idaho's H.B 500, which Rep. Ehardt admitted was largely authored by the Alliance to Defend Freedom.</p>",
    "<p>Here's another bill introduced in Montana the year after Idaho's bill was introduced.</p>",
    "<p>The two bills are titled the same and are markedly similar. <span style='background:green; color: white; border-radius: 2px;'>Green text</span> indicates phrases repeated directly from the Idaho bill. </p>",
    "<p>A large portion of the bill was copied directly from the original legislation. Here, gray highlights represent new language and green represents copied phrases.</p>",
    "<p>Bills across the country mirror this model legislation. </p>",
    "<p>Bills across the country mirror this model legislation. </p>",
  ];
</script>

<section>
  <div class="section-container">
    <div class="steps-container">
      <Scrolly bind:value>
        {#each steps as text, i}
          <div class="step" class:active={value === i}>
            <div class="step-content">{@html text}</div>
          </div>
        {/each}
        <div class="spacer" />
      </Scrolly>
    </div>
    <div class="sticky">
      <BillColdOpen step={value} />
    </div>
  </div>


  <div class="body-text">
    <div class="hero">
      <h1>{doc.headline}</h1>
      <h2>{doc.leadin}</h2>
      <h2>By C.J. Robinson</h2>
    </div>    
    <div>{@html doc.intro}</div>
    <div>{@html doc.intro2}</div>
    <br />
        <ACLUChart />
    <br />

    <div>{@html doc.intro3}</div>

    <div>{@html doc.intro4}</div>
    <h2>{@html doc.safesubtitle}</h2>
    <div>{@html doc.safeactintro}</div>
    <div>{@html doc.safeact2}</div>
    <h2>{@html doc.fiwsasubtitle}</h2>
    <p>{@html doc.fiwsa}</p>
    <h2>{@html doc.kicker}</h2>
    <p>{@html doc.rep}</p>
  </div>
  <div class="hero">
  </div>
</section>

<style>
  :global(body) {
    overflow-x: hidden;
  }

  .body-text {
    max-width: 700px;
    margin: auto;
    font-size: 1.2em;
  }

  .hero {
    height: 60vh;
    display: flex;
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
    margin-top: 1em;
    text-align: center;
    transition: background 100ms;
    display: flex;
  }

  .step {
    height: 80vh;
    display: flex;
    place-items: center;
    justify-content: center;
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
    flex: 1 1 40%;
    z-index: 10;
  }

  /* Comment out the following line to always make it 'text-on-top' */
  /* @media screen and (max-width: 768px) { */
  .section-container {
    flex-direction: column-reverse;
  }
  .sticky {
    width: 95%;
    margin: auto;
  }
  /* } */
</style>
