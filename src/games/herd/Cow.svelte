<script lang="ts">
  let { pink = false, size = 20 }: { pink?: boolean; size?: number } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
  <path d="M10 18c-6-2-8-8-6-10 4 0 9 3 11 6M54 18c6-2 8-8 6-10-4 0-9 3-11 6" fill={pink ? '#ff8fc0' : '#2a2a2a'} />
  <ellipse cx="32" cy="30" rx="20" ry="19" fill={pink ? '#ffb3d4' : '#ffffff'} stroke={pink ? '#e0559a' : '#2a2a2a'} stroke-width="3" />
  {#if !pink}<path d="M18 20c4-4 10-3 11 1s-3 7-8 7-6-5-3-8z" fill="#2a2a2a" />{/if}
  <ellipse cx="32" cy="42" rx="14" ry="10" fill={pink ? '#ff7ab4' : '#ffb7c5'} stroke={pink ? '#e0559a' : '#2a2a2a'} stroke-width="3" />
  <circle cx="27" cy="42" r="2.4" fill="#2a2a2a" /><circle cx="37" cy="42" r="2.4" fill="#2a2a2a" />
  <circle cx="24" cy="28" r="3" fill="#2a2a2a" /><circle cx="40" cy="28" r="3" fill="#2a2a2a" />
</svg>
