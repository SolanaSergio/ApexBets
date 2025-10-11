'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, Bell, Shield, Palette, Database, Download, Trash2, Save } from 'lucide-react'

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-8">
        <Header />
        <SettingsTabs />
      </div>
    </AppLayout>
  )
}

// --- Sub-components ---

function Header() {
  return (
    <div className="text-center">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Settings</h1>
      <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
        Manage your account, preferences, and how you experience Project Apex.
      </p>
    </div>
  )
}

function SettingsTabs() {
  const tabItems = [
    { value: 'profile', label: 'Profile', icon: User },
    { value: 'notifications', label: 'Notifications', icon: Bell },
    { value: 'appearance', label: 'Appearance', icon: Palette },
    { value: 'privacy', label: 'Privacy', icon: Shield },
    { value: 'data', label: 'Data Management', icon: Database },
  ]

  return (
    <Tabs defaultValue="profile" className="lg:grid lg:grid-cols-4 gap-8">
      <TabsList className="lg:col-span-1 flex lg:flex-col lg:h-auto overflow-x-auto p-2 bg-gray-100 rounded-lg">
        {tabItems.map(({ value, label, icon: Icon }) => (
          <TabsTrigger key={value} value={value} className="w-full justify-start text-base p-3 data-[state=active]:bg-white data-[state=active]:shadow-md">
            <Icon className="h-5 w-5 mr-3" /> {label}
          </TabsTrigger>
        ))}
      </TabsList>
      <div className="lg:col-span-3 mt-6 lg:mt-0">
        <TabsContent value="profile"><ProfileSection /></TabsContent>
        <TabsContent value="notifications"><NotificationsSection /></TabsContent>
        <TabsContent value="appearance"><AppearanceSection /></TabsContent>
        <TabsContent value="privacy"><PrivacySection /></TabsContent>
        <TabsContent value="data"><DataSection /></TabsContent>
      </div>
    </Tabs>
  )
}

function SettingsCard({ title, description, children, footer }: { title: string; description?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  )
}

function ProfileSection() {
  return (
    <div className="space-y-6">
      <SettingsCard 
        title="Personal Information"
        description="Update your display name, email, and timezone."
        footer={<Button><Save className="mr-2 h-4 w-4" />Save Changes</Button>}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input id="displayName" defaultValue="John Doe" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" defaultValue="john.doe@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select defaultValue="est">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="est">Eastern Time (EST)</SelectItem>
                <SelectItem value="cst">Central Time (CST)</SelectItem>
                <SelectItem value="pst">Pacific Time (PST)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SettingsCard>
      <SettingsCard 
        title="Account Security"
        description="Manage your password and two-factor authentication."
      >
        <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">Password</p>
                <Button variant="outline">Change Password</Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">Two-Factor Authentication</p>
                <Button variant="outline">Enable 2FA</Button>
            </div>
        </div>
      </SettingsCard>
    </div>
  )
}

function NotificationsSection() {
  return (
    <div className="space-y-6">
      <SettingsCard 
        title="Email Notifications" 
        description="Choose which emails you want to receive."
        footer={undefined}
      >
        <div className="space-y-4">
          <SwitchItem label="Game Summaries" description="Weekly reports on game outcomes and predictions." defaultChecked />
          <SwitchItem label="Platform Updates" description="News, updates, and feature announcements." defaultChecked />
          <SwitchItem label="Security Alerts" description="Important notifications about your account security." />
        </div>
      </SettingsCard>
      <SettingsCard 
        title="Push Notifications" 
        description="Manage real-time alerts on your devices."
        footer={undefined}
      >
        <div className="space-y-4">
          <SwitchItem label="Live Game Events" description="Alerts for game start, end, and major plays." defaultChecked />
          <SwitchItem label="High-Confidence Predictions" description="Get notified about top-tier prediction opportunities." />
        </div>
      </SettingsCard>
    </div>
  )
}

function SwitchItem({ label, description, ...props }: { label: string; description: string; [key: string]: any }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="max-w-sm">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch {...props} />
    </div>
  )
}

function AppearanceSection() {
  return (
    <SettingsCard 
      title="Theme & Layout" 
      description="Customize the look and feel of the application."
      footer={undefined}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Color Scheme</Label>
          <Select defaultValue="light">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System Default</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <SwitchItem label="Compact Mode" description="Reduce padding and margins for a denser view." />
        <SwitchItem label="Enable Animations" description="UI animations for a more dynamic experience." defaultChecked />
      </div>
    </SettingsCard>
  )
}

function PrivacySection() {
  return (
    <div className="space-y-6">
      <SettingsCard 
        title="Privacy Settings" 
        description="Control how your data is used."
        footer={undefined}
      >
        <div className="space-y-4">
          <SwitchItem label="Analytics Tracking" description="Allow us to collect anonymous usage data to improve our service." defaultChecked />
          <SwitchItem label="Personalized Content" description="Tailor content and recommendations based on your activity." />
        </div>
      </SettingsCard>
      <SettingsCard 
        title="Account Deletion"
        description="Permanently delete your account and all associated data. This action is irreversible."
        footer={undefined}
      >
        <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete My Account</Button>
      </SettingsCard>
    </div>
  )
}

function DataSection() {
  return (
    <SettingsCard 
      title="Data Export" 
      description="Download your data in various formats."
      footer={undefined}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Export Format</Label>
          <Select defaultValue="json">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="w-full"><Download className="mr-2 h-4 w-4" /> Export All Data</Button>
      </div>
    </SettingsCard>
  )
}