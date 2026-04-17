import { useCallback, useState } from "react";

type TeamNumber = 1 | 2;

export interface PickerTarget {
  team: TeamNumber;
  slotIndex: number;
}

export const usePickerController = () => {
  const [target, setTarget] = useState<PickerTarget | null>(null);

  const openFor = useCallback((team: TeamNumber, slotIndex: number) => {
    setTarget({ team, slotIndex });
  }, []);

  const close = useCallback(() => setTarget(null), []);

  return {
    open: target !== null,
    target,
    openFor,
    close,
  };
};
