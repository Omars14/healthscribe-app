'use client'

// Force dynamic rendering to avoid AuthContext issues during build
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Zap,
  Save,
  Loader2,
  Check,
  AlertCircle,
  Key,
  Mail,
  Globe,
  Volume2,
  FileText,
  Database
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface UserSettings {
  notifications: {
    email: boolean
    push: boolean
    transcriptionComplete: boolean
    transcriptionFailed: boolean
  }
  preferences: {
    theme: 'light' | 'dark' | 'system'
    language: string
    timezone: string
    audioPlaybackSpeed: number
    autoSave: boolean
    autoSaveInterval: number
  }
  api: {
    webhookUrl?: string
    apiKey?: string
    n8nWebhookUrl?: string
  }
  export: {
    defaultFormat: 'txt' | 'pdf' | 'docx' | 'json'
    includeMetadata: boolean
    includeTimestamps: boolean
  }
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      email: true,
      push: false,
      transcriptionComplete: true,
      transcriptionFailed: true
    },
    preferences: {
      theme: 'system',
      language: 'en',
      timezone: 'America/New_York',
      audioPlaybackSpeed: 1,
      autoSave: true,
      autoSaveInterval: 30
    },
    api: {
      webhookUrl: '',
      apiKey: '',
      n8nWebhookUrl: process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || ''
    },
    export: {
      defaultFormat: 'txt',
      includeMetadata: true,
      includeTimestamps: false
    }
  })
  
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    loadSettings()
  }, [user])

  const loadSettings = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (data) {
        setSettings(prevSettings => ({
          ...prevSettings,
          ...data.settings
        }))
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const saveSettings = async () => {
    if (!user) return
    
    setSaving(true)
    setSaved(false)
    
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          settings,
          updated_at: new Date().toISOString()
        })
      
      if (error) throw error
      
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (category: keyof UserSettings, key: string, value: string | number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your account details and personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <Input
                  id="organization"
                  type="text"
                  placeholder="Your organization"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Manage your password and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full">
                <Key className="h-4 w-4 mr-2" />
                Change Password
              </Button>
              <Button variant="outline" className="w-full">
                <Shield className="h-4 w-4 mr-2" />
                Enable Two-Factor Authentication
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Preferences</CardTitle>
              <CardDescription>
                Customize your dashboard experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <select
                  id="theme"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={settings.preferences.theme}
                  onChange={(e) => updateSetting('preferences', 'theme', e.target.value)}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <select
                    id="language"
                    className="flex-1 h-10 px-3 rounded-md border border-input bg-background"
                    value={settings.preferences.language}
                    onChange={(e) => updateSetting('preferences', 'language', e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <select
                  id="timezone"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={settings.preferences.timezone}
                  onChange={(e) => updateSetting('preferences', 'timezone', e.target.value)}
                >
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="playback-speed">Default Audio Playback Speed</Label>
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  <select
                    id="playback-speed"
                    className="flex-1 h-10 px-3 rounded-md border border-input bg-background"
                    value={settings.preferences.audioPlaybackSpeed}
                    onChange={(e) => updateSetting('preferences', 'audioPlaybackSpeed', parseFloat(e.target.value))}
                  >
                    <option value="0.5">0.5x</option>
                    <option value="0.75">0.75x</option>
                    <option value="1">1x (Normal)</option>
                    <option value="1.25">1.25x</option>
                    <option value="1.5">1.5x</option>
                    <option value="2">2x</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-save Transcriptions</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically save changes while editing
                  </p>
                </div>
                <Switch
                  checked={settings.preferences.autoSave}
                  onCheckedChange={(checked) => updateSetting('preferences', 'autoSave', checked)}
                />
              </div>

              {settings.preferences.autoSave && (
                <div className="space-y-2">
                  <Label htmlFor="autosave-interval">Auto-save Interval (seconds)</Label>
                  <Input
                    id="autosave-interval"
                    type="number"
                    min="10"
                    max="300"
                    value={settings.preferences.autoSaveInterval}
                    onChange={(e) => updateSetting('preferences', 'autoSaveInterval', parseInt(e.target.value))}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to be notified about transcription events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.email}
                  onCheckedChange={(checked) => updateSetting('notifications', 'email', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive browser push notifications
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.push}
                  onCheckedChange={(checked) => updateSetting('notifications', 'push', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Transcription Complete</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when transcription is completed
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.transcriptionComplete}
                  onCheckedChange={(checked) => updateSetting('notifications', 'transcriptionComplete', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Transcription Failed</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when transcription fails
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.transcriptionFailed}
                  onCheckedChange={(checked) => updateSetting('notifications', 'transcriptionFailed', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                Configure webhooks and API integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="n8n-webhook">n8n Webhook URL</Label>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="n8n-webhook"
                    type="url"
                    placeholder="https://your-n8n-instance.com/webhook/..."
                    value={settings.api.n8nWebhookUrl}
                    onChange={(e) => updateSetting('api', 'n8nWebhookUrl', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook-url">Custom Webhook URL</Label>
                <Input
                  id="webhook-url"
                  type="url"
                  placeholder="https://your-webhook-endpoint.com"
                  value={settings.api.webhookUrl}
                  onChange={(e) => updateSetting('api', 'webhookUrl', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="Your API key"
                    value={settings.api.apiKey}
                    onChange={(e) => updateSetting('api', 'apiKey', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">API Documentation</p>
                    <p className="text-muted-foreground mt-1">
                      Visit our API documentation to learn how to integrate with external services.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Settings</CardTitle>
              <CardDescription>
                Configure default export options for transcriptions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="export-format">Default Export Format</Label>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <select
                    id="export-format"
                    className="flex-1 h-10 px-3 rounded-md border border-input bg-background"
                    value={settings.export.defaultFormat}
                    onChange={(e) => updateSetting('export', 'defaultFormat', e.target.value)}
                  >
                    <option value="txt">Plain Text (.txt)</option>
                    <option value="pdf">PDF Document (.pdf)</option>
                    <option value="docx">Word Document (.docx)</option>
                    <option value="json">JSON Data (.json)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Include Metadata</Label>
                  <p className="text-sm text-muted-foreground">
                    Include doctor, patient, and date information
                  </p>
                </div>
                <Switch
                  checked={settings.export.includeMetadata}
                  onCheckedChange={(checked) => updateSetting('export', 'includeMetadata', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Include Timestamps</Label>
                  <p className="text-sm text-muted-foreground">
                    Add timestamps to exported transcriptions
                  </p>
                </div>
                <Switch
                  checked={settings.export.includeTimestamps}
                  onCheckedChange={(checked) => updateSetting('export', 'includeTimestamps', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Export or delete your data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full">
                <Database className="h-4 w-4 mr-2" />
                Export All Data
              </Button>
              <Button variant="destructive" className="w-full">
                <AlertCircle className="h-4 w-4 mr-2" />
                Delete All Data
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex items-center gap-4">
        <Button 
          onClick={saveSettings} 
          disabled={saving}
          className="min-w-[120px]"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Saved
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
        {saved && (
          <p className="text-sm text-green-600">Settings saved successfully!</p>
        )}
      </div>
    </div>
  )
}
