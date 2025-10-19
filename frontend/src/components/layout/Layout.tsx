'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Building2, Menu, User, LogOut, Settings, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

interface LayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  { 
    name: 'Dashboard', 
    href: '/', 
    description: 'Overview of congressional trading activity' 
  },
  { 
    name: 'Congressional Trades', 
    href: '/trades', 
    description: 'Browse and analyze trades by members of Congress' 
  },
  { 
    name: 'Members', 
    href: '/members', 
    description: 'View profiles and trading history of Congress members' 
  },
  { 
    name: 'Alerts', 
    href: '/alerts', 
    description: 'Set up notifications for trading activity' 
  },
  { 
    name: 'Search', 
    href: '/search', 
    description: 'Search trades, members, and stocks' 
  },
];

function NavigationItems({ mobile = false, onItemClick }: { mobile?: boolean; onItemClick?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {navigationItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onItemClick}
            className={`${
              mobile
                ? 'flex flex-col items-start space-y-1 px-4 py-3 text-sm hover:bg-accent rounded-lg'
                : 'px-3 py-2 text-sm font-medium hover:text-foreground rounded-md transition-colors'
            } ${
              isActive
                ? mobile
                  ? 'bg-accent text-accent-foreground border-l-4 border-primary'
                  : 'text-primary bg-accent'
                : mobile
                ? 'text-foreground'
                : 'text-muted-foreground hover:bg-accent'
            }`}
          >
            <span>{item.name}</span>
            {mobile && (
              <span className="text-xs text-muted-foreground">{item.description}</span>
            )}
          </Link>
        );
      })}
    </>
  );
}

function UserMenu() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();

  if (!isAuthenticated) {
    return (
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/login')}
        >
          Sign In
        </Button>
        <Button
          size="sm"
          onClick={() => router.push('/register')}
        >
          Sign Up
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/alerts')}>
          <Bell className="mr-2 h-4 w-4" />
          <span>Alerts</span>
          <Badge variant="secondary" className="ml-auto">
            3
          </Badge>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Fix for Radix UI Sheet/Dialog pointer-events bug that blocks clicks
  // See: https://github.com/radix-ui/primitives/issues/2122
  useEffect(() => {
    // Ensure body pointer events are never blocked
    const resetPointerEvents = () => {
      if (document.body.style.pointerEvents === 'none') {
        console.warn('⚠️ Body pointer-events was set to "none", resetting to "auto"');
        document.body.style.pointerEvents = 'auto';
      }
    };

    // Reset immediately
    resetPointerEvents();

    // Monitor for changes (Sheet component might set it)
    const observer = new MutationObserver(resetPointerEvents);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style']
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-foreground">
                    CongressTracker
                  </h1>
                  <p className="text-xs text-muted-foreground -mt-1">
                    Trading Transparency Platform
                  </p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <NavigationItems />
            </nav>

            {/* User Menu and Mobile Toggle */}
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <UserMenu />

              {/* Mobile menu button */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} modal={false}>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="md:hidden"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <div className="flex items-center space-x-2 pb-6 border-b border-border">
                    <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">
                        CongressTracker
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Trading Transparency Platform
                      </p>
                    </div>
                  </div>
                  
                  <nav className="flex flex-col space-y-2 mt-6">
                    <NavigationItems 
                      mobile 
                      onItemClick={() => setMobileMenuOpen(false)} 
                    />
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Building2 className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-muted-foreground">
                © 2024 CongressTracker. Promoting transparency in government.
              </span>
            </div>
            <div className="flex space-x-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <Link href="/about" className="hover:text-foreground transition-colors">
                About
              </Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}