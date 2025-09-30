import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Settings, User, Search } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">
                A
              </span>
            </div>
            <div>
              <h2 className="font-bold text-lg text-foreground">AutoAdmin</h2>
              <p className="text-xs text-muted-foreground">
                Super Administrator
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex items-center gap-2 bg-muted rounded-lg px-3 py-2 w-96">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search vehicles, dealers, reports..."
              className="bg-transparent border-none outline-none flex-1 text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-secondary text-secondary-foreground text-xs">
                3
              </Badge>
            </Button>

            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Admin User</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
