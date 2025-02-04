#!/usr/bin/env node

import { program } from 'commander';
import { EpochMonitor } from '../services/epoch-monitor';
import { QubicAPI } from '../api/qubic';
import { config } from 'dotenv';
import path from 'path';

// 加载环境变量
config({ path: path.resolve(process.cwd(), '.env.local') });

const githubToken = process.env.GITHUB_TOKEN;

if (!githubToken) {
  console.error('错误: 未设置 GITHUB_TOKEN');
  process.exit(1);
}

const monitor = new EpochMonitor(githubToken);

program
  .name('generate-history')
  .description('手动触发纪元监控器检查并上传数据')
  .version('1.0.0');

program
  .command('check')
  .description('检查纪元进度并在需要时上传数据')
  .option('-f, --force', '强制检查并上传数据，忽略进度检查', false)
  .action(async (options) => {
    try {
      if (options.force) {
        // 如果是强制模式，直接收集并上传数据
        const currentEpoch = await QubicAPI.getCurrentEpoch();
        console.log(`\n强制模式: 收集第 ${currentEpoch} 纪元数据`);
        const data = await monitor.collectEpochData(currentEpoch);
        
        // 格式化数据
        const formattedData = {
          ...data,
          averageScore: Number(data.averageScore.toFixed(2)),
          pools: data.pools.map(pool => ({
            ...pool,
            miningModes: pool.miningModes.map(mode => ({
              ...mode,
              coinsPerSolution: mode.coinsPerSolution.map(coins => ({
                ...coins,
                estimate: Math.floor(coins.estimate)
              }))
            }))
          }))
        };

        await monitor.uploadToGithub({
          owner: 'XARKUR',
          repo: 'calculator-history',
          path: `${new Date().getFullYear()}/${currentEpoch}.json`,
          content: JSON.stringify(formattedData, null, 2),
          message: `Add epoch ${currentEpoch} data`,
          force: true
        });
        console.log('成功上传数据');
      } else {
        // 正常模式，使用 checkAndUpload
        await monitor.checkAndUpload();
        console.log('检查完成');
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('\n错误:', error.message);
        process.exit(1);
      }
    }
  });

program.parse();
