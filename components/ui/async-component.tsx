"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ComponentType } from 'react';

type AsyncComponentProps = {
  componentName: keyof typeof componentMap;
  [key: string]: any;
};

// 为每个组件创建单独的动态导入
const StatCardGrid = dynamic(
  () => import('@/components/features/dashboard/stat-card-grid').then((mod) => mod.StatCardGrid),
  { loading: () => <Skeleton className="w-full h-32" />, ssr: false }
);

const ContentGrid = dynamic(
  () => import('@/components/features/dashboard/content-grid').then((mod) => mod.ContentGrid),
  { loading: () => <Skeleton className="w-full h-32" />, ssr: false }
);

const VanityAddress = dynamic(
  () => import('@/components/features/vanity-address').then((mod) => mod.VanityAddress),
  { loading: () => <Skeleton className="w-full h-32" />, ssr: false }
);

const ProposalCard = dynamic(
  () => import('@/components/features/dashboard/proposal-card').then((mod) => mod.ProposalCard),
  { loading: () => <Skeleton className="w-full h-32" />, ssr: false }
);

const SponsorDialog = dynamic(
  () => import('@/components/features/shared/sponsor-dialog').then((mod) => mod.SponsorDialog),
  { loading: () => <Skeleton className="w-full h-32" />, ssr: false }
);

const PoolList = dynamic(
  () => import('@/components/features/calculator/pool-list').then((mod) => mod.PoolList),
  { loading: () => <Skeleton className="w-full h-32" />, ssr: false }
);

// 组件映射表
const componentMap = {
  'vanity-address': VanityAddress,
  'stat-card-grid': StatCardGrid,
  'content-grid': ContentGrid,
  'proposal-card': ProposalCard,
  'sponsor-dialog': SponsorDialog,
  'pool-list': PoolList,
} as const;

export function AsyncComponent({ componentName, ...props }: AsyncComponentProps) {
  const Component = componentMap[componentName] as ComponentType<any>;

  if (!Component) {
    return null;
  }

  return (
    <Suspense fallback={<Skeleton className="w-full h-32" />}>
      <Component {...props} />
    </Suspense>
  );
}
