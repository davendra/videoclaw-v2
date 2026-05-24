export type ProviderPath = 'direct' | 'useapi';

export type VideoProvider = 'veo' | 'seedance' | 'runway' | 'kling';

export type ProviderRouteId =
  | 'veo-useapi'
  | 'seedance-direct'
  | 'runway-useapi'
  | 'kling-useapi';

export type VideoOperationKind =
  | 'text-to-video'
  | 'image-to-video'
  | 'frames-to-video'
  | 'ingredients-to-video'
  | 'extend'
  | 'edit'
  | 'add-audio';

export interface VideoProviderDescriptor {
  id: ProviderRouteId;
  provider: VideoProvider;
  displayName: string;
  path: ProviderPath;
  summary: string;
  supportedOperations: VideoOperationKind[];
  notes?: string[];
}
