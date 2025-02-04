# Apply to add a new mining pool

Conditions:
1. The mining pool needs to be running stably for at least three months.
2. The mining pool hashrate must reach at least 5% of the total network hashrate.

To apply for adding a mining pool, please submit the mining pool information in Issues. The example is as follows

```
Pool name: Pool
Pool fee: 10%
Pool model: PPLNS
Pool coin per solution calculation formula: coin per sol = 1074807691 * 0.94 / AvgScores
Pool introduction: Pool is a mining pool tailored for the Qubic blockchain, supporting both CPU and GPU mining. It offers high yields for mining operations and is designed to be compatible with various hardware configurations. The platform emphasizes scalability, efficiency, and community-driven innovation, simplifying blockchain accessibility while ensuring robust performance for miners and developers alike.
Data API link: https://api.pool.com
```

The API data structure is as follows
```json
{
  "poolHashrate": 10000000000,
  "totalSolutions": 1000,
  "totalShares": 2000000
}
```

If you want to diffrent mode, you need add the mode data, example:
```json
{
  "poolHashrate": "",
  "soloSolutions": "",
  "pplnsSolutions": "",
  "totalShares": ""
}
```

