/** A panoramic landscape with small decorations kept at the edges of the lesson. */
export default function LinkedWorld({ map = false }: { map?: boolean }) {
  const river = "M1805-50C1760 100 1880 205 1825 355S1740 610 1830 800S1850 1000 1810 1130";
  const road = "M-40 1005C180 935 360 1040 600 995S940 900 1150 965S1440 1035 1620 985";
  return <div className={`linked-scenery ${map ? "linked-map-scenery" : ""}`} aria-hidden="true">
    <svg className="linked-terrain" viewBox="0 0 1920 1080" preserveAspectRatio="none" fill="none">
      <rect width="1920" height="1080" fill="#E6D4AD" />
      <path d="M-60 940Q230 865 490 955T1050 955T1550 930T1980 970V1120H-60Z" fill="#A8BF8A" opacity=".18" />
      <path d="M-40 1060Q280 1005 540 1065T1110 1050T1950 1040V1120H-40Z" fill="#A8BF8A" opacity=".12" />
      <path d={road} stroke="#C4AC7C" strokeWidth="25" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
      <path d={road} stroke="#F4E5BE" strokeWidth="21" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
      <path d={road} stroke="#FFF9E5" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeDasharray="2 12" strokeLinecap="round" />
      {map && <g opacity=".65">
        <path d="M-40 300C160 270 80 480 225 540S340 750 260 930" stroke="#C4AC7C" strokeWidth="18" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
        <path d="M-40 300C160 270 80 480 225 540S340 750 260 930" stroke="#F4E5BE" strokeWidth="14" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
        <path d="M1460-30C1390 140 1570 240 1495 400S1530 660 1710 750" stroke="#C4AC7C" strokeWidth="18" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
        <path d="M1460-30C1390 140 1570 240 1495 400S1530 660 1710 750" stroke="#F4E5BE" strokeWidth="14" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
      </g>}
      <path d={river} stroke="#F8F1D4" strokeWidth="43" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
      <path d={river} stroke="#B5D4D0" strokeWidth="31" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
    </svg>
    {(map ? ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine"] : ["one", "two", "three"]).map(position => <svg key={position} className={`linked-terrain-tree tree-${position}`} viewBox="0 0 50 70" fill="none">
      <path d="M5 47 25 7 45 47H31V65H20V47Z" fill="#AEC88D" stroke="#8CA06E" strokeWidth="3" />
    </svg>)}
    <svg className="linked-terrain-bridge" viewBox="0 0 64 54" fill="none">
      <path d="m7 8 49 10M5 23l49 10M3 38l49 10" stroke="#BEA880" strokeWidth="5" strokeLinecap="round" />
    </svg>
    {["one", "two", "three"].map(position => <svg key={position} className={`linked-terrain-flower flower-${position}`} viewBox="0 0 30 26" fill="#FFF8D8">
      <circle cx="7" cy="18" r="5" /><circle cx="15" cy="8" r="5" /><circle cx="23" cy="18" r="5" />
    </svg>)}
    <span className="linked-terrain-grass grass-one" /><span className="linked-terrain-grass grass-two" />
  </div>;
}
