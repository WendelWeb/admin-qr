import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { settings } from "@/db/schema";
import DevDisconnectedScreen from "@/components/DevDisconnectedScreen";
import DashboardShell from "@/components/DashboardShell";

// Always read the live disconnect flag — never serve a cached layout.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  let disconnected = false;
  try {
    const [config] = await db.select().from(settings).limit(1);
    disconnected = !!config?.devDisconnected;
  } catch {
    // If we can't reach the DB, fall through to the normal app — admins will
    // hit their own error states. We don't want a transient outage to look
    // like a dev disconnect.
    disconnected = false;
  }

  // Server-side gate: regular admins receive the disconnect screen as their
  // very first HTML response. No flash of the dashboard at all.
  if (disconnected && session?.role !== "super_admin") {
    return <DevDisconnectedScreen />;
  }

  return <DashboardShell>{children}</DashboardShell>;
}
