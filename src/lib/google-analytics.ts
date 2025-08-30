import { google } from 'googleapis'

// Service account credentials (you'll need to set these in .env)
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_ANALYTICS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
})

export interface AnalyticsData {
  totalVisitors: number
  pageViews: number
  uniqueVisitors: number
  bounceRate: string
  avgSessionDuration: string
  topPages: Array<{ page: string; views: number; change: string }>
  visitorTrend: Array<{ day: string; visitors: number; pageViews: number }>
  deviceStats: Array<{ device: string; percentage: number; users: number }>
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  try {
    // For now, return mock data since Google Analytics v3 API has type issues
    // TODO: Implement proper Google Analytics v4 API integration
    console.log('Using mock analytics data - Google Analytics integration pending')
    
    return {
      totalVisitors: 1247,
      pageViews: 3421,
      uniqueVisitors: 892,
      bounceRate: '23.4%',
      avgSessionDuration: '2m 34s',
      topPages: [
        { page: '/menu', views: 1247, change: '+12%' },
        { page: '/about', views: 892, change: '+8%' },
        { page: '/contact', views: 567, change: '+15%' },
        { page: '/gallery', views: 445, change: '+5%' },
      ],
      visitorTrend: [
        { day: 'Sen', visitors: 120, pageViews: 340 },
        { day: 'Sel', visitors: 145, pageViews: 420 },
        { day: 'Rab', visitors: 132, pageViews: 380 },
        { day: 'Kam', visitors: 167, pageViews: 450 },
        { day: 'Jum', visitors: 189, pageViews: 520 },
        { day: 'Sab', visitors: 234, pageViews: 680 },
        { day: 'Min', visitors: 260, pageViews: 731 },
      ],
      deviceStats: [
        { device: 'Desktop', percentage: 45, users: 561 },
        { device: 'Mobile', percentage: 42, users: 524 },
        { device: 'Tablet', percentage: 13, users: 162 },
      ]
    }

  } catch (error) {
    console.error('Error fetching Google Analytics data:', error)
    
    // Return mock data if Google Analytics fails
    return {
      totalVisitors: 1247,
      pageViews: 3421,
      uniqueVisitors: 892,
      bounceRate: '23.4%',
      avgSessionDuration: '2m 34s',
      topPages: [
        { page: '/menu', views: 1247, change: '+12%' },
        { page: '/about', views: 892, change: '+8%' },
        { page: '/contact', views: 567, change: '+15%' },
        { page: '/gallery', views: 445, change: '+5%' },
      ],
      visitorTrend: [
        { day: 'Sen', visitors: 120, pageViews: 340 },
        { day: 'Sel', visitors: 145, pageViews: 420 },
        { day: 'Rab', visitors: 132, pageViews: 380 },
        { day: 'Kam', visitors: 167, pageViews: 450 },
        { day: 'Jum', visitors: 189, pageViews: 520 },
        { day: 'Sab', visitors: 234, pageViews: 680 },
        { day: 'Min', visitors: 260, pageViews: 731 },
      ],
      deviceStats: [
        { device: 'Desktop', percentage: 45, users: 561 },
        { device: 'Mobile', percentage: 42, users: 524 },
        { device: 'Tablet', percentage: 13, users: 162 },
      ]
    }
  }
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
} 