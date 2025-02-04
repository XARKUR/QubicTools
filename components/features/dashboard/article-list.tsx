"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { ArticleCard } from "@/components/features/dashboard/article-card"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface Article {
  title: string;
  date: string;
  link: string;
  image: string;
}

interface ArticlesResponse {
  articles: Article[];
  total: number;
}

const INITIAL_DISPLAY = 10;  // 初始显示10篇
const LOAD_MORE_COUNT = 5;   // 每次加载5篇

export function ArticleList() {
  const { t } = useTranslation()
  const [allArticles, setAllArticles] = useState<Article[]>([])
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const initialLoadDone = useRef(false)

  const loadArticles = useCallback(async () => {
    if (initialLoadDone.current) return;

    try {
      setError(null)
      const response = await fetch('/api/articles')
      if (!response.ok) throw new Error('Failed to fetch articles')
      
      const data: ArticlesResponse = await response.json()
      setAllArticles(data.articles)
      initialLoadDone.current = true
    } catch (error) {
      console.error('Failed to load articles:', error)
      setError(error instanceof Error ? error.message : 'Failed to load articles')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMore = useCallback(() => {
    if (loadingMore) return;
    setLoadingMore(true)
    
    // 使用 setTimeout 来模拟加载效果，让用户感知到正在加载更多
    setTimeout(() => {
      setDisplayCount(prev => Math.min(prev + LOAD_MORE_COUNT, allArticles.length))
      setLoadingMore(false)
    }, 300)
  }, [loadingMore, allArticles.length])

  // 初始加载
  useEffect(() => {
    loadArticles()
  }, [loadArticles])

  // 设置 Intersection Observer 来监听滚动
  useEffect(() => {
    if (!loadMoreRef.current || !initialLoadDone.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayCount < allArticles.length && !loadingMore) {
          loadMore()
        }
      },
      { 
        root: null,
        rootMargin: '100px',
        threshold: 0.1 
      }
    );

    observerRef.current.observe(loadMoreRef.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [displayCount, allArticles.length, loadingMore, loadMore])

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Button variant="ghost" size="sm" disabled>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          {t('dashboard.articles.loading')}
        </Button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-4 space-y-2">
        <div className="text-destructive">{error}</div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            initialLoadDone.current = false;
            loadArticles();
          }}
        >
          {t('dashboard.articles.retry')}
        </Button>
      </div>
    )
  }

  if (allArticles.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">{t('dashboard.articles.empty')}</div>
  }

  const displayedArticles = allArticles.slice(0, displayCount);
  const hasMore = displayCount < allArticles.length;

  return (
    <div className="space-y-4 p-4">
      {displayedArticles.map((article, index) => (
        <ArticleCard
          key={article.link}
          {...article}
          isFirst={index === 0}
        />
      ))}
      {loadingMore && (
        <div className="flex justify-center py-2">
          <Button variant="ghost" size="sm" disabled>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            {t('dashboard.articles.loadingMore')}
          </Button>
        </div>
      )}
      {hasMore && !loadingMore && (
        <div 
          ref={loadMoreRef} 
          className="h-10"
        />
      )}
    </div>
  )
}
