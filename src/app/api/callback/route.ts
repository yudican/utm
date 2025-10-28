import { NextRequest, NextResponse } from 'next/server'

interface UserInfo {
  user_agent: string
  browser: string
  screen_resolution: string
  viewport: string
  language: string
  platform: string
  referer: string
  timestamp: string
  timezone: string
  ip_address?: string
  location?: {
    country: string
    country_code: string
    region: string
    city: string
    latitude: number
    longitude: number
    timezone: string
  }
  browser_location?: {
    latitude: number
    longitude: number
    accuracy: number
  }
}

interface URLData {
  original_url: string
  short_code: string
  created_at: string
  expires_at: string | null
}

interface TrackingData {
  short_code: string
  original_url: string
  user_info: UserInfo
  url_data: URLData
  click_timestamp: string
}

export async function POST(request: NextRequest) {
  try {
    const trackingData: TrackingData = await request.json()

    // Validate required fields
    if (!trackingData.short_code || !trackingData.original_url) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Missing required fields'
        },
        { status: 400 }
      )
    }

    // Log the tracking data (in production, you'd save to database)
    console.log('📊 Tracking Data Received:', {
      short_code: trackingData.short_code,
      original_url: trackingData.original_url,
      timestamp: trackingData.click_timestamp,
      user_agent: trackingData.user_info?.user_agent,
      browser: trackingData.user_info?.browser,
      location: trackingData.user_info?.location,
      ip_address: trackingData.user_info?.ip_address
    })

    // Here you would typically:
    // 1. Save to database
    // 2. Send to analytics service
    // 3. Forward to external webhook if needed

    try {
      // Try to forward to external webhook if configured
      const externalWebhookUrl = process.env.EXTERNAL_WEBHOOK_URL
      console.log(externalWebhookUrl,'externalWebhookUrl')
      if (externalWebhookUrl) {
        await fetch(externalWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(trackingData)
        })
      }
    } catch (error) {
      console.warn('Failed to forward to external webhook:', error)
      // Don't fail the request if external webhook fails
    }

    return NextResponse.json({
      status: 'success',
      message: 'Tracking data received successfully'
    })

  } catch (error) {
    console.error('Webhook Error:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to process tracking data'
      },
      { status: 500 }
    )
  }
}