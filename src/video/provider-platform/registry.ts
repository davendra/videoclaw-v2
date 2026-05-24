import type { VideoProviderDescriptor } from './types.js';

export const DEFAULT_PROVIDER_REGISTRY: VideoProviderDescriptor[] = [
  {
    id: 'veo-useapi',
    provider: 'veo',
    displayName: 'Google Veo via UseAPI',
    path: 'useapi',
    summary: 'UseAPI-backed Veo path for broader automation coverage.',
    supportedOperations: ['text-to-video', 'image-to-video', 'frames-to-video', 'ingredients-to-video'],
    notes: ['Requires UseAPI token and account email.'],
  },
  {
    id: 'seedance-direct',
    provider: 'seedance',
    displayName: 'Seedance Direct',
    path: 'direct',
    summary: 'Seedance direct path optimized for stylized and character-led content.',
    supportedOperations: ['text-to-video', 'image-to-video', 'frames-to-video', 'add-audio'],
    notes: ['Requires SUTUI_API_KEY.'],
  },
  {
    id: 'runway-useapi',
    provider: 'runway',
    displayName: 'Runway via UseAPI',
    path: 'useapi',
    summary: 'Scaffold adapter for edit-heavy and spokesperson workflows.',
    supportedOperations: ['text-to-video', 'image-to-video', 'edit', 'add-audio'],
    notes: ['Scaffold only in the initial clean-room core.'],
  },
  {
    id: 'kling-useapi',
    provider: 'kling',
    displayName: 'Kling via UseAPI',
    path: 'useapi',
    summary: 'Scaffold adapter for motion-forward workflows.',
    supportedOperations: ['text-to-video', 'image-to-video', 'extend'],
    notes: ['Scaffold only in the initial clean-room core.'],
  },
];
