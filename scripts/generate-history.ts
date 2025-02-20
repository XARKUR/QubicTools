#!/usr/bin/env node

import { program } from 'commander';
import { EpochMonitor } from '../services/epoch-monitor';
import { QubicAPI } from '../api/qubic';
import { config } from 'dotenv';
import path from 'path';
import { MongoDB } from '../services/mongodb';

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
  .option('-e, --epoch <number>', '指定纪元号从 MongoDB 获取数据并上传到 GitHub')
  .action(async (options) => {
    try {
      const mongodb = MongoDB.getInstance();
      
      if (options.epoch) {
        // 从 MongoDB 获取指定纪元数据并上传到 GitHub
        const epochNumber = parseInt(options.epoch);
        console.log(`\n从 MongoDB 获取第 ${epochNumber} 纪元数据...`);
        
        const data = await mongodb.getEpochData(epochNumber);
        if (!data) {
          throw new Error(`MongoDB 中未找到第 ${epochNumber} 纪元数据`);
        }
        
        console.log('数据获取成功，准备上传到 GitHub...');
        
        // 上传到 GitHub
        await monitor.uploadToGithub({
          owner: 'XARKUR',
          repo: 'calculator-history',
          path: `${new Date().getFullYear()}/${epochNumber}.json`,
          content: JSON.stringify(data, null, 2),
          message: `Add epoch ${epochNumber} data`,
          force: true
        });
        
        console.log('成功上传数据到 GitHub');
      } else if (options.force) {
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

        // 保存到 MongoDB
        console.log('\n保存数据到 MongoDB...');
        await mongodb.saveEpochData(formattedData);

        // 上传到 GitHub
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
    } finally {
      // 关闭 MongoDB 连接
      await MongoDB.close();
    }
  });

program.parse();
