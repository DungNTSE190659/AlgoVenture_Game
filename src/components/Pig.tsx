import type { PigMood } from "../engine/lesson";
type Props = { mood?: PigMood; small?: boolean };
const names: Record<PigMood, string> = {
  happy: "vui vẻ",
  thinking: "đang suy nghĩ",
  oops: "động viên bạn",
  celebrate: "ăn mừng",
  pointing: "chỉ dẫn",
  explaining: "đang giải thích",
  surprised: "ngạc nhiên",
  proud: "tự hào",
};

/** SVG character rig: independently animated head, ears, eyes, mouth, arms and body. */
export default function Pig({ mood = "happy", small = false }: Props) {
  const cheering = mood === "celebrate";
  const pointing = mood === "pointing";
  const thinking = mood === "thinking";
  const surprised = mood === "surprised";
  const proud = mood === "proud";
  const worried = mood === "oops";
  const pupilX = pointing ? 4 : thinking ? 2 : 0;
  const pupilY = thinking ? -4 : 1;
  return (
    <svg
      className={`pig pig-${mood} ${small ? "pig-small" : ""}`}
      viewBox="0 0 180 200"
      fill="none"
      role="img"
      aria-label={`Buta ${names[mood]}`}
      data-mood={mood}
    >
      <ellipse
        className="pig-shadow"
        cx="90"
        cy="187"
        rx="48"
        ry="7"
        fill="#524b67"
        opacity=".12"
      />
      <g className="pig-rig">
        <g className="pig-backpack" stroke="#7B7850" strokeWidth="2.5">
          <rect x="34" y="125" width="103" height="48" rx="15" fill="#9FA56E" />
          <rect x="30" y="143" width="19" height="24" rx="6" fill="#7C8D5D" />
          <path
            d="M43 129v-7q0-7 10-7h71q9 0 9 8v8"
            stroke="#D9C790"
            strokeWidth="8"
            strokeLinecap="round"
          />
        </g>
        <path
          className="pig-tail"
          d="M134 147c30-13 28 12 14 7-9-4 10-20 15-8"
          stroke="#D57993"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <g
          className="pig-legs"
          stroke="#B76B88"
          strokeWidth="2.5"
          strokeLinejoin="round"
        >
          <path
            d="m61 161-3 16c-1 10 18 12 21 3l5-17M99 163l4 17c3 9 22 7 20-3l-4-16"
            fill="#9A7958"
          />
          <path
            d="M58 179q9-5 21 1M103 180q9-5 20-1"
            stroke="#71583F"
            strokeWidth="4"
          />
        </g>
        <path
          className="pig-body"
          d="M48 137c0-24 84-24 84 0v19c0 27-84 27-84 0z"
          fill="#FFBFCB"
          stroke="#C57590"
          strokeWidth="2.5"
        />
        {!small && (
          <g>
            <path
              d="M49 145c24 11 59 11 82 0v17c-23 15-61 15-81 0z"
              fill="#6D9675"
            />
            <path d="m58 142 54 26" stroke="#D5BD87" strokeWidth="7" />
            <circle
              cx="92"
              cy="159"
              r="9"
              fill="#FFF1C9"
              stroke="#B69559"
              strokeWidth="2"
            />
            <path d="m95 152-1 9-6 5 1-9z" fill="#CB8268" />
            <path
              d="m58 146 22 6 10-4 12 6 23-8-15 17-19-9-17 9z"
              fill="#E49B69"
              stroke="#BA7B55"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </g>
        )}
        <g className="pig-arm-left">
          <path
            d={
              cheering
                ? "M52 138Q26 126 23 109c0-8 10-12 14-5l24 28"
                : thinking
                  ? "M53 139q-18-6-12-18l22-5 5 15"
                  : worried
                    ? "M52 139q-15 8-15 16c2 7 11 3 20-5"
                    : "M52 138q-20 5-20 17c1 9 13 7 26-5"
            }
            fill="#FFB5C5"
            stroke="#C57590"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>
        <g className="pig-arm-right">
          <path
            d={
              cheering
                ? "M128 138q27-12 30-29c0-8-10-12-14-5l-24 28"
                : pointing
                  ? "M128 138q20-21 32-17c9 3 2 13-8 14l-24 15"
                  : surprised
                    ? "M129 139q18-6 17-20c-1-8-12-9-14-2l-13 17"
                    : "M128 138q20 5 20 17c-1 9-13 7-26-5"
            }
            fill="#FFB5C5"
            stroke="#C57590"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {pointing && (
            <g className="pig-wand">
              <path
                d="m158 127 7-43q1-9 7-8"
                stroke="#9A7958"
                strokeWidth="5"
                strokeLinecap="round"
              />
            </g>
          )}
        </g>
        <g className="pig-head">
          <g className="pig-ear-left">
            <path
              d="m39 61-7-43c-1-7 6-10 12-7l31 24"
              fill="#F897B0"
              stroke="#B96686"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path d="m42 45-2-22 19 17" fill="#D77599" />
          </g>
          <g className="pig-ear-right">
            <path
              d="m107 35 31-24c6-3 13 0 12 7l-8 43"
              fill="#F897B0"
              stroke="#B96686"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path d="m121 40 20-17-3 23" fill="#D77599" />
          </g>
          <path
            d="M24 87c0-33 25-59 66-59s66 26 66 59c0 40-27 63-66 63s-66-23-66-63z"
            fill="#FFC8D4"
            stroke="#C57590"
            strokeWidth="3"
          />
          <path
            d="M78 30c-5-14 18-16 15-4-2 7-11 7-10 1"
            stroke="#C57590"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <g
            className="pig-explorer-hat"
            stroke="#9D8453"
            strokeWidth="2.5"
            strokeLinejoin="round"
          >
            <path d="m49 37 7-24q34-14 68 0l9 25z" fill="#D8BE80" />
            <path d="m53 27 75 1 3 10-80-1z" fill="#83966B" stroke="none" />
            <path d="M29 39q61-15 122 0l-3 10q-58 12-116-1z" fill="#E5CD95" />
            <path
              d="M62 15q22-8 40-4"
              stroke="#F5E3B5"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <rect
              x="101"
              y="26"
              width="10"
              height="9"
              rx="2"
              fill="#F8E3AE"
              strokeWidth="2"
            />
          </g>
          <path
            d="M37 65q-6 9-6 20"
            stroke="#FFE9EC"
            strokeWidth="4"
            strokeLinecap="round"
            opacity=".8"
          />
          <g
            className="pig-eyebrows"
            stroke="#8C506D"
            strokeWidth="3.5"
            strokeLinecap="round"
          >
            <path
              d={
                thinking
                  ? "M49 56q12-8 23-3"
                  : worried
                    ? "M48 62q13 1 23-6"
                    : surprised
                      ? "M49 52q12-7 23-2"
                      : "M50 59q10-4 21-1"
              }
            />
            <path
              d={
                thinking
                  ? "M109 60q12 1 22 7"
                  : worried
                    ? "M109 56q11 7 23 6"
                    : surprised
                      ? "M109 50q12-5 23 2"
                      : "M109 58q10-3 21 1"
              }
            />
          </g>
          <g className={`pig-eyes ${cheering ? "eyes-closed" : ""}`}>
            {cheering ? (
              <g stroke="#79475E" strokeWidth="4.5" strokeLinecap="round">
                <path d="M48 82q12-16 24 0M108 82q12-16 24 0" />
              </g>
            ) : (
              <>
                {proud ? (
                  <path
                    d="M48 83q12-12 24 0"
                    stroke="#79475E"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                  />
                ) : (
                  <g>
                    <ellipse
                      cx="61"
                      cy="81"
                      rx={surprised ? 14 : 12}
                      ry={surprised ? 19 : 16}
                      fill="#FFF9F3"
                    />
                    <ellipse
                      cx={61 + pupilX}
                      cy={82 + pupilY}
                      rx="6"
                      ry={surprised ? 8 : 9}
                      fill="#704359"
                    />
                    <circle
                      cx={63 + pupilX}
                      cy={78 + pupilY}
                      r="2.5"
                      fill="white"
                    />
                  </g>
                )}
                <g>
                  <ellipse
                    cx="119"
                    cy="81"
                    rx={surprised ? 14 : 12}
                    ry={surprised ? 19 : 16}
                    fill="#FFF9F3"
                  />
                  <ellipse
                    cx={119 + pupilX}
                    cy={82 + pupilY}
                    rx="6"
                    ry={surprised ? 8 : 9}
                    fill="#704359"
                  />
                  <circle
                    cx={121 + pupilX}
                    cy={78 + pupilY}
                    r="2.5"
                    fill="white"
                  />
                </g>
              </>
            )}
          </g>
          <ellipse
            cx="41"
            cy="103"
            rx="11"
            ry="6"
            fill="#F28FA9"
            opacity=".8"
          />
          <ellipse
            cx="139"
            cy="103"
            rx="11"
            ry="6"
            fill="#F28FA9"
            opacity=".8"
          />
          <g className="pig-mouth">
            {cheering || proud ? (
              <>
                <path d="M76 128q14 5 28 0c-2 20-26 20-28 0z" fill="#8A4B64" />
                <path d="M82 138q8-5 16 0-8 7-16 0" fill="#F091AD" />
                <path
                  d="M80 130q10 3 20 0"
                  stroke="#FFF8ED"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </>
            ) : surprised ? (
              <ellipse cx="90" cy="132" rx="7" ry="9" fill="#9B5772" />
            ) : thinking ? (
              <path
                d="M78 133q8-5 16-1"
                stroke="#9B5772"
                strokeWidth="3"
                strokeLinecap="round"
              />
            ) : worried ? (
              <path
                d="M80 135q10-8 20 0"
                stroke="#9B5772"
                strokeWidth="3"
                strokeLinecap="round"
              />
            ) : mood === "explaining" ? (
              <>
                <ellipse cx="90" cy="132" rx="9" ry="7" fill="#8A4B64" />
                <path
                  d="M84 135q6-4 12 0"
                  stroke="#EF8CA7"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </>
            ) : (
              <path
                d="M80 129q10 10 20 0"
                stroke="#9B5772"
                strokeWidth="3"
                strokeLinecap="round"
              />
            )}
          </g>
          <ellipse
            cx="90"
            cy="109"
            rx="28"
            ry="18"
            fill="#F29FB6"
            stroke="#C57590"
            strokeWidth="2.5"
          />
          <ellipse cx="80" cy="108" rx="4" ry="5.5" fill="#B66B8B" />
          <ellipse cx="100" cy="108" rx="4" ry="5.5" fill="#B66B8B" />
          <path
            d="M72 101q13-7 28-3"
            stroke="#FFC5D3"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {worried && (
            <path
              className="pig-sweat"
              d="m148 63-5 12q5 9 10 0z"
              fill="#9ED1DE"
              stroke="#F2FCFF"
              strokeWidth="1.5"
            />
          )}
        </g>
        {thinking && (
          <g className="pig-thought" fill="#B29AD8">
            <circle cx="151" cy="38" r="3" />
            <circle cx="160" cy="29" r="4" />
            <circle cx="169" cy="16" r="5" />
          </g>
        )}
      </g>
      {cheering && (
        <g className="pig-confetti">
          <path
            d="m15 43 3-9 3 9 9 3-9 3-3 9-3-9-9-3zM155 49l3-8 3 8 8 3-8 3-3 8-3-8-8-3z"
            fill="#F4BD58"
          />
          <path
            d="m18 104-5 5M156 106l8 5M47 8l-5-6"
            stroke="#9B81D1"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="166" cy="81" r="3" fill="#B7CD76" />
          <circle cx="14" cy="77" r="3" fill="#EEA6A7" />
        </g>
      )}
    </svg>
  );
}
