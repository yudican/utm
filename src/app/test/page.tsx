'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ExternalLink, Code, Globe, Hash } from 'lucide-react'

export default function TestPage() {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  
  const testUrls = [
    {
      format: 'Path Format (Recommended)',
      url: `${baseUrl}/nYRU4u`,
      description: 'Primary format: domain.com/{unique_code}',
      icon: <Globe className="w-4 h-4" />
    },
    {
      format: 'Query Parameter Format',
      url: `${baseUrl}/?code=nYRU4u`,
      description: 'Alternative format: domain.com/?code={unique_code}',
      icon: <Code className="w-4 h-4" />
    },
    {
      format: 'Hash Format',
      url: `${baseUrl}/#nYRU4u`,
      description: 'Alternative format: domain.com/#{unique_code}',
      icon: <Hash className="w-4 h-4" />
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            URL Redirector Test Page
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Test halaman untuk menguji fungsionalitas URL redirector dengan berbagai format URL yang didukung.
          </p>
        </div>

        <Alert className="mb-8 border-blue-200 bg-blue-50">
          <ExternalLink className="h-4 w-4" />
          <AlertDescription className="text-blue-800">
            <strong>Tip:</strong> Buka Developer Tools (F12) untuk melihat log proses redirector.
            Pastikan server backend berjalan untuk testing yang lengkap.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          {testUrls.map((test, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {test.icon}
                  {test.format}
                  {index === 0 && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      Primary
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {test.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-slate-100 p-3 rounded-md">
                    <code className="text-sm text-slate-700 break-all">
                      {test.url}
                    </code>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => window.open(test.url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Test URL
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Informasi Testing</CardTitle>
            <CardDescription>
              Panduan untuk menguji URL redirector
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Format URL yang Didukung:</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• <code>domain.com/nYRU4u</code> (Utama)</li>
                  <li>• <code>domain.com/?code=nYRU4u</code></li>
                  <li>• <code>domain.com/#nYRU4u</code></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Proses Redirector:</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Mengumpulkan informasi user</li>
                  <li>• Mengambil data URL dari API</li>
                  <li>• Mengirim data tracking</li>
                  <li>• Redirect ke URL tujuan</li>
                </ul>
              </div>
            </div>
            
            <Alert className="border-amber-200 bg-amber-50">
              <AlertDescription className="text-amber-800">
                <strong>Catatan:</strong> Untuk testing lengkap, pastikan backend API berjalan di 
                <code className="mx-1 px-1 bg-amber-100 rounded">http://fis-backend.test/api</code> 
                atau sesuaikan konfigurasi environment variables.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            Kembali ke Halaman Utama
          </Button>
        </div>
      </div>
    </div>
  )
}