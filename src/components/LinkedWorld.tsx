/** Shared winter landscape for Linked List lessons and their route map. */
export default function LinkedWorld({ map = false }: { map?: boolean }) {
  return <div className={`linked-scenery ${map ? "linked-map-scenery" : ""}`} aria-hidden="true">
    <picture>
      <source media="(max-aspect-ratio: 3/4)" srcSet="/assets/hybrid-casual-ui/linked/backgrounds/winter-portrait.png" />
      <img className="linked-landscape-asset" src="/assets/hybrid-casual-ui/linked/backgrounds/winter-landscape.png" alt="" draggable={false} />
    </picture>
  </div>;
}
