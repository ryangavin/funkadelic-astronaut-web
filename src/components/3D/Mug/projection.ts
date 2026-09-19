import { useLayoutEffect, useRef, useState } from 'react';
import { measurePlane, unprojectFrom, usePerspectiveView } from '../../../behaviors/Perspective/Perspective';
import { elevatedLayer } from '../../../behaviors/Perspective/elevation';
import { BASE_LAYER } from '../Wastebasket/cylinder';

/** Recover this drawing's actual surface coordinates, including a Solid's
 * counter-rotation. Observe placement writes, so store-driven drags need no
 * owner render and deposited coffee stains remain entirely independent. */
export function useMugLayer(heightRatio: number) {
  const host = useRef<HTMLDivElement>(null);
  const view = usePerspectiveView();
  const [layer, setLayer] = useState(BASE_LAYER);
  useLayoutEffect(() => {
    const element = host.current;
    const plane = element?.closest<HTMLElement>('.perspective__plane');
    if (!element || !plane || !view) { setLayer(BASE_LAYER); return; }
    const measure = () => {
      const metrics = measurePlane(plane);
      const point = (selector: string) => {
        const rect = element.querySelector(selector)!.getBoundingClientRect();
        return unprojectFrom(metrics, view, rect.x, rect.y);
      };
      const center = point('.mug__measure--center'), edge = point('.mug__measure--edge');
      const width = Math.hypot(edge.x - center.x, edge.y - center.y) * 2;
      if (!width) return;
      const next = elevatedLayer(width * heightRatio, {
        x: center.x - width / 2, y: center.y - width / 2, width,
        drawingWidth: 240, drawingHeight: 240,
        rotation: Math.atan2(edge.y - center.y, edge.x - center.x) * 180 / Math.PI,
      }, { angle: 90 - view.tilt * 180 / Math.PI, depth: view.depth, width: view.width,
        surfaceHeight: view.width * metrics.ratio, targetY: view.targetY });
      setLayer(old => Math.abs(old.x - next.x) + Math.abs(old.y - next.y) + Math.abs(old.scale - next.scale) < 1e-8 ? old : next);
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(plane); resize.observe(element);
    const mutations = new MutationObserver(measure);
    // Only ancestors: our own SVG writes must never trigger a measurement loop.
    for (let node = element.parentElement; node && node !== plane; node = node.parentElement)
      mutations.observe(node, { attributes: true, attributeFilter: ['style', 'class'] });
    return () => { resize.disconnect(); mutations.disconnect(); };
  }, [view, heightRatio]);
  return { host, layer };
}
