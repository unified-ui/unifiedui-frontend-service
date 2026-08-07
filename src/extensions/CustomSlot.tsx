import type { FC } from 'react';
import { getCustomSlots } from './registry';
import type { CustomSlotName } from './types';

interface CustomSlotProps {
  name: CustomSlotName;
}

export const CustomSlot: FC<CustomSlotProps> = ({ name }) => (
  <>
    {getCustomSlots(name).map(({ id, component: Component }) => (
      <Component key={id} />
    ))}
  </>
);
