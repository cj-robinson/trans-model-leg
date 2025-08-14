<script>
  import doc from "../_data/doc.json";
</script>

<h3>Methodology</h3>
<p>{@html doc.methodology}</p>
<a href="https://github.com/cj-robinson/model-leg-analysis" target="_blank">Find the GitHub repo here</a>
<br>
<br>
<br>
<style>
  .method-box {
    border: 2px solid;
    max-width: 700px;
    overflow: hidden;
    transition: box-shadow 0.2s;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
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
