'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/lib/auth/auth-context'
import Link from 'next/link'
import { User } from 'lucide-react'

export function UserMenu() {
  const { user, signOut } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Get user initials for fallback
  const getUserInitials = (email: string | undefined) => {
    if (!email) return 'U'
    const parts = email.split('@')[0].split('.')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return email[0].toUpperCase()
  }

  // Get user avatar URL from metadata or use a placeholder
  const getAvatarUrl = (user: any) => {
    // Check if user has avatar_url in metadata
    if (user?.user_metadata?.avatar_url) {
      return user.user_metadata.avatar_url
    }
    // Check if user has avatar_url in raw_user_meta_data
    if (user?.raw_user_meta_data?.avatar_url) {
      return user.raw_user_meta_data.avatar_url
    }
    // Return null to use fallback
    return null
  }

  const avatarUrl = getAvatarUrl(user)
  const userInitials = getUserInitials(user?.email)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="icon" className="rounded-full">
          <Avatar>
            {avatarUrl && (
              <AvatarImage 
                src={avatarUrl} 
                alt={user?.email || 'User avatar'} 
                onError={(e) => {
                  // Hide the image if it fails to load
                  e.currentTarget.style.display = 'none'
                }}
              />
            )}
            <AvatarFallback className="bg-primary text-primary-foreground">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <span className="sr-only">Toggle user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.email}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.user_metadata?.full_name || 'User'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
