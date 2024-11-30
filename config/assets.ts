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

// 预加载关键图片
export const PRELOAD_IMAGES = [
  ASSET_PATHS.images.logo,
];

// 定义图片尺寸配置
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
