import QubicLib from '@qubic-lib/qubic-ts-library';

let helper: any = null;

const initHelper = async () => {
  if (helper) return;
  
  try {
    // 等待加载加密模块
    await QubicLib.crypto;
    // 创建 helper 实例
    helper = new QubicLib.QubicHelper();
  } catch (error) {
    console.error('Error initializing QubicHelper:', error);
    throw error;
  }
};

// 清理函数
const cleanup = () => {
  helper = null;
};

self.onmessage = async (e: MessageEvent) => {
  const { seed } = e.data;
  
  if (!seed) {
    self.postMessage({ error: 'No seed provided' });
    return;
  }
  
  try {
    await initHelper();
    const idPackage = await helper.createIdPackage(seed);
    
    // 返回publicId和对应的seed
    self.postMessage({
      publicId: idPackage.publicId,
      seed: seed
    });
    
    // 使用完立即清理idPackage
    idPackage.publicId = '';
    idPackage.privateKey = '';
    
  } catch (error) {
    console.error('Error generating wallet:', error);
    self.postMessage({ error: 'Failed to generate wallet' });
  }
};

// 监听worker终止事件
self.addEventListener('unload', () => {
  cleanup();
});
