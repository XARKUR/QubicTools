# QubicTools

A comprehensive toolset for Qubic blockchain, providing various utilities for mining, address generation, and network monitoring.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Features

### Mining Tools
- **Mining Calculator**: Calculate potential mining profits with support for multiple pools:
  - QLI Pool (Solo & PPLNS modes)
  - APool (PPLNS mode)
  - Solutions Pool (Solo & PPLNS modes)
  - MinerLab (Solo mode)
  - Nevermine (PPLNS mode)
- **Mining History**: Track and analyze historical mining data across epochs
  - Weekly profit trends visualization
  - Historical performance analysis
  - Export data to CSV format
- **Pool Statistics**: Real-time monitoring of pool performance, hashrates, and rewards
- **Asset Price Statistics**: Statistics on the latest average transaction price of assets
- **Performance Analysis**: Track mining efficiency and expected rewards
- **Epoch Progress**: View the progress of the current epoch
- **Customize mining start time**: Set the mining start time to get more accurate performance efficiency data

### Address Generation
- **Vanity Address Generator**: Create custom Qubic addresses with specific patterns
- **Batch Address Generator**: Generate multiple Qubic wallets simultaneously
- **Batch Balance Query**: Check balances of multiple addresses in one go

### Network Monitoring
- **Network Statistics**: Track network hashrate, epoch progress, and other metrics
- **Automatic data update**: Automatically obtain pool token and update periodic cycle data according to epochs
- **Price Information**: Real-time QUBIC price in USD/CNY
- **Multi-language Support**: Available in English and Chinese

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI**: TailwindCSS + Radix UI + Shadcn UI + Recharts
- **State Management**: React Context
- **API Integration**: Custom API service with caching
- **Internationalization**: i18next
- **Command Palette**: cmdk for quick feature access
- **Build Tools**: tsup and tsx for scripts
- **Workers**: Web Workers for intensive tasks


## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- Yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/xarkur/qubictools.git
cd QubicTools
```

2. Install dependencies:
```bash
yarn install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Start the development server:
```bash
yarn dev
```

The application will be available at `http://localhost:3000`.

### Production Build

To create a production build:

```bash
yarn build
yarn start
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Qubic Core Team for the blockchain implementation
- Community members for testing and feedback
- All contributors who have helped with the project

## Contact

- Twitter: [@iXARKUR](https://x.com/iXARKUR)
- GitHub Issues: [Project Issues](https://github.com/xarkur/qubictools/issues)
