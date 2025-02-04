import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

interface Article {
  title: string;
  description: string;
  date: string;
  link: string;
  image: string;
}

interface CacheData {
  articles: Article[];
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 缓存5分钟
let articlesCache: CacheData | null = null;

async function fetchArticles(): Promise<Article[]> {
  // 检查缓存是否有效
  if (articlesCache && Date.now() - articlesCache.timestamp < CACHE_DURATION) {
    return articlesCache.articles;
  }

  const response = await fetch('https://qubic.org/blog-grid')
  if (!response.ok) {
    throw new Error('Failed to fetch from Qubic blog')
  }

  const html = await response.text()
  const $ = cheerio.load(html)
  const articles: Article[] = []
  
  $('a[href^="./blog-detail/"]').each((i, element) => {
    const $element = $(element)
    const title = $element.find('.framer-tisweq h2').text().trim()
    const date = $element.find('.framer-oqf4rp p').text().trim()
    const link = 'https://qubic.org' + $element.attr('href')?.replace('.', '')
    const image = $element.find('img').attr('src')
    
    if (title && date && link && image) {
      articles.push({
        title,
        description: '',
        date,
        link,
        image
      })
    }
  })

  // 更新缓存
  articlesCache = {
    articles,
    timestamp: Date.now()
  };

  return articles;
}

export async function GET(request: Request) {
  try {
    new URL(request.url)
    const allArticles = await fetchArticles()
    
    return NextResponse.json({
      articles: allArticles,
      total: allArticles.length
    })
  } catch (error) {
    console.error('Error fetching articles:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch articles'
    
    return NextResponse.json({ 
      articles: [], 
      total: 0,
      error: errorMessage
    }, { 
      status: error instanceof Error && error.message.includes('Failed to fetch from Qubic blog') 
        ? 502  // Bad Gateway for upstream service issues
        : 500  // Internal Server Error for other issues
    })
  }
}
