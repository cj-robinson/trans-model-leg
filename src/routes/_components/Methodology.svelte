<script>
  import doc from "../_data/doc.json";

  let expanded = false;

  function toggleBox() {
    expanded = !expanded;
  }
</script>

<div 
  class="method-box"
  on:click={toggleBox}
  aria-expanded={expanded}
  style="cursor: pointer;"
>
  <div class="method-header">
    <span class="toggle-icon">{expanded ? '−' : '+'}</span>
    <h3>Methodology</h3>
  </div>
  <div class="method-content" style="max-height: {expanded ? '500px' : '0'};">
    {#if expanded}
      <p>{@html doc.methodology}</p>
    {/if}
  </div>
</div>

<style>
  .method-box {
    border: 2px solid;
    max-width: 700px;
    overflow: hidden;
    transition: box-shadow 0.2s;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    margin-bottom: 1em;
  }
  .method-header {
    display: flex;
    align-items: center;
    gap: 1em;
    user-select: none;
  }
  .toggle-icon {
    font-size: 2em;
    line-height: 1;
    margin-left: 0.5em;
    font-weight: bold;
  }
  .method-content {
    transition: max-height 0.3s;
    margin-left: 1em;
  }
</style>