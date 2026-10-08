const PATHS = {
  merge: 'M6 4v5a4 4 0 0 0 4 4h4a4 4 0 0 1 4 4v3M18 4v5a4 4 0 0 1-4 4M12 13v8',
  split: 'M12 3v7M12 10l-6 10M12 10l6 10M4 4h4M16 4h4',
  organize: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  rotate: 'M21 12a9 9 0 1 1-3.2-6.9M21 4v5h-5',
  compress: 'M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7',
  repair: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.7-.7-2.5z',
  images: 'M4 5h16v14H4zM8.5 10h.01M4 17l5-5 4 4 3-3 4 4',
  pages: 'M7 3h8l4 4v14H7zM15 3v4h4M10 14l2-2 3 3',
  text: 'M5 6h14M5 10h14M5 14h9M5 18h11',
  watermark: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
  numbers: 'M10 8l-1 8M15 8l-1 8M7 11h10M7 14h10M4 4h16v16H4z',
  crop: 'M6 2v14h14M2 6h14v14',
  sign: 'M3 17c3 0 4-9 7-9s0 9 4 9 3-3 7-3M3 21h18',
  lock: 'M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3',
  unlock: 'M6 11h12v9H6zM8 11V8a4 4 0 0 1 7.6-1.7',
  tag: 'M3 12l9-9h8v8l-9 9zM16 8h.01',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3',
  upload: 'M12 16V4M7 9l5-5 5 5M4 20h16',
  download: 'M12 4v12M7 11l5 5 5-5M4 20h16',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  close: 'M6 6l12 12M18 6L6 18',
  check: 'M5 12l5 5 9-10',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
  wifi: 'M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01',
  plus: 'M12 5v14M5 12h14',
  up: 'M12 19V5M6 11l6-6 6 6',
  down: 'M12 5v14M6 13l6 6 6-6',
  copy: 'M9 9h11v11H9zM5 15V4h11',
  command: 'M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3z',
  clock: 'M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
  scan: 'M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16',
  cut: 'M6 6a2 2 0 1 0 0 .01M6 18a2 2 0 1 0 0 .01M8 7.5L20 18M8 16.5L20 6',
  resize: 'M4 14v6h6M20 10V4h-6M4 20l7-7M20 4l-7 7',
  swap: 'M4 8h13l-3-3M20 16H7l3 3',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 4-6 8-6s8 2 8 6',
  qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2M14 18h2v2M18 18h2v2',
  menu: 'M4 7h16M4 12h16M4 17h16',
};

export default function Icon({ name, size = 20, className = '', strokeWidth = 1.7 }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name] || PATHS.pages} />
    </svg>
  );
}
