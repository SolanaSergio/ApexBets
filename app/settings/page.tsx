import { Suspense } from "react"
import { Navigation } from "@/components/navigation/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Settings, User, Bell, Shield, Palette, Database, Download, Upload, Trash2, Save } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Customize your Project Apex experience with personalized settings and preferences
          </p>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-2">
              <Shield className="h-4 w-4" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2">
              <Database className="h-4 w-4" />
              Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Suspense fallback={<ProfileSkeleton />}>
              <ProfileSection />
            </Suspense>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Suspense fallback={<NotificationsSkeleton />}>
              <NotificationsSection />
            </Suspense>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Suspense fallback={<AppearanceSkeleton />}>
              <AppearanceSection />
            </Suspense>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            <Suspense fallback={<PrivacySkeleton />}>
              <PrivacySection />
            </Suspense>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <Suspense fallback={<DataSkeleton />}>
              <DataSection />
            </Suspense>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

// Profile Section
function ProfileSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Profile Settings</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input id="displayName" defaultValue="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="john.doe@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select defaultValue="est">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="est">Eastern Time (EST)</SelectItem>
                  <SelectItem value="cst">Central Time (CST)</SelectItem>
                  <SelectItem value="mst">Mountain Time (MST)</SelectItem>
                  <SelectItem value="pst">Pacific Time (PST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Subscription</div>
                <div className="text-sm text-muted-foreground">Premium Plan</div>
              </div>
              <Badge variant="default">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Member Since</div>
                <div className="text-sm text-muted-foreground">January 2024</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Last Login</div>
                <div className="text-sm text-muted-foreground">2 hours ago</div>
              </div>
            </div>
            <Separator />
            <Button variant="outline" className="w-full">
              Upgrade Plan
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Notifications Section
function NotificationsSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Notification Preferences</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Game Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Live Game Updates</div>
                <div className="text-sm text-muted-foreground">Get notified when games start or end</div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Score Updates</div>
                <div className="text-sm text-muted-foreground">Real-time score notifications</div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Game Reminders</div>
                <div className="text-sm text-muted-foreground">Remind me before games start</div>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prediction Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">New Predictions</div>
                <div className="text-sm text-muted-foreground">When new predictions are available</div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">High Confidence</div>
                <div className="text-sm text-muted-foreground">Only for predictions >80% confidence</div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Prediction Results</div>
                <div className="text-sm text-muted-foreground">When your tracked predictions resolve</div>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Market Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Line Movements</div>
                <div className="text-sm text-muted-foreground">Significant betting line changes</div>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Value Opportunities</div>
                <div className="text-sm text-muted-foreground">When value bets are detected</div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Trend Alerts</div>
                <div className="text-sm text-muted-foreground">Market trend notifications</div>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">App Updates</div>
                <div className="text-sm text-muted-foreground">New features and improvements</div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Maintenance Alerts</div>
                <div className="text-sm text-muted-foreground">Scheduled maintenance notifications</div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Security Alerts</div>
                <div className="text-sm text-muted-foreground">Account security notifications</div>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Appearance Section
function AppearanceSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Appearance Settings</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Theme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Color Scheme</Label>
              <Select defaultValue="system">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Accent Color</Label>
              <Select defaultValue="emerald">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emerald">Emerald</SelectItem>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="purple">Purple</SelectItem>
                  <SelectItem value="red">Red</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Font Size</Label>
              <Select defaultValue="medium">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dashboard Layout</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Compact Mode</div>
                <div className="text-sm text-muted-foreground">Reduce spacing for more content</div>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Show Animations</div>
                <div className="text-sm text-muted-foreground">Enable smooth transitions</div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Auto-refresh</div>
                <div className="text-sm text-muted-foreground">Automatically update data</div>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Privacy Section
function PrivacySection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Privacy & Security</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Data Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Analytics Tracking</div>
                <div className="text-sm text-muted-foreground">Help improve the app</div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Personalized Ads</div>
                <div className="text-sm text-muted-foreground">Show relevant advertisements</div>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Data Sharing</div>
                <div className="text-sm text-muted-foreground">Share data with partners</div>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Two-Factor Authentication</Label>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Add extra security to your account</span>
                <Button variant="outline" size="sm">Enable</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Login Sessions</Label>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Manage active sessions</span>
                <Button variant="outline" size="sm">View</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last changed 30 days ago</span>
                <Button variant="outline" size="sm">Change</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Data Section
function DataSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Data Management</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Export Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Export Format</Label>
              <Select defaultValue="json">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data Range</Label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last30">Last 30 days</SelectItem>
                  <SelectItem value="last90">Last 90 days</SelectItem>
                  <SelectItem value="lastyear">Last year</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Import Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Import File</Label>
              <div className="flex items-center gap-2">
                <Input type="file" accept=".json,.csv,.xlsx" />
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Supported formats: JSON, CSV, Excel (.xlsx)
            </div>
            <Button className="w-full" variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import Data
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Storage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Used Storage</div>
                <div className="text-sm text-muted-foreground">2.4 GB of 10 GB</div>
              </div>
              <div className="w-16 h-2 bg-muted rounded-full">
                <div className="w-6 h-2 bg-primary rounded-full" />
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Your data is stored securely and encrypted
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="font-medium text-red-600">Delete Account</div>
              <div className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </div>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Loading Skeletons
function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-40 bg-muted rounded animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="h-6 w-48 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                <div className="h-10 w-full bg-muted rounded animate-pulse" />
              </div>
            ))}
            <div className="h-10 w-full bg-muted rounded animate-pulse" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-6 w-16 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function NotificationsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-56 bg-muted rounded animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 w-32 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-48 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="h-6 w-12 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function AppearanceSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-muted rounded animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="h-6 w-16 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                <div className="h-10 w-full bg-muted rounded animate-pulse" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-6 w-12 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function PrivacySkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-muted rounded animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="h-6 w-24 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-40 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-6 w-12 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                <div className="flex items-center justify-between">
                  <div className="h-3 w-48 bg-muted rounded animate-pulse" />
                  <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function DataSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-40 bg-muted rounded animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 w-32 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="space-y-2">
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-10 w-full bg-muted rounded animate-pulse" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
