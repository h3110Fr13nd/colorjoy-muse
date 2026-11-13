import { useSyncExternalStore } from 'react';
import type { ImageSourceStore } from '@/utils/imageSourceStore';
import type { ImageSource } from '@/utils/imageFile';

export const useImageSource = (store: ImageSourceStore): [ImageSource | null, (image: ImageSource | null) => void] => [
  useSyncExternalStore(store.subscribe, store.getSnapshot),
  store.set,
];
