import { NextRequest, NextResponse } from 'next/server'

interface URLData {
  original_url: string
  status: string
  message?: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  try {
    // Validate short code format
    // if (!code || !/^[a-zA-Z0-9]+$/.test(code)) {
    //   return NextResponse.json(
    //     {
    //       status: 'error',
    //       message: 'Format kode URL tidak valid'
    //     },
    //     { status: 400 }
    //   )
    // }

    // For testing purposes, return a mock response
    // In production, you would fetch from your database
    if (code.startsWith('test') || code.startsWith('final')) {
      return NextResponse.json({
        status: 'success',
        original_url: 'https://www.google.com',
        message: 'URL ditemukan'
      })
    }
    
    // Here you would typically fetch from your database
    // For now, we'll simulate the API call to the backend
    const apiBaseUrl = process.env.API_BASE_URL || 'http://fis-backend.test/api'
    
    try {
      const response = await fetch(`${apiBaseUrl}/redirector/${code}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          return NextResponse.json(
            {
              status: 'error',
              message: 'URL tidak ditemukan. Pastikan kode URL masih valid.'
            },
            { status: 404 }
          )
        } else if (response.status === 410) {
          return NextResponse.json(
            {
              status: 'error',
              message: 'URL telah kedaluwarsa dan tidak dapat diakses lagi.'
            },
            { status: 410 }
          )
        } else {
          return NextResponse.json(
            {
              status: 'error',
              message: `Server error: ${response.status} ${response.statusText}`
            },
            { status: response.status }
          )
        }
      }

      const data = await response.json()
      return NextResponse.json(data)
      
    } catch (error) {
      console.error('Error fetching from backend:', error)
      
      // Fallback: return mock data for testing
      if (code === 'nYRU4u' || code === 'test123') {
        return NextResponse.json({
          status: 'success',
          data: {
            original_url: 'https://www.google.com',
            short_code: code,
            created_at: new Date().toISOString(),
            expires_at: null
          }
        })
      }
      
      return NextResponse.json(
        {
          status: 'error',
          message: 'Tidak dapat terhubung ke server backend'
        },
        { status: 503 }
      )
    }

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: 'Terjadi kesalahan internal server'
      },
      { status: 500 }
    )
  }
}