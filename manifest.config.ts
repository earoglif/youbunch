import { defineManifest } from '@crxjs/vite-plugin'

const EXTENSION_PUBLIC_KEY =
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAm/QzNFJgnzanj+bT7/Yhk02sD6WRwd9ileQb09hiQe/90P1+iKMPJQWoFHCJwYJvKRDgeINETc76zNblz9s9vvzIgd6nuCDmorQyjqVZ9hPxKmKOErHIz5pwv2R+ky66vyuf+ym4jhBTbGzUJKQptD6aSxOzHGvOnXlXlJFK67xv1ZPyCcrICS9urPU050RrRvXp93/2UuBy//ikfvXUsNhf+Ui1vhUi0PeI/nKu91oCKfJ5eFE5D24VMZJL1+jp1YzscartZdkBt+5KUgArf+ZJLIy0uFX1eEmM7oCavrHLm7RR5oV5+l77REmQ0uCIfAzcyeg9Mu6b7rSsWY4jMQIDAQAB'

export function createManifest(googleClientId: string, includeKey = true) {
  return defineManifest({
    name: '__MSG_extName__',
    version: '1.0.0',
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
