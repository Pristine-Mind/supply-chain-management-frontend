import React, { useMemo } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';

export type SizeVariant = 'sm' | 'md' | 'lg';

interface PopularityScoreProps {

  score: number;
  showLabel?: boolean;
  size?: SizeVariant;
}

const sizeVariants: Record<SizeVariant, { container: string; bar: string; text: string }> = {
  sm: { container: 'h-4', bar: 'h-1.5', text: 'text-xs' },
  md: { container: 'h-5', bar: 'h-2', text: 'text-sm' },
  lg: { container: 'h-2', bar: 'h-2', text: 'text-base' },
};

export const PopularityScore: React.FC<PopularityScoreProps> = ({
  score,
  showLabel = true,
  size = 'lg',
}) => {
  const normalizedScore = useMemo(() => Math.min(Math.max(score || 0, 0), 100), [score]);
  const roundedScore = useMemo(() => Math.round(normalizedScore), [normalizedScore]);

  const { container, bar, text } = sizeVariants[size];
  const gradientColor = useMemo(() => {
    const hue = Math.round(normalizedScore * 1.2);
    return `hsl(${hue}, 100%, 45%)`;
  }, [normalizedScore]);

  return (
    <div className="flex items-center gap-2 w-full">
      <Tooltip.Provider delayDuration={200} skipDelayDuration={100}>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={roundedScore}
              aria-label={`Popularity: ${roundedScore}%`}
              className={`flex-1 ${container} bg-neutral-200 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500`}
            >
              <div
                className={`${bar} rounded-full transition-all duration-300`}
                style={{ width: `${normalizedScore}%`, backgroundColor: gradientColor }}
              />
            </div>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              sideOffset={4}
              className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg"
            >
              Popularity Score: {roundedScore}/100
              <Tooltip.Arrow className="fill-gray-900" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>

      {showLabel && (
        <span className={`${text} font-medium min-w-[2rem] text-right`}>
          {roundedScore} / 100
        </span>
      )}
    </div>
  );
};

export default PopularityScore;
