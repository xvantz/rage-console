<script lang="ts">
	import { onMount } from 'svelte'
	import { consoleStore } from './store/index.svelte.ts'
	import styles from './styles/Console.module.scss'
	import CodeLight from './components/codeLight.svelte'
	import { MessageFormat } from "@types";

	let consoleRef: HTMLDivElement | undefined = $state()
	let isAtBottom: boolean = $state(true)

	function scrollToBottom() {
		if (consoleRef) {
			consoleRef.scrollTop = consoleRef.scrollHeight
		}
	}

	function handleScroll() {
		if (consoleRef) {
			const {scrollTop, scrollHeight, clientHeight} = consoleRef
			isAtBottom = scrollTop + clientHeight >= scrollHeight - 5
		}
	}

	function formatTimestamp(timestamp: number): string {
		const date = new Date(timestamp)
		return date.toLocaleTimeString()
	}

	$effect(() => {
		if (isAtBottom && consoleStore.messages.length) {
			setTimeout(scrollToBottom, 0)
		}
	})

	onMount(() => {
		scrollToBottom()
	})
</script>

{#if consoleStore.view}
  <div bind:this={consoleRef} class={styles.console} onscroll={handleScroll}>
    {#each consoleStore.messages as msg}
      <div class={styles.message}>
        <div class={styles.messageContain}>
          <div class={`${styles.messageBlockColor} ${styles[msg.type]}`}></div>
          <div class={styles.messageTimestamp}>
            [{formatTimestamp(msg.timestamp)}] [{msg.type}] {'>>'}
          </div>
          <div class={styles.messageBlock}>
            <CodeLight
              code={msg.content}
              language={
              msg.format === MessageFormat.json ? 'json'
              : msg.format === MessageFormat.html ? 'html'
              : 'javascript'
              }
            />
          </div>
        </div>
        <div class={styles.rightBlock}>
          {#if msg.count && msg.count > 1}
            <div class={styles.messageCount}>
              {msg.count}x
            </div>
          {/if}
          <button
            class={styles.copyIcon}
            onclick={() => consoleStore.copyToClipboard(msg.content)}
            aria-label="copy">
          </button>
        </div>
      </div>
    {/each}
  </div>

  <div class={styles.icons}>
    <button
      class={styles.container}
      onclick={() => consoleStore.clearMessages()}
      aria-label="clear messages">
      <i class={styles.binIcon}></i>
    </button>
    <button
      class={styles.container}
      onclick={scrollToBottom}
      aria-label="scroll down messages">
      <i class={styles.arrowDownIcon}></i>
    </button>
  </div>
{/if}
