import QubicLib from '@qubic-lib/qubic-ts-library';

let helper: any = null;

const initHelper = async () => {
  if (helper) return;
  
  try {
    await QubicLib.crypto;
    helper = new QubicLib.QubicHelper();
  } catch (error) {
    console.error('Error initializing QubicHelper:', error);
    throw error;
  }
};

// 安全清理函数
function secureCleanup(obj: any) {
  if (!obj) return;
  
  // 遍历对象的所有属性
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      // 多次覆写字符串内容
      const len = obj[key].length;
      for (let i = 0; i < 3; i++) {
        obj[key] = crypto.getRandomValues(new Uint8Array(len * 2))
          .reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
      }
      obj[key] = '';
    } else if (typeof obj[key] === 'object') {
      secureCleanup(obj[key]);
    }
  }
  
  // 将对象的所有属性设置为 null
  for (const key in obj) {
    obj[key] = null;
  }
}

const cleanup = () => {
  if (helper) {
    secureCleanup(helper);
    helper = null;
  }
};

self.onmessage = async (e: MessageEvent) => {
  const { seed } = e.data;
  
  if (!seed) {
    self.postMessage({ error: 'No seed provided' });
    return;
  }
  
  let idPackage: any = null;
  try {
    await initHelper();
    idPackage = await helper.createIdPackage(seed);
    
    // 立即发送结果并清理
    const result = {
      publicId: idPackage.publicId,
      seed: seed
    };
    
    self.postMessage(result);
    
    // 安全清理所有敏感数据
    secureCleanup(idPackage);
    secureCleanup(result);
    
  } catch (error) {
    console.error('Error generating wallet:', error);
    self.postMessage({ error: 'Failed to generate wallet' });
  } finally {
    if (idPackage) {
      secureCleanup(idPackage);
    }
  }
};

self.addEventListener('unload', () => {
  cleanup();
});
