<script>
  import { beforeUpdate } from "svelte";
  
  export let step;
  export let scrollDirection = ""; // Bind this from parent

  let previousStep = undefined;

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
      else if (step === undefined && previousStep === 0) {
        scrollDirection = "up"; // New state for exiting
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
</script>