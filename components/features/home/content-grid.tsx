"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { ProposalCard } from "@/components/features/home/proposal-card"
import { ProfitCalculator } from "@/components/features/home/profit-calculator"
import { SponsorDialog } from "@/components/features/home/sponsor-dialog"
import { SponsorList } from "@/components/features/home/sponsor-list"
import { FileText, Users, DollarSign } from "lucide-react"
import React, { useEffect, useState } from "react"
import QubicAPI from '@/services/api';
import { handleAPIError } from '@/utils/error-handler';
import { useTranslation } from 'react-i18next'

/**
 * 卡片高度常量
 * 根据视口高度动态计算，确保卡片在不同屏幕尺寸下都能保持合适的高度
 * @constant
 */
const CARD_HEIGHT = "min-h-[calc(100vh-13rem)] lg:h-[calc(100vh-13rem)]"

/**
 * 滚动区域高度常量
 * 考虑了卡片头部的高度，确保内容区域可以正确滚动
 * @constant
 */
const SCROLL_HEIGHT = "min-h-[calc(100vh-17rem)] lg:h-[calc(100vh-17rem)]"

interface ProposalData {
  title: string;
  published: string;
  url: string;
  totalVotes: number;
  sumOption0: number;
  sumOption1: number;
  sumOption2: number;
  sumOption3: number;
  sumOption4: number;
}

/**
 * 内容网格组件
 * 
 * 主页的核心布局组件，包含三个主要部分：
 * 1. 提案区域：展示当前纪元的提案列表
 * 2. 赞助区域：展示赞助商列表和赞助入口
 * 3. 收益计算器：提供挖矿收益计算工具
 * 
 * 特点：
 * - 响应式布局：在不同屏幕尺寸下自动调整列数
 * - 错误边界：每个区域都有独立的错误处理
 * - 滚动优化：长列表区域支持平滑滚动
 * 
 * @component
 * @example
 * ```tsx
 * // 在页面中使用
 * import { ContentGrid } from '@/components/features/home/content-grid';
 * 
 * export default function HomePage() {
 *   return (
 *     <div className="container">
 *       <ContentGrid />
 *     </div>
 *   );
 * }
 * ```
 */
export const ContentGrid = React.memo(function ContentGrid() {
  const { t } = useTranslation()
  const [proposals, setProposals] = useState<ProposalData[]>([]);

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const data = await QubicAPI.getProposals();
        setProposals(data);
      } catch (error) {
        handleAPIError(error, '获取提案数据失败');
      }
    };

    fetchProposals();
    const interval = setInterval(fetchProposals, 300000); // 每5分钟更新一次
    return () => clearInterval(interval);
  }, []);

  // 处理提案数据
  const processProposalOptions = (proposal: ProposalData) => {
    const options = [];
    const votes = [
      proposal.sumOption0,
      proposal.sumOption1,
      proposal.sumOption2,
      proposal.sumOption3,
      proposal.sumOption4
    ];

    // 只添加有票数的选项
    for (let i = 0; i < votes.length; i++) {
      if (votes[i] > 0) {
        options.push({
          label: `选项 ${i}`,
          votes: votes[i],
          percentage: Math.round((votes[i] / proposal.totalVotes) * 100)
        });
      }
    }

    return {
      title: proposal.title,
      date: proposal.published.split('T')[0], // 格式化日期为 YYYY-MM-DD
      link: proposal.url,
      options: options,
      totalVotes: proposal.totalVotes
    };
  };

  return (
    <div data-testid="content-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <ErrorBoundary>
        <Card data-testid="proposal-section" className={`col-span-1 ${CARD_HEIGHT} flex flex-col`}>
          <CardHeader className="border-b py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t('home.proposals.title')}
              </CardTitle>
              <div className="opacity-0">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <FileText className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 pt-0 overflow-hidden">
            <ScrollArea className={SCROLL_HEIGHT}>
              <div className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                {proposals.length > 0 ? (
                  proposals.map((proposal, index) => (
                    <ProposalCard
                      key={index}
                      {...processProposalOptions(proposal)}
                    />
                  ))
                ) : (
                  <div className="text-center text-muted-foreground">
                    {t('home.proposals.empty')}
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </ErrorBoundary>

      <ErrorBoundary>
        <div data-testid="calculator-section" className={`col-span-1 ${CARD_HEIGHT}`}>
          <ProfitCalculator />
        </div>
      </ErrorBoundary>

      <ErrorBoundary>
        <Card data-testid="sponsor-section" className={`col-span-1 ${CARD_HEIGHT} flex flex-col`}>
          <CardHeader className="border-b py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t('home.sponsor.title')}
              </CardTitle>
              <SponsorDialog
                wallets={[
                  {
                    title: "Qubic",
                    address: "XARKUROFQOTNDDSGVGUZSWDEEYMBSXOEAAYGJMUTFDWDMASHMFQPKYIHTPHA",
                    icon: <DollarSign className="h-4 w-4" />
                  }
                ]}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 pt-0 overflow-hidden">
            <ScrollArea className={SCROLL_HEIGHT}>
              <div className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                <SponsorList />
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </ErrorBoundary>
    </div>
  )
})

ContentGrid.displayName = "ContentGrid"
