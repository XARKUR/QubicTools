import { Octokit } from '@octokit/rest';
import { QubicAPI } from '../api/qubic';
import { MiningCalculator } from './mining-calculator';
import { PoolOption, MiningMode, POOL_CONFIGS } from './mining-calculator';

interface EpochData {
  epoch: number;
  startTime: string;
  endTime: string;
  price: string;
  totalSolutions: number;
  averageScore: number;
  pools: {
    name: string;
    miningModes: {
      type: string;
      weekProfit: string;  // 添加周收益字段
      coinsPerSolution: {
        estimate: number;
        actual: number | null;
      }[];
      sharesPerSolution?: number;
    }[];
  }[];
}

export class EpochMonitor {
  private octokit: Octokit;
  private isProcessing: boolean = false;
  
  constructor(githubToken: string) {
    this.octokit = new Octokit({
      auth: githubToken
    });
  }

  async checkAndUpload(): Promise<{ currentEpoch: number; status: string }> {
    if (this.isProcessing) {
      console.log('正在处理中，跳过本次检查');
      return { currentEpoch: 0, status: '正在处理中' };
    }
    
    try {
      this.isProcessing = true;
      
      // 1. 获取当前纪元信息
      QubicAPI.clearCache(); // 清除缓存，确保获取最新数据
      const toolData = await QubicAPI.getToolData();
      const currentEpoch = toolData.data.currentEpoch;
      const epochProgress = await QubicAPI.getEpochProgress();
      console.log(`\n[纪元 ${currentEpoch}] 检查时间: ${new Date().toISOString()}`);
      console.log(`当前进度: ${epochProgress.toFixed(2)}%`);
      
      if (epochProgress < 99.90) {
        console.log('进度未达到99.90%, 等待下次检查');
        return { currentEpoch, status: '等待进度达到99.90%' };
      }

      // 2. 获取当前纪元数据
      console.log(`\n正在收集第 ${currentEpoch} 纪元数据...`);
      const epochData = await this.collectEpochData(currentEpoch);
      
      console.log('\n数据收集完成:');
      console.log(`- 开始时间: ${epochData.startTime}`);
      console.log(`- 结束时间: ${epochData.endTime}`);
      console.log(`- 价格: ${epochData.price}`);
      console.log(`- 总解决方案数: ${epochData.totalSolutions}`);
      console.log(`- 平均分数: ${epochData.averageScore.toFixed(2)}`);
      console.log('\n矿池数据:');
      epochData.pools.forEach(pool => {
        console.log(`\n${pool.name}:`);
        pool.miningModes.forEach(mode => {
          console.log(`  ${mode.type}:`);
          mode.coinsPerSolution.forEach(coins => {
            console.log(`    - 预估收益: ${Math.floor(coins.estimate)} Qus`);
          });
          if (mode.sharesPerSolution) {
            console.log(`    - 每解决方案所需份额: ${mode.sharesPerSolution}`);
          }
        });
      });
      
      // 3. 生成文件路径
      const year = new Date().getFullYear();
      const filePath = `${year}/${currentEpoch}.json`;
      console.log(`\n准备上传到 GitHub: ${filePath}`);
      
      // 4. 格式化数据
      const formattedData = {
        ...epochData,
        averageScore: Number(epochData.averageScore.toFixed(2)),
        pools: epochData.pools.map(pool => ({
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
      
      // 5. 上传到 GitHub
      await this.uploadToGithub({
        owner: 'XARKUR',
        repo: 'calculator-history',
        path: filePath,
        content: JSON.stringify(formattedData, null, 2),
        message: `Add epoch ${currentEpoch} data`,
        force: false
      });
      console.log(`\n纪元 ${currentEpoch} 的数据已成功上传到 GitHub`);
      return { currentEpoch, status: `纪元 ${currentEpoch} 的数据已成功上传` };
    } catch (error) {
      console.error('\n处理纪元数据时出错:', error);
      return { currentEpoch: 0, status: `出错: ${error instanceof Error ? error.message : String(error)}` };
    } finally {
      this.isProcessing = false;
    }
  }

  async collectEpochData(epoch: number): Promise<EpochData> {
    // 1. 获取基础数据
    const networkData = await QubicAPI.getNetworkData();
    const solutionsPerHour = networkData.solutionsPerHourCalculated;
    const epochTimes = await this.calculateEpochTimes(epoch);
    
    // 2. 计算平均分数
    const averageScore = (solutionsPerHour * 168) / 676;

    // 3. 获取所有矿池数据并计算收益
    const pools = await Promise.all(
      Object.entries(POOL_CONFIGS)
        .filter(([key]) => key !== 'placeholder')
        .map(async ([key, config]) => {
          const miningModes = await this.calculatePoolModes(
            key as PoolOption,
            config,
            networkData
          );
          return {
            name: config.name,
            miningModes
          };
        })
    );

    return {
      epoch,
      startTime: epochTimes.startTime,
      endTime: epochTimes.endTime,
      price: await QubicAPI.getPrice(),
      totalSolutions: await QubicAPI.getTotalSolutions(),
      averageScore,
      pools
    };
  }

  private async calculatePoolModes(
    poolOption: PoolOption,
    config: any,
    networkData: any
  ) {
    // 检查原始的 networkData
    console.log('Raw Network Data:', networkData);

    const modes = [];
    const hashRate = 100000; // 基准算力：10万

    // 计算每种挖矿模式的数据
    for (const [mode, modeConfig] of Object.entries(config.modes)) {
      // 计算每周收益
      let weekProfit = '0';
      try {
        // 检查网络数据
        console.log(`[${poolOption}][${mode}] Network Data:`, {
          solutionsPerHourCalculated: networkData.solutionsPerHourCalculated,
          averageQliHashrate: networkData.pool_hashrate?.average?.average_minerlab_hashrate,
          averageApoolHashrate: networkData.pool_hashrate?.average?.average_apool_hashrate,
          averageMinerlabHashrate: networkData.pool_hashrate?.average?.average_minerlab_hashrate,
          averageNevermineHashrate: networkData.pool_hashrate?.average?.average_nevermine_hashrate,
          averageSolutionsHashrate: networkData.pool_hashrate?.average?.average_solutions_hashrate
        });

        const profitResult = MiningCalculator.calculateProfit({
          pool: poolOption,
          miningMode: mode as MiningMode,
          blocks: 7 * 24, // 一周的块数
          networkData: {
            solutionsPerHourCalculated: networkData.solutionsPerHourCalculated || 0,
            price: parseFloat(await QubicAPI.getPrice()),
            averageQliHashrate: networkData.pool_hashrate?.average?.average_qli_hashrate || 0,
            averageApoolHashrate: networkData.pool_hashrate?.average?.average_apool_hashrate || 0,
            averageMinerlabHashrate: networkData.pool_hashrate?.average?.average_minerlab_hashrate || 0,
            averageNevermineHashrate: networkData.pool_hashrate?.average?.average_nevermine_hashrate || 0,
            averageSolutionsHashrate: networkData.pool_hashrate?.average?.average_solutions_hashrate || 0,
            apoolStats: networkData.apoolStats || {},
            minerlabStats: networkData.minerlabStats || {},
            nevermineStats: networkData.nevermineStats || {},
            solutionsStats: networkData.solutionsStats || {}
          },
          hashRate: hashRate,
          currency: 'usd'
        });
        weekProfit = (profitResult.expectedDailyFiatValue * 7).toFixed(2);
      } catch (error) {
        console.error(`计算${poolOption} ${mode}收益时出错:`, error);
      }

      const modeData: any = {
        type: mode,
        weekProfit, // 添加周收益
        coinsPerSolution: [{
          estimate: await this.calculateEstimateCoins(
            poolOption,
            mode as MiningMode,
            networkData.solutionsPerHourCalculated || 0
          ),
          actual: null // 需要人工核实
        }]
      };

      // 如果是 PPLNS 模式，添加 sharesPerSolution
      if (mode === 'pplns') {
        const statsKey = `${poolOption}Stats`;
        if (networkData[statsKey]) {
          modeData.sharesPerSolution = networkData[statsKey].shares_per_solution;
        }
      }

      modes.push(modeData);
    }

    return modes;
  }

  private async calculateEstimateCoins(
    poolOption: PoolOption,
    mode: MiningMode,
    solutionsPerHour: number
  ): Promise<number> {
    // 直接调用对应的静态方法
    const baseCoins = (() => {
      switch (poolOption.toLowerCase()) {
        case 'qli':
          return mode.toLowerCase() === 'solo'
            ? MiningCalculator.calculateQliSoloBlockCoins(solutionsPerHour)
            : MiningCalculator.calculateQliPplnsBlockCoins(solutionsPerHour);
        case 'apool':
          return MiningCalculator.calculateApoolPplnsBlockCoins(solutionsPerHour);
        case 'minerlab':
          return MiningCalculator.calculateMinerlabBlockCoins(solutionsPerHour);
        case 'nevermine':
          return MiningCalculator.calculateNeverminePplnsBlockCoins(solutionsPerHour);
        case 'solutions':
          return MiningCalculator.calculateSolutionsBlockCoins(solutionsPerHour);
        default:
          throw new Error(`Unsupported pool option ${poolOption}`);
      }
    })();

    // 如果是 Solutions 的 PPLNS 模式，需要额外计算
    if (poolOption.toLowerCase() === 'solutions' && mode.toLowerCase() === 'pplns') {
      const networkData = await QubicAPI.getNetworkData();
      return baseCoins * networkData.solutionsStats.pplns_solutions;
    }

    return baseCoins;
  }

  private capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private async calculateEpochTimes(epoch: number) {
    // 以145纪元为基准点
    const epoch145Start = new Date('2025-01-22T00:00:00Z');
    const EPOCH_DURATION = 7 * 24 * 60 * 60 * 1000; // 7天的毫秒数

    // 计算与145纪元的差值
    const epochDiff = epoch - 145;
    
    // 计算开始时间
    const startTime = new Date(epoch145Start.getTime() + (epochDiff * EPOCH_DURATION));
    
    // 计算结束时间
    const endTime = new Date(startTime.getTime() + EPOCH_DURATION);

    return {
      startTime: startTime.toLocaleDateString('zh-CN'),
      endTime: endTime.toLocaleDateString('zh-CN')
    };
  }

  async uploadToGithub({
    owner,
    repo,
    path,
    content,
    message,
    force = false
  }: {
    owner: string;
    repo: string;
    path: string;
    content: string;
    message: string;
    force?: boolean;
  }) {
    try {
      // 检查文件是否已存在
      let sha: string | undefined;
      try {
        const { data } = await this.octokit.repos.getContent({
          owner,
          repo,
          path
        });
        if ('sha' in data) {
          sha = data.sha;
        }
      } catch (error) {
        // 文件不存在，继续创建
      }

      // 创建或更新文件
      console.log(`正在上传文件到 ${path}${sha ? ' (更新)' : ' (新建)'}...`);
      await this.octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: Buffer.from(content).toString('base64'),
        ...(sha ? { sha } : {})
      });
    } catch (error) {
      throw new Error(`Failed to upload to GitHub: ${error}`);
    }
  }
}
