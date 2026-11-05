import { Link } from "@tanstack/react-router";
import { BrandLogo } from "@/shared/layout/brand-logo";
import { Header } from "@/shared/layout/header";
import { useCurrentUser } from "@/features/auth";
import { HeaderActions } from "@/features/shell/components/header-actions";
import { MainNav } from "@/features/shell/components/main-nav";

export function AppHeader({ className }: { className?: string }) {
  const user = useCurrentUser();

  return (
    <Header className={className}>
      <Link to="/events" className="flex h-11 shrink-0 items-center rounded-xl">
        {/* Guests need the phone header's width for the sign-in links. */}
        <BrandLogo size="sm" className={user ? undefined : "max-sm:[&>span]:hidden"} />
      </Link>
      <MainNav />
      <HeaderActions />
    </Header>
  );
}
