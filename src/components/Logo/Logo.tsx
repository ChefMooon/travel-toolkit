import { useId } from "react";

export default function Logo() {
  const gradId = `tt-stamp-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <div className="brand-logo">
      <svg className="logo-svg" aria-hidden="true" focusable="false" viewBox="0 0 200 200"><defs><linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f4777c"/><stop offset="1" stopColor="#a76273"/></linearGradient></defs><path d="M0 0L7.67 0A9 9 0 0 0 25.67 0L41 0A9 9 0 0 0 59 0L74.33 0A9 9 0 0 0 92.33 0L107.67 0A9 9 0 0 0 125.67 0L141 0A9 9 0 0 0 159 0L174.33 0A9 9 0 0 0 192.33 0L200 0L200 7.67A9 9 0 0 0 200 25.67L200 41A9 9 0 0 0 200 59L200 74.33A9 9 0 0 0 200 92.33L200 107.67A9 9 0 0 0 200 125.67L200 141A9 9 0 0 0 200 159L200 174.33A9 9 0 0 0 200 192.33L200 200L192.33 200A9 9 0 0 0 174.33 200L159 200A9 9 0 0 0 141 200L125.67 200A9 9 0 0 0 107.67 200L92.33 200A9 9 0 0 0 74.33 200L59 200A9 9 0 0 0 41 200L25.67 200A9 9 0 0 0 7.67 200L0 200L0 192.33A9 9 0 0 0 0 174.33L0 159A9 9 0 0 0 0 141L0 125.67A9 9 0 0 0 0 107.67L0 92.33A9 9 0 0 0 0 74.33L0 59A9 9 0 0 0 0 41L0 25.67A9 9 0 0 0 0 7.67Z" style={{ fill: "var(--stamp-paper)" }} stroke="rgba(90,40,48,.55)" strokeWidth="3"/><rect x="17" y="17" width="166" height="166" fill={`url(#${gradId})`}/><rect x="30.28" y="30.28" width="139.44" height="139.44" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="5"/><path transform="translate(49.3 128.4) scale(4)" fill="#fff" d="M12.24-14.22L12.24-11.57L7.97-11.57L7.97 0L4.54 0L4.54-11.57L0.35-11.57L0.35-14.22L12.24-14.22ZM25-14.22L25-11.57L20.73-11.57L20.73 0L17.30 0L17.30-11.57L13.12-11.57L13.12-14.22L25-14.22Z"/></svg>
    </div>
  );
}
