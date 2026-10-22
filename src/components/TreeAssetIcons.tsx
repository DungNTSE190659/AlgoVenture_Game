function icon(name: string) {
  return function TreeIcon({ size = 24, className = "" }: { size?: number; className?: string }) {
    return <img className={`tree-ui-icon ${className}`} src={`/assets/hybrid-casual-ui/tree/svg/icon-${name}.svg`} alt="" aria-hidden="true" width={size} height={size} draggable={false} />;
  };
}
export const ArrowLeft=icon('arrow-left'), ArrowRight=icon('arrow-right'), Check=icon('check'), Flag=icon('flag'), GitBranch=icon('git-branch'), Grip=icon('grip'), Leaf=icon('leaf'), Lightbulb=icon('lightbulb'), Pause=icon('pause'), Play=icon('play'), RotateCcw=icon('rotate-ccw'), SkipBack=icon('skip-back'), SkipForward=icon('skip-forward'), Sprout=icon('sprout'), Undo2=icon('undo-2'), Volume2=icon('volume-2'), VolumeX=icon('volume-x'), X=icon('x'), Vibrate=icon('vibrate'), Settings=icon('settings'), Star=icon('star'), Map=icon('map'), ChevronRight=icon('chevron-right'), Sparkles=icon('sparkles');
