"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Script from "next/script"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
  status: string
  message?: string
}

export default function RedirectorPage() {
  const params = useParams()
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [shortCode, setShortCode] = useState<string>("")
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "/api"
  const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_URL || "/api/callback"

  // Get short code from params
  const getShortCodeFromParams = (): string | null => {
    const code = params.code as string
    return code
  }

  // Get browser info
  const getBrowserInfo = (): string => {
    const ua = navigator.userAgent
    let browser = "Unknown"

    if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome"
    else if (ua.includes("Firefox")) browser = "Firefox"
    else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari"
    else if (ua.includes("Edg")) browser = "Edge"
    else if (ua.includes("Opera")) browser = "Opera"

    return browser
  }

  // Collect user information
  const collectUserInfo = async (): Promise<UserInfo> => {
    const info: UserInfo = {
      user_agent: navigator.userAgent,
      browser: getBrowserInfo(),
      screen_resolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language,
      platform: navigator.platform,
      referer: document.referrer || "Direct",
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }

    // Location tracking disabled
    // IP address and geolocation features have been disabled

    return info
  }

  // Fetch URL data from API
  const fetchURLData = async (code: string): Promise<URLData> => {
    try {
      const response = await fetch(`${apiBaseUrl}/redirector/${code}`)
      const data = await response.json()

      console.log("📊 Data URL berhasil diambil:", data)

      if (data.status !== "success") {
        throw new Error(data.message || "Gagal mengambil data URL")
      }

      return data.data
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.name === "TypeError" &&
        error.message.includes("fetch")
      ) {
        throw new Error(
          "Tidak dapat terhubung ke server. Periksa koneksi internet Anda."
        )
      }
      throw error
    }
  }

  // Send tracking data
  const sendTrackingData = async (
    urlData: URLData,
    userInfo: UserInfo,
    shortCode: string
  ) => {
    try {
      const trackingData = {
        short_code: shortCode,
        original_url: urlData.original_url,
        user_info: userInfo,
        url_data: urlData,
        click_timestamp: new Date().toISOString(),
      }

      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(trackingData),
      })
    } catch (error) {
      console.warn("Failed to send tracking data:", error)
    }
  }

  // Main initialization
  useEffect(() => {
    const init = async () => {
      try {
        const code = getShortCodeFromParams()
        setShortCode(code || "")

        console.log("🚀 URL Redirector dimulai")
        console.log("🌐 Current URL:", window.location.href)
        console.log("🔑 Short Code:", code)

        if (!code) {
          throw new Error(
            "Kode URL tidak valid. Format yang benar: domain.com/nYRU4u"
          )
        }

        setProgress(20)

        // Collect user info
        console.log("👤 Mengumpulkan informasi user...")
        const info = await collectUserInfo()
        setUserInfo(info)
        setProgress(50)

        // Fetch URL data
        console.log("📡 Mengambil data URL dari API...")
        const urlData = await fetchURLData(code)
        setProgress(80)

        // Send tracking data
        console.log("📊 Mengirim data tracking...")
        await sendTrackingData(urlData, info, code)
        setProgress(100)

        // Redirect
        console.log("🔄 Melakukan redirect ke:", urlData.original_url)
        setTimeout(() => {
          window.location.href = urlData.original_url
        }, 1000)
      } catch (error: unknown) {
        console.error("❌ Error:", error)
        setError(
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan yang tidak diketahui"
        )
        setIsLoading(false)
      }
    }

    init()
  }, [params.code])

  const handleRetry = () => {
    setError(null)
    setIsLoading(true)
    setProgress(0)
    window.location.reload()
  }

  if (error) {
    return (
      <>
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-997723858"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-997723858');
          `}
        </Script>

        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Oops! Terjadi Kesalahan
              </h1>
              <Alert className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>

            <div className="space-y-3">
              <Button onClick={handleRetry} className="w-full">
                Coba Lagi
              </Button>
              <p className="text-sm text-gray-500">
                Jika masalah berlanjut, silakan hubungi administrator
              </p>
            </div>
          </Card>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Google tag (gtag.js) */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=AW-997723858"
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'AW-997723858');
        `}
      </Script>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
              <svg
                className="w-8 h-8 text-blue-600 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Mengalihkan...
            </h1>
            <p className="text-gray-600 mb-4">
              Sedang memproses permintaan Kamu
            </p>
          </div>

          <div className="space-y-4">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-gray-500">
              {progress < 20 && "Memulai..."}
              {progress >= 20 && progress < 50 && "Mengumpulkan informasi..."}
              {progress >= 50 && progress < 80 && "Mengambil data URL..."}
              {progress >= 80 &&
                progress < 100 &&
                "Mengyiapkan kupon diskon..."}
              {progress >= 100 && "Mengalihkan ke tujuan..."}
            </p>

            {shortCode && (
              <div className="text-xs text-gray-400 font-mono bg-gray-50 p-2 rounded">
                Code: {shortCode}
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  )
}
