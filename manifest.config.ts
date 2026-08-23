import { defineManifest } from '@crxjs/vite-plugin'

const EXTENSION_PUBLIC_KEY =
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu9jd8WxfJZOwGXlPD+RCMrrXvEvsk/Ue75radts5dszL3WWPXVzY7IXolsVZhyPstY2SbAiqHGgBjvcvT1qX5XXSusJ/CRR+2n/23xLksq8xV7ilbt22U1L95Iq5gQ/3wwyYQx2HzjJiOgiwOQ0Xj51OgOj8TIwSn+yknzCmK9tGxfslSI/bhjQRvOKLsgKMOrALeGXG8Qbyf2et/nHlaiAzYF+vOFGbBj74sZmrSpEuQ4+3AIayYiQTXsnfTZHifGhy4l9noJB6bJlByH7S5H+Is8Junmt5wi4hrWW45PAmppfaSwUOkryGo2/Rzs3qSAsieAXAqUQY0LowQa+1cQIDAQAB'

export function createManifest(googleClientId: string, includeKey = true) {
  return defineManifest({
    name: '__MSG_extName__',
    version: '0.1.0',
    manifest_version: 3,
    ...(includeKey ? { key: EXTENSION_PUBLIC_KEY } : {}),
    default_locale: 'en',
    description: '__MSG_extDescription__',
    icons: {
      16: 'icons/32-icon.png',
      48: 'icons/64-icon.png',
      128: 'icons/128-icon.png',
    },
    background: {
      service_worker: 'src/background/index.ts',
    },
    content_scripts: [
      {
        matches: ['https://www.youtube.com/*'],
        run_at: 'document_idle',
        all_frames: false,
        js: ['src/content/index.ts'],
      },
      {
        matches: ['https://www.youtube.com/*'],
        run_at: 'document_idle',
        all_frames: false,
        js: ['src/content/page-script.ts'],
        world: 'MAIN',
      } as const,
    ],
    permissions: ['storage', 'identity'],
    oauth2: {
      client_id: googleClientId,
      scopes: ['https://www.googleapis.com/auth/youtube.readonly'],
    },
    host_permissions: ['https://www.youtube.com/*', 'https://www.googleapis.com/*'],
    action: {},
  })
}
