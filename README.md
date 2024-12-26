# Qubic Tools

A Qubic blockchain tools providing secure address generation, and mining analysis capabilities.

## Features

### Profit Calculator
- Real-time mining profit and cost analysis
- Multiple pool support (QLI, APool)
- Network status monitoring
- Automatic market data updates
- Key metrics:
  - Expected block rewards
  - Current epoch statistics
  - Power cost analysis
  - Network hashrate monitoring
  - Profit trend analysis

### Batch Wallet Generation
- High-performance batch wallet generation
- Offline operation support
- CSV format export
- Real-time progress tracking
- Multiple security protection mechanisms

### Vanity Address Generation
- Custom prefix/suffix address generation
- Multi-threaded parallel processing
- Smart CPU load management
- Real-time speed monitoring
- Adaptive performance optimization

### Batch Balance Query
- Batch address balance queries
- Responsive interface design
- Query result visualization

## Security Features

### Encryption and Random Number Generation
The project implements cryptographically secure random number generation:
```typescript
function generateRandomSeed(): string {
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  const array = new Uint8Array(55);
  
  // Use cryptographically secure random number generator
  crypto.getRandomValues(array);
  
  let result = '';
  for (let i = 0; i < 55; i++) {
    result += characters.charAt(array[i] % characters.length);
  }
  return result;
}
```

### Private Key Protection
1. **Secure Memory Cleanup**
```typescript
function secureCleanup(obj: any) {
  if (!obj) return;
  
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      // Multiple overwrites of string content
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
  
  for (const key in obj) {
    obj[key] = null;
  }
}
```

2. **Worker Thread Isolation**
```typescript
self.addEventListener('unload', () => {
  try {
    // Terminate running operations
    state.running = false;
    
    // Clear monitoring data
    state.monitor.reset();
    
    // Secure state cleanup
    secureCleanup(state.helper);
    state.helper = null;
    
    // Reset state data
    state.pattern = '';
    state.type = 'prefix';
    state.workerId = 0;
    state.cpuUsage = 0;
  } catch (error) {
    console.error('Cleanup error:', error);
  }
});
```

3. **Exception Handling**
```typescript
try {
  const result = await generateAndCheck();
  // Process result
} finally {
  // Ensure sensitive data cleanup
  if (seed) {
    secureCleanup({ seed });
  }
  if (idPackage) {
    secureCleanup(idPackage);
  }
}
```

## Quick Start

### Requirements
- Node.js >= 18
- npm >= 9

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build production version
npm run build

# Start production server
npm start
```

## Testing

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# E2E tests
npm run test:e2e
```

## Tech Stack

- **Framework**: Next.js 14.2
- **UI Components**: 
  - Radix UI
  - Tailwind CSS
- **State Management**: React Hooks
- **Internationalization**: i18next
- **Development Tools**:
  - TypeScript
  - ESLint
  - Jest
  - Playwright

## Security Recommendations

1. **Usage Environment**
   - Recommended for offline use
   - Use trusted devices and browsers
   - Regular browser data cleanup

2. **Private Key Management**
   - Immediate backup of generated private keys
   - Secure storage methods
   - Avoid online storage

3. **Batch Operations**
   - Recommended batch-wise operations
   - Immediate validation of generated data
   - System resource monitoring

## Contributing

Welcome to contribute! Please ensure:
1. Follow existing code style
2. Add necessary tests
3. Update relevant documentation
4. Complete full testing

## License

This project is licensed under [LICENSE].
