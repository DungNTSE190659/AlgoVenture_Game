export default function World({ map = false }: { map?: boolean }) {
  return (
    <div
      className={`world-scenery ${map ? "world-map" : ""}`}
      aria-hidden="true"
    >
      <div className="sun" />
      <div className="cloud cloud-one" />
      <div className="cloud cloud-two" />
      <div className="cloud cloud-three" />
      <svg
        className="world-landscape"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMax slice"
        fill="none"
      >
        <path
          d="M-100 630Q100 540 330 660T800 620T1500 640V1000H-100Z"
          fill="#d8e9b8"
        />
        <path
          d="M-100 740Q180 610 440 730T960 710T1500 690V1000H-100Z"
          fill="#bddc9b"
        />
        <path
          d="M-100 855Q230 735 520 830T1050 790T1500 820V1000H-100Z"
          fill="#a5ce8e"
        />
        <g fill="#95bd7e">
          <ellipse cx="78" cy="814" rx="72" ry="13" />
          <ellipse cx="1300" cy="766" rx="68" ry="12" />
        </g>
        <g stroke="#829f62" strokeWidth="13" strokeLinecap="round">
          <path d="M80 802V720M1300 755V679" />
        </g>
        <g fill="#8cc391" stroke="#7bb080" strokeWidth="3">
          <path d="M22 737q-5-40 30-40-1-35 28-38 34-2 35 32 39 5 26 42-18 34-61 24-33 13-58-20Z" />
          <path d="M1247 694q-9-35 24-36 3-28 31-30 30 0 31 31 35 0 24 32-19 29-53 19-39 9-57-16Z" />
        </g>
        <g fill="#c2e0a8">
          <ellipse cx="82" cy="691" rx="15" ry="9" />
          <ellipse cx="1307" cy="658" rx="12" ry="8" />
        </g>
        <g fill="#83b87e">
          <path d="m197 853 8-20 7 20 8-13 6 13M1170 833l7-18 8 18 10-10 4 11M359 794l6-13 5 14M1080 770l6-13 6 13" />
        </g>
        <g fill="#faf1ce">
          <circle cx="176" cy="762" r="4" />
          <circle cx="180" cy="756" r="4" />
          <circle cx="184" cy="762" r="4" />
          <circle cx="1260" cy="859" r="5" />
          <circle cx="1265" cy="852" r="5" />
          <circle cx="1270" cy="859" r="5" />
        </g>
        <g fill="#d6b48d">
          <ellipse cx="278" cy="858" rx="15" ry="7" />
          <ellipse cx="1139" cy="864" rx="18" ry="8" />
        </g>
      </svg>
      <span className="world-spark sparkle-a">✦</span>
      <span className="world-spark sparkle-b">✧</span>
      <span className="world-spark sparkle-c">✧</span>
    </div>
  );
}
