// Small hand-built line icons, one consistent style — same set as the MENO
// design prototype, just expressed as a React component instead of a string.
const PATHS = {
  leaf: '<path d="M5 19c-1.5-6 1-13 13-14-2 11-6 14-13 14Z"/><path d="M6 18c2-3 5-6 11-11" stroke-linecap="round"/>',
  flame: '<path d="M12 2.5c.7 2.6-.7 3.8-2 5.3-1.3 1.6-2 3.3-2 5.2a4 4 0 0 0 8 0c0-1.2-.5-2-1-2.7-.1 1-.5 1.7-1.2 1.7-1.6 0-1-2-.3-3.4.9-1.9 1-3.9-1.5-6.1Z"/>',
  moon: '<path d="M19 14.2A7.6 7.6 0 0 1 9.8 5 7.6 7.6 0 1 0 19 14.2Z"/>',
  bed: '<path d="M3 17v-5.5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2V13" stroke-linecap="round"/><path d="M12 13h6a2 2 0 0 1 2 2v2" stroke-linecap="round"/><path d="M3 17h18M3 13v6M21 19v-2" stroke-linecap="round"/><circle cx="6.5" cy="9.5" r="1.6"/>',
  brain: '<path d="M9 4.5a2.5 2.5 0 0 0-2.4 1.8A2.6 2.6 0 0 0 5 8.8a2.7 2.7 0 0 0 1 4.9A3 3 0 0 0 9 17.5" stroke-linecap="round"/><path d="M15 4.5a2.5 2.5 0 0 1 2.4 1.8A2.6 2.6 0 0 1 19 8.8a2.7 2.7 0 0 1-1 4.9 3 3 0 0 1-3 3.8" stroke-linecap="round"/><path d="M9 4.5v13M15 4.5v13" stroke-linecap="round"/>',
  sparkle: '<path d="M12 4v3M12 17v3M4 12h3M17 12h3M6.5 6.5l2 2M15.5 15.5l2 2M6.5 17.5l2-2M15.5 8.5l2-2" stroke-linecap="round"/>',
  chart: '<path d="M4 19V5M4 19h16" stroke-linecap="round"/><path d="M7 15l3.5-4 3 2.5L18 7" stroke-linecap="round" stroke-linejoin="round"/>',
  clipboard: '<rect x="6" y="4.5" width="12" height="15.5" rx="2"/><rect x="9" y="3" width="6" height="3" rx="1"/><path d="M9 11h6M9 14.5h6" stroke-linecap="round"/>',
  heart: '<path d="M12 19.5S4 14.8 4 9.4A4 4 0 0 1 12 7a4 4 0 0 1 8 2.4c0 5.4-8 10.1-8 10.1Z"/>',
  chat: '<path d="M4 6.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 3.5V6.5Z"/>',
  calendar: '<rect x="4" y="5.5" width="16" height="14.5" rx="2.5"/><path d="M4 10h16M8 3.5v4M16 3.5v4" stroke-linecap="round"/>',
  pencil: '<path d="M14.5 4.5l5 5L9 20H4v-5Z" stroke-linejoin="round"/>',
  plus: '<path d="M12 5v14M5 12h14" stroke-linecap="round"/>',
  chevronL: '<path d="M14.5 5.5l-7 6.5 7 6.5" stroke-linecap="round" stroke-linejoin="round"/>',
  chevronR: '<path d="M9.5 5.5l7 6.5-7 6.5" stroke-linecap="round" stroke-linejoin="round"/>',
  x: '<path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5" stroke-linecap="round" stroke-linejoin="round"/>',
  print: '<path d="M6 9V4h12v5M6 18H4.5A1.5 1.5 0 0 1 3 16.5v-5A1.5 1.5 0 0 1 4.5 10h15a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5H18M6 14h12v6H6Z"/>',
  trash: '<path d="M5 7h14M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2M7 7l1 12.5A1.5 1.5 0 0 0 9.5 21h5a1.5 1.5 0 0 0 1.5-1.5L17 7" stroke-linecap="round" stroke-linejoin="round"/>',
  send: '<path d="M4.5 12L19 4.5 13 19l-2.5-6L4.5 12Z" stroke-linejoin="round"/>',
  lock: '<rect x="5.5" y="10.5" width="13" height="9" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" stroke-linecap="round"/>',
  stethoscope: '<path d="M6 4v6a4 4 0 0 0 8 0V4" stroke-linecap="round"/><path d="M10 14v1.5a5 5 0 0 0 10 0V13" stroke-linecap="round"/><circle cx="20" cy="11.5" r="1.6"/><circle cx="6" cy="4" r="1.3"/><circle cx="10" cy="4" r="1.3"/>',
  crown: '<path d="M4 18h16M5 18l-1.5-9L9 12l3-6 3 6 5.5-3L18 18" stroke-linejoin="round"/>',
  battery: '<rect x="3" y="8" width="16" height="8" rx="2"/><path d="M21 10.5v3" stroke-linecap="round"/><path d="M6 11v2" stroke-linecap="round"/>',
  wave: '<path d="M3 12c1.5-3 3-3 4.5 0s3 3 4.5 0 3-3 4.5 0 3 3 4.5 0" stroke-linecap="round" stroke-linejoin="round"/>',
  smile: '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 14.5c1 1.3 2.2 2 3.5 2s2.5-.7 3.5-2" stroke-linecap="round"/><path d="M8.7 9.5h.01M15.3 9.5h.01" stroke-linecap="round" stroke-width="2.4"/>',
  bolt: '<path d="M13 3 5 13.5h5.5L11 21l8-11h-5.5Z" stroke-linejoin="round"/>',
  bone: '<path d="M7 8.5a2.3 2.3 0 1 0-3.4 2A2.3 2.3 0 1 0 6 14.4l6-6a2.3 2.3 0 1 0 3.4-2A2.3 2.3 0 1 0 18 2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 15.6a2.3 2.3 0 1 0 3.4 2A2.3 2.3 0 1 0 18 21.4l-6-6" stroke-linecap="round" stroke-linejoin="round"/>',
  droplet: '<path d="M12 3s6.5 7.4 6.5 11.5A6.5 6.5 0 0 1 5.5 14.5C5.5 10.4 12 3 12 3Z" stroke-linejoin="round"/>',
  scale: '<path d="M12 3v18M7 21h10" stroke-linecap="round"/><path d="M5 7h14" stroke-linecap="round"/><path d="M5 7 2 13a3 3 0 0 0 6 0L5 7ZM19 7l-3 6a3 3 0 0 0 6 0l-3-6Z" stroke-linejoin="round"/>',
  shield: '<path d="M12 3 5 6v5.5c0 4.6 3 7.7 7 9 4-1.3 7-4.4 7-9V6l-7-3Z" stroke-linejoin="round"/><path d="M9 12l2 2 4-4.5" stroke-linecap="round" stroke-linejoin="round"/>',
  download: '<path d="M12 4v11" stroke-linecap="round"/><path d="M7.5 11l4.5 4.5L16.5 11" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 19.5h14" stroke-linecap="round"/>',
  userX: '<circle cx="10" cy="8" r="3.5"/><path d="M4 20c0-3.6 2.7-6 6-6s6 2.4 6 6" stroke-linecap="round"/><path d="M16.5 9.5l4 4M20.5 9.5l-4 4" stroke-linecap="round"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V19.6a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H4.4a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.55-1.1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H10.5a1.7 1.7 0 0 0 1-1.55V4.4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V10.5a1.7 1.7 0 0 0 1.55 1H19.6a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.55 1Z"/>'
};

export function Icon({ name, size = 20, style }) {
  const body = PATHS[name] || '';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      style={style}
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}
