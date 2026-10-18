import type { RegionId } from "../engine/learningTrack";

export default function RegionLandmark({ region }: { region: RegionId }) {
  return <svg viewBox="0 0 190 125" fill="none" aria-hidden="true" className="region-landmark">
    <ellipse cx="95" cy="108" rx="85" ry="15" fill="#77875B" opacity=".12" />
    {region === "arrays" ? <>
      <path d="M14 101Q35 67 91 77T179 102L167 114H32Z" fill="#BFD69A" />
      <path d="M64 102V65H111V102" fill="#F7E8BE" stroke="#BBA67D" strokeWidth="3" />
      <path d="m54 67 33-32 35 32Z" fill="#D69379" stroke="#B67D65" strokeWidth="3" strokeLinejoin="round" />
      <rect x="83" y="78" width="14" height="24" rx="6" fill="#AA916B" />
      <path d="M27 97V78H54V99M121 99V72H155V101" fill="#FFF0CE" stroke="#C1AD7F" strokeWidth="3" />
      <path d="m20 79 20-20 22 20M115 74l23-25 24 25" fill="#9AB583" stroke="#7E9D6B" strokeWidth="4" strokeLinejoin="round" />
      <path d="M164 99V59" stroke="#83965F" strokeWidth="5" /><circle cx="164" cy="53" r="18" fill="#9CBF80" stroke="#83A76B" strokeWidth="3" />
      {[0, 1, 2].map(i => <g key={i}><rect x={54 + i * 25} y="105" width="22" height="15" rx="4" fill="#FDF9E8" stroke="#A6B683" strokeWidth="2" /><text x={65 + i * 25} y="116" textAnchor="middle" fontSize="10" fill="#819968" fontWeight="900">{i}</text></g>)}
    </> : region === "linear-structures" ? <>
      <path d="M12 104Q56 74 107 82T178 108L154 116H34Z" fill="#DBCE9D" />
      <path d="M19 104V54h47v50" fill="#FFF0CF" stroke="#B9A37B" strokeWidth="3" />
      {[0,1,2].map(i => <rect key={i} x="25" y={90-i*16} width="35" height="13" rx="4" fill={['#A3BFCE','#BAA3CB','#D4B787'][i]} stroke="#FFF8DE" strokeWidth="2" />)}
      <path d="M41 47V28m-6 6 6-6 6 6" stroke="#A48C69" strokeWidth="3" strokeLinecap="round" />
      <rect x="90" y="52" width="77" height="37" rx="6" fill="#F4E5BF" stroke="#BDA77B" strokeWidth="3" />
      {[0,1,2].map(i => <g key={i}><rect x={96+i*23} y="60" width="18" height="20" rx="4" fill="#A6BE9B" stroke="#FDF8DC" strokeWidth="2" /><circle cx={105+i*23} cy="70" r="3" fill="#FDF8DC" /></g>)}
      <path d="m78 69 10 0m-5-5 5 5-5 5m87-5h10m-5-5 5 5-5 5" stroke="#B19B70" strokeWidth="3" strokeLinecap="round" />
      <path d="M79 106h18m23 0h18" stroke="#B69E73" strokeWidth="4" strokeLinecap="round" />
      {[77,115,153].map((x,i) => <g key={x}><rect x={x-13} y="94" width="27" height="23" rx="6" fill="#FFF3D2" stroke="#BDA77B" strokeWidth="2" /><text x={x} y="110" textAnchor="middle" fontSize="12" fontWeight="900" fill="#A58E66">{i+1}</text></g>)}
    </> : region === "trees" ? <>
      <path d="M8 108Q30 75 91 85T181 104L164 116H25Z" fill="#BDD5B7" />
      <path d="M95 108V31M95 45 56 69M95 45l39 24M56 74 35 101M56 74l23 27M134 74l23 27" stroke="#96AB78" strokeWidth="7" strokeLinecap="round" />
      {[[95,28,8],[56,69,3],[134,69,12],[35,104,1],[79,104,6],[157,104,15]].map(([x,y,value]) => <g key={x}><circle cx={x} cy={y} r={y===28?19:16} fill={y===28?'#A5C387':'#C2D6A6'} stroke="#F4F2D7" strokeWidth="3" /><text x={x} y={y+5} textAnchor="middle" fontSize="13" fontWeight="900" fill="#6E8C59">{value}</text></g>)}
    </> : <>
      <path d="M9 109 48 45l26 40 37-68 70 93Z" fill="#B4B7C8" stroke="#959BB0" strokeWidth="3" strokeLinejoin="round" />
      <path d="m34 68 14-23 15 23-16-8Zm58-15 19-36 24 37-23-11Z" fill="#FFFBEA" />
      <path d="m67 107 20-35 21 35M130 110l20-33 27 33" fill="#C3C9BC" stroke="#A5B29E" strokeWidth="3" />
      <path d="m38 104 47-13 47 13 26-43" stroke="#E4CDA0" strokeWidth="5" strokeLinecap="round" />
      {[[38,104],[85,91],[132,104],[158,61]].map(([x,y]) => <circle key={x} cx={x} cy={y} r="7" fill="#FFF6D9" stroke="#A79BBE" strokeWidth="3" />)}
      <path d="M112 27V4m0 0 20 6-20 7" stroke="#A687B0" strokeWidth="3" fill="#C7A7CC" strokeLinejoin="round" />
    </>}
  </svg>;
}

