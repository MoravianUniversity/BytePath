import { useEffect, useMemo, useRef } from 'react';
import noUiSlider, { PipsMode, type API, type Range } from 'nouislider';
import 'nouislider/dist/nouislider.css';
import { formatDateTime } from '../util';
import { type AssignmentDueDatePip, type ResultsTimeRange } from '../utils/resultsGrid';
import './ResultsTimeRangeSlider.css';

type Props = {
  bounds: ResultsTimeRange;
  value: ResultsTimeRange;
  dueDatePips: AssignmentDueDatePip[];
  onChange: (range: ResultsTimeRange) => void;
};

export default function ResultsTimeRangeSlider({
  bounds,
  value,
  dueDatePips,
  onChange,
}: Props) {
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<API | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const pipLabelsRef = useRef<Map<number, string>>(new Map());
  const pipTitlesRef = useRef<Map<number, string>>(new Map());

  const pipValues = useMemo(
    () => [...dueDatePips.map((pip) => pip.ms)],
    [dueDatePips],
  );

  useEffect(() => {
    pipLabelsRef.current = new Map(dueDatePips.map((pip) => [pip.ms, pip.markerLabel]));
    pipTitlesRef.current = new Map(dueDatePips.map((pip) => [pip.ms, pip.title]));
  }, [dueDatePips]);

  const rangeValid = bounds != null
    && Number.isFinite(bounds.startMs)
    && Number.isFinite(bounds.endMs)
    && bounds.endMs > bounds.startMs;

  useEffect(() => {
    const element = sliderRef.current;
    if (!element || !rangeValid || !bounds) return;
    const range: Range = {
      min: bounds.startMs,
      max: bounds.endMs,
    };
    if (pipValues.length > 0) {
      const min = Math.min(...pipValues);
      const max = Math.max(...pipValues);
      const mult = 100 * 10 / (max - min);
      for (const value of pipValues) {
        if (value <= min || value >= max) continue;
        range[`${Math.round((value - min) * mult) / 10}%`] = value;
      }
    }

    const api = noUiSlider.create(element, {
      start: [value.startMs, value.endMs],
      connect: true,
      snap: true,
      range,
      behaviour: 'drag',
      tooltips: [
        { to: (raw) => formatDateTime(new Date(Number(raw)).toISOString()) ?? '' },
        { to: (raw) => formatDateTime(new Date(Number(raw)).toISOString()) ?? '' },
      ],
      ...(pipValues.length > 0
        ? {
            pips: {
              mode: PipsMode.Values,
              values: pipValues,
              stepped: false,
              density: 100,
              format: { to: (raw) => pipLabelsRef.current.get(Math.round(Number(raw))) ?? '' },
            },
          }
        : {}),
    });

    apiRef.current = api;

    const setupPip = (el: HTMLElement, pip: AssignmentDueDatePip | undefined) => {
      if (!pip) return;
      el.title = pip.title;
      el.addEventListener('click', () => {
        if (pip.isToday) {
          const [startRaw] = api.get(true) as [string | number, string | number];
          const startMs = Math.round(Number(startRaw));
          api.set([Math.min(startMs, pip.ms), pip.ms]);
        } else {
          api.set([pip.ms, pip.ms]);
        }
      });
    };

    const applyPipTitles = () => {
      const valueEls = element.querySelectorAll('.noUi-value');
      valueEls.forEach((el, index) => { setupPip(el as HTMLElement, dueDatePips[index]); });
      const markerEls = element.querySelectorAll('.noUi-marker');
      markerEls.forEach((el, index) => { setupPip(el as HTMLElement, dueDatePips[index]); });
    };
    if (pipValues.length > 0) {
      requestAnimationFrame(applyPipTitles);
    }

    api.on('update', () => {
      const [startRaw, endRaw] = api.get(true) as [string | number, string | number];
      onChangeRef.current({
        startMs: Math.round(Number(startRaw)),
        endMs: Math.round(Number(endRaw)),
      });
    });

    return () => {
      api.destroy();
      apiRef.current = null;
    };
  }, [bounds?.startMs, bounds?.endMs, rangeValid, pipValues, dueDatePips]);

  useEffect(() => {
    const api = apiRef.current;
    if (!api || !rangeValid) return;
    const [currentStart, currentEnd] = api.get(true) as [string | number, string | number];
    if (
      Math.round(Number(currentStart)) === value.startMs
      && Math.round(Number(currentEnd)) === value.endMs
    ) {
      return;
    }
    api.set([value.startMs, value.endMs]);
  }, [value.startMs, value.endMs, rangeValid]);

  if (!rangeValid || !bounds) {
    return null;
  }

  return (
    <div className="results-time-range">
      <div className="results-time-range__slider" ref={sliderRef} />
    </div>
  );
}
