import { useEffect } from 'react';
import { useInspection } from '../../behaviors/Inspectable/Inspectable';

export type DeskControl = {
  held?: string;
  inspect: (id: string) => void;
  release: () => void;
};

/**
 * A hand reached into the room from outside it. The Inspector lives inside the
 * room, so nothing in the page's own header can pick a thing up; laid on the
 * desk, this hands the header the same inspect and release the desk's own
 * things use, and tells it whenever what is held changes.
 */
export function DeskBridge({ onChange }: { onChange: (control: DeskControl | null) => void }) {
  const inspection = useInspection();
  useEffect(() => {
    onChange(inspection ? { held: inspection.held, inspect: inspection.inspect, release: inspection.release } : null);
  }, [inspection, onChange]);
  return null;
}
