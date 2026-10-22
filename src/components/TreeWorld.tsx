export default function TreeWorld() {
  return <div className="tree-scenery" aria-hidden="true"><picture>
    <source media="(max-aspect-ratio: 3/4)" srcSet="/assets/hybrid-casual-ui/tree/backgrounds/forest-portrait.png" />
    <img src="/assets/hybrid-casual-ui/tree/backgrounds/forest-landscape.png" alt="" draggable={false} />
  </picture></div>;
}
