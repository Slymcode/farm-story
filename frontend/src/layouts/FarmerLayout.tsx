import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { DemoAccess } from "@/components/DemoAccess";
import { Button, Logo, cx } from "@/components/ui";

const NAV = [
  { to: "/farmer/dashboard", label: "My Farm" },
  { to: "/farmer/intelligence", label: "Farm Intelligence" },
  { to: "/farmer/actions", label: "Take Action" },
  { to: "/farmer/ask", label: "Ask AI" },
];

export default function FarmerLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [leaving, setLeaving] = useState(false);
  const signOut = async () => {
    setLeaving(true);
    try {
      await logout();
    } finally {
      setLeaving(false);
      nav("/", { replace: true });
    }
  };
  const first = user?.name.split(" ")[0];

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-cream-200 bg-cream-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2.5">
          <Link to={user ? "/farmer" : "/"} aria-label="Farm Story home">
            <Logo />
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <ConnectionStatus />
            <DemoAccess />
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                icon={LogOut}
                loading={leaving}
                onClick={signOut}
              >
                <span className="hidden sm:inline">
                  {first ? `${first} · ` : ""}
                </span>
                Logout
              </Button>
            ) : (
              <Link
                to="/login"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-forest-800 hover:bg-forest-50"
              >
                <LogIn className="size-4" aria-hidden />
                Log in
              </Link>
            )}
          </div>
        </div>
        {user?.onboardingCompleted && (
          <nav
            aria-label="Farmer"
            className="mx-auto max-w-5xl overflow-x-auto px-4"
          >
            <ul className="flex gap-1 pb-2">
              {NAV.map(({ to, label }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      cx(
                        "inline-flex min-h-10 items-center whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors",
                        isActive
                          ? "bg-forest-800 text-cream-50"
                          : "text-ink-700 hover:bg-cream-200",
                      )
                    }
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-8">
        <Outlet />
      </main>
      <footer className="border-t border-cream-200 px-4 py-5 text-center text-xs text-ink-500">
        Farm Story prototype. Farmer accounts are real; the Farmer / Admin
        switcher is Prototype Demo Access — not production authentication.
        Guidance is decision support, not a substitute for a qualified
        agronomist.
      </footer>
    </div>
  );
}
