<script lang="ts">
  import hljs from 'highlight.js'
  import javascript from 'highlight.js/lib/languages/javascript'
  import json from 'highlight.js/lib/languages/json'
  import 'highlight.js/styles/a11y-dark.css';

  hljs.registerLanguage('javascript', javascript)
  hljs.registerLanguage('json', json)
  type Props = {
    code: string
    language?: string
  }
  let {code, language = 'javascript'}: Props = $props()

  let codeElement = $state<HTMLElement>()

  $effect(() => {
    if (codeElement) {
      hljs.highlightElement(codeElement)
    }
  })
</script>

<pre><code bind:this={codeElement} class={language}>{code}</code></pre>

<style>
  pre {
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    appearance: none;
    code {
      display: block;
      tab-size: 3;
      background: rgba(0, 0, 0, 30%);
      border-radius: 2vh;
      padding: 1.2vh;
      white-space: pre-wrap;
      word-break: normal;
      overflow-wrap: normal;
      font-weight: 500;
      font-size: 1.3vh;
    }
  }
</style>
