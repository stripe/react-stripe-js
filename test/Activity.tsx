import type {FunctionComponent, PropsWithChildren} from 'react';

// React 19.1 supports Activity in the renderer but does not export its component.
// Use its symbol only in tests to exercise effect reconnection without upgrading
// the development dependencies or relying on a production Activity API.
export const Activity = Symbol.for(
  'react.activity'
) as unknown as FunctionComponent<
  PropsWithChildren<{mode: 'visible' | 'hidden'}>
>;
