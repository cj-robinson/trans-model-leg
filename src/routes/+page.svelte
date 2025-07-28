<script>
	/* By Connor Rothschild https://twitter.com/CL_Rothschild
	Scrollytelling component from Russell Goldenberg https://twitter.com/codenberg/status/1432774653139984387 */
	
  import Scrolly from "../Scrolly.svelte";
  import Bills from "../Bills.svelte";
	
  let value;
  const steps = [
		 "<p>This is Idaho's H.B 500, which Rep. Ehardt admitted was largely authored by the Alliance to Defend Freedom.</p>",
    "<p>Here's another bill introduced in Montana the year after Idaho's bill was introduced.</p>",
    "<p>The two bills are titled the same and are markedly similar. <span style='background:green; color: white; border-radius: 2px;'>Green text</span> indicates phrases repeated directly from the Idaho bill. </p>",
    "<p>Bills across the country mirror this model legislation. </p>",
    "<p>Bills across the country mirror this model legislation. </p>"
  ];
</script>

<section>
	<div class='hero'>
		<h1> 
			The Spread of Transgender State-Level Legislation
		</h1>
		<h2>
			By C.J. Robinson
		</h2>
	</div>
  <div class='body-text'>
  <p>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Debitis perferendis vitae nulla velit quidem explicabo, magni nesciunt quam non quia! Aliquam modi provident fuga obcaecati commodi delectus adipisci sint corrupti.</p>
  <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Hic ullam perferendis similique repellat nemo? Quia molestiae recusandae minima sit magnam fugit, in nostrum totam officia voluptatum laudantium libero enim pariatur.</p>
  <p>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Soluta, est earum impedit veritatis atque minus sint repudiandae eos quidem aspernatur fugit recusandae adipisci enim dolor itaque officiis ipsum, asperiores quos.</p>
  </div>
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
      <Bills step={value} />
    </div>
  </div>
  <div class='body-text'>
  <p>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Debitis perferendis vitae nulla velit quidem explicabo, magni nesciunt quam non quia! Aliquam modi provident fuga obcaecati commodi delectus adipisci sint corrupti.</p>
  <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Hic ullam perferendis similique repellat nemo? Quia molestiae recusandae minima sit magnam fugit, in nostrum totam officia voluptatum laudantium libero enim pariatur.</p>
  <p>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Soluta, est earum impedit veritatis atque minus sint repudiandae eos quidem aspernatur fugit recusandae adipisci enim dolor itaque officiis ipsum, asperiores quos.</p>
  </div>
	<div class='hero'>
		<h1> 
			Thanks!
		</h1>
	</div>
</section>

<style>
	:global(body) {
		overflow-x: hidden;
	}

  .body-text {
    max-width: 60%;
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
    padding: .5rem 1rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    transition: background 500ms ease;
    box-shadow: 1px 1px 10px rgba(0, 0, 0, .2);
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
