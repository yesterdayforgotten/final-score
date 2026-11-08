<svg viewBox="0 0 140 110" aria-hidden="true">
  {#each [{ fill: '#e2433a', y: 6 }, { fill: '#f5c518', y: 32 }, { fill: '#2fa25a', y: 58 }, { fill: '#2f6fd6', y: 84 }] as row}
    <rect x="8" y={row.y} width="124" height="20" rx="5" fill={row.fill} />
    {#each [0, 1, 2, 3, 4] as k}<rect x={14 + k * 23} y={row.y + 3} width="18" height="14" rx="3" fill="rgba(255,255,255,.9)" />{/each}
  {/each}
  <path d="M19 9l10 10M29 9L19 19M42 35l10 10M52 35L42 45M65 61l10 10M75 61L65 71" stroke="#111" stroke-width="3" stroke-linecap="round" />
</svg>
