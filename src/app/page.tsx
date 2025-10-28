"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
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
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [shortCode, setShortCode] = useState<string | null>(null)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)

  const searchParams = useSearchParams()
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "/api"
  const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_URL || "/api/callback"

  // Get short code from URL
  const getShortCodeFromURL = (): string | null => {
    // Priority 1: Get from URL path (domain.com/nYRU4u)
    const path = window.location.pathname
    const segments = path.split("/").filter((segment) => segment.length > 0)

    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1]
      // Make sure it's not a file with extension
      if (!lastSegment.includes(".")) {
        return lastSegment
      }
    }

    // Priority 2: Get from query parameter (?code=nYRU4u)
    const codeParam = searchParams.get("code")
    if (codeParam) {
      return codeParam
    }

    // Priority 3: Get from hash (#nYRU4u)
    const hash = window.location.hash.replace("#", "")
    if (hash && !hash.includes("/")) {
      return hash
    }

    return null
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
      referer: document.referrer || "direct",
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }

    try {
      // Get IP address and location
      const ipResponse = await fetch("https://api.ipify.org?format=json")
      const ipData = await ipResponse.json()
      info.ip_address = ipData.ip

      const locationResponse = await fetch(
        `https://ipapi.co/${ipData.ip}/json/`
      )
      const locationData = await locationResponse.json()

      info.location = {
        country: locationData.country_name,
        country_code: locationData.country_code,
        region: locationData.region,
        city: locationData.city,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        timezone: locationData.timezone,
      }
    } catch (error) {
      console.warn("Could not fetch IP/location:", error)
      info.ip_address = "unknown"
    }

    // Try to get browser location
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              enableHighAccuracy: false,
            })
          }
        )

        info.browser_location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }
      } catch (error) {
        console.warn("Browser location not available:", error)
      }
    }

    return info
  }

  // Fetch URL data from API
  const fetchURLData = async (code: string): Promise<URLData> => {
    if (!/^[a-zA-Z0-9]+$/.test(code)) {
      throw new Error("Format kode URL tidak valid")
    }

    console.log(`🔍 Mengambil data untuk short code: ${code}`)
    console.log(`📡 API URL: ${apiBaseUrl}/redirector/${code}`)

    try {
      const response = await fetch(`${apiBaseUrl}/redirector/${code}`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("URL tidak ditemukan. Pastikan kode URL masih valid.")
        } else if (response.status === 410) {
          throw new Error("URL telah kedaluwarsa dan tidak dapat diakses lagi.")
        } else {
          throw new Error(
            `Server error: ${response.status} ${response.statusText}`
          )
        }
      }

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
        const code = getShortCodeFromURL()
        setShortCode(code)

        console.log("🚀 URL Redirector dimulai")
        console.log("🌐 Current URL:", window.location.href)
        console.log("🔑 Short Code:", code)

        if (!code) {
          throw new Error(
            "Kode URL tidak ditemukan dalam URL. Format yang benar: domain.com/nYRU4u"
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
  }, [])

  const handleRetry = () => {
    setError(null)
    setIsLoading(true)
    setProgress(0)
    window.location.reload()
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center bg-white/10 backdrop-blur-lg border-white/20">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-white mb-2">
            Terjadi Kesalahan
          </h1>
          <Alert className="mb-6 bg-red-500/20 border-red-500/30">
            <AlertDescription className="text-white/90">
              {error}
            </AlertDescription>
          </Alert>
          <Button
            onClick={handleRetry}
            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            Coba Lagi
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <Suspense fallback={null}>
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center bg-white/10 backdrop-blur-lg border-white/20">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
          <h1 className="text-xl font-semibold text-white mb-2">
            Memproses Permintaan
          </h1>
          <p className="text-white/80 text-sm mb-6">Mohon tunggu sebentar...</p>
          <Progress value={progress} className="mb-4" />
          <p className="text-white/70 text-xs">
            Mengumpulkan informasi dan mempersiapkan redirect
          </p>
        </Card>
      </div>
    </Suspense>
  )
}
