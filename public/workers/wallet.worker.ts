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
    
    self.postMessage({
      publicId: idPackage.publicId,
      seed: seed
    });
    
    idPackage.publicId = '';
    idPackage.privateKey = '';
    
  } catch (error) {
    console.error('Error generating wallet:', error);
    self.postMessage({ error: 'Failed to generate wallet' });
  }
};

self.addEventListener('unload', () => {
  cleanup();
});
