export const ASSET_PATHS = {
  images: {
    logo: '/img/logo.png',
    placeholder: '/img/placeholder.png',
  },
  fonts: {
    geistSans: './fonts/GeistVF.woff',
    geistMono: './fonts/GeistMonoVF.woff',
  },
} as const;

export const PRELOAD_IMAGES = [
  ASSET_PATHS.images.logo,
];

export const IMAGE_SIZES = {
  logo: {
    width: 128,
    height: 32,
  },
  placeholder: {
    width: 100,
    height: 100,
  },
} as const;
