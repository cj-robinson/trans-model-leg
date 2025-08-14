<script>
  import { onMount, onDestroy } from 'svelte';
  
  let chartContainer;
  let script;
  
  onMount(() => {
    // Create and append the script dynamically
    script = document.createElement('script');
    script.src = 'https://datawrapper.dwcdn.net/JLsB4/embed.js';
    script.defer = true;
    script.charset = 'utf-8';
    script.setAttribute('data-target', '#datawrapper-chart');
    document.body.appendChild(script);
  });
  
  onDestroy(() => {
    // Clean up the script when component is destroyed
    if (script && script.parentNode) {
      script.parentNode.removeChild(script);
    }
  });
</script>

<div style="min-height:375px" id="datawrapper-chart">
  <noscript>
    <img src="https://datawrapper.dwcdn.net/JLsB4/full.png" alt="Column Chart" />
  </noscript>
</div>