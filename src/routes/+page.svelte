<script>
  import Scrolly from "./_components/Scrolly.svelte";
  import BillColdOpen from "./_components/BillColdOpen.svelte";
  import ACLUChart from "./_components/ACLUChart.svelte";
  import Map from "./_components/Map.svelte";

  import doc from "./_data/doc.json";

  import '../app.css';

  import { onMount } from "svelte";

  let value;
  // Extract steps from the first object in the coldopen array
  const steps = doc.coldopen && doc.coldopen[0] ? 
    Object.values(doc.coldopen[0]) : [];
    
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
      <h1>{@html doc.headline}</h1>
      <h2>{@html doc.leadin}</h2>
      <h3>By C.J. Robinson</h3>
      <br/>
    </div>    
    <div>{@html doc.intro}</div>
    <div>{@html doc.intro2}</div>
        <ACLUChart />
    <br />
    <div>{@html doc.intro3}</div>
    <br />
    <Map/>
       <br />
    <div>{@html doc.intro4}</div>
    <h3>{@html doc.safesubtitle}</h3>
    <div>{@html doc.safeactintro}</div>
    <div>{@html doc.safeact2}</div>
    <h3>{@html doc.fiwsasubtitle}</h3>
    <p>{@html doc.fiwsa}</p>
    <h3>{@html doc.kicker}</h3>
    <p>{@html doc.rep}</p>
  </div>
  <div class="hero">
  </div>
</section>

<style>
  :global(body) {
    overflow-x: hidden;
    font-family: "Georgia", serif;
    font-optical-sizing: auto;
    font-style: normal;
  }

  .body-text {
    max-width: 700px;
    margin: auto;
    font-size: 1.2em;
  }



  .hero {
    height: 60vh;
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
    margin-top: 1em;
    text-align: center;
    transition: background 100ms;
    display: flex;
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
      transform: translate3d(0,0,0);
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
    text-align: center;
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
