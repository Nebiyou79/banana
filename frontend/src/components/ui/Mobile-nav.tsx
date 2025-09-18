import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import { Button } from "@/components/ui/Button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/Sheet"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { user } = useAuth()

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Jobs", href: "/jobs" },
    { name: "Companies", href: "/companies" },
    { name: "Freelancers", href: "/freelancers" },
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <div className="px-7">
          <Link
            href="/"
            className="flex items-center"
            onClick={() => setOpen(false)}
          >
            <span className="text-xl font-bold">JobNetwork</span>
          </Link>
        </div>
        <div className="mt-6 h-full pb-36 pl-6">
          <div className="flex flex-col space-y-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "text-muted-foreground hover:text-primary",
                  router.pathname === item.href && "text-primary"
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="mt-12 flex flex-col space-y-4">
            {user ? (
              <>
                <Link
                  href={`/dashboard/${user.role}`}
                  onClick={() => setOpen(false)}
                  className="text-muted-foreground hover:text-primary"
                >
                  Dashboard
                </Link>
                <Link
                  href={`/dashboard/${user.role}/profile`}
                  onClick={() => setOpen(false)}
                  className="text-muted-foreground hover:text-primary"
                >
                  Profile
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className="text-muted-foreground hover:text-primary"
                >
                  Settings
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="text-muted-foreground hover:text-primary"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="text-muted-foreground hover:text-primary"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}