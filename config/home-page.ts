import { 
  Clock, 
  DollarSign, 
  Cpu, 
  Box, 
  Coins, 
  Wallet,
} from "lucide-react"

export const STAT_CARDS = [
  {
    title: "当前纪元",
    value: "1234",
    description: "Current Epoch",
    icon: Clock,
  },
  {
    title: "Qubic价格",
    value: "$0.0123",
    description: "Current Price",
    icon: DollarSign,
  },
  {
    title: "全网总算力",
    value: "123.45 TH/s",
    description: "Network Hashrate",
    icon: Cpu,
  },
  {
    title: "每小时出块数",
    value: "3600",
    description: "Blocks per Hour",
    icon: Box,
  },
  {
    title: "每个块币数",
    value: "100",
    description: "Coins per Block",
    icon: Coins,
  },
  {
    title: "单个块价值",
    value: "$1.23",
    description: "Block Value",
    icon: Wallet,
  },
]

export const PROPOSAL_DATA = [
  {
    title: "关于增加计算难度的提案",
    date: "2024-02-20",
    link: "https://example.com/proposal/123",
    options: [
      { label: "非常支持", votes: 8000, percentage: 40 },
      { label: "支持", votes: 6000, percentage: 30 },
      { label: "中立", votes: 2000, percentage: 10 },
      { label: "反对", votes: 3000, percentage: 15 },
      { label: "强烈反对", votes: 1000, percentage: 5 },
    ],
    totalVotes: 20000,
  },
  {
    title: "关于调整奖励分配机制的提案",
    date: "2024-02-19",
    link: "https://example.com/proposal/124",
    options: [
      { label: "方案A：平均分配", votes: 8000, percentage: 40 },
      { label: "方案B：算力比例", votes: 6000, percentage: 30 },
      { label: "方案C：贡献度", votes: 4000, percentage: 20 },
      { label: "方案D：维持现状", votes: 2000, percentage: 10 },
    ],
    totalVotes: 20000,
  },
  {
    title: "关于升级网络协议的提案",
    date: "2024-02-18",
    link: "https://example.com/proposal/125",
    options: [
      { label: "立即升级", votes: 15000, percentage: 50 },
      { label: "等待一个月", votes: 9000, percentage: 30 },
      { label: "等待三个月", votes: 6000, percentage: 20 },
    ],
    totalVotes: 30000,
  },
]
