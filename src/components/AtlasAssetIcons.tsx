function icon(name: string) {
  return function AtlasIcon({ size = 24, className = "" }: { size?: number; className?: string }) {
    return <img className={`atlas-ui-icon ${className}`} src={`/assets/hybrid-casual-ui/atlas/svg/${name}.svg`} width={size} height={size} alt="" aria-hidden="true" draggable={false} />;
  };
}
export const ArrowRight = icon('icon-arrow-right');
export const AudioLines = icon('icon-audio');
export const VolumeX = icon('icon-muted');
export const Check = icon('icon-check');
export const ChevronLeft = icon('icon-chevron-left');
export const ChevronRight = icon('icon-chevron-right');
export const Compass = icon('compass-disc');
export const Flag = icon('icon-flag');
export const LockKeyhole = icon('icon-lock');
