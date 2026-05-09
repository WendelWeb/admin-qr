import { db } from "@/db";
import { settings } from "@/db/schema";
import DevDisconnectedScreen from "@/components/DevDisconnectedScreen";
import LoginForm from "./_form";

// Always read the live disconnect flag — never serve a cached login page.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LoginPage() {
  let disconnected = false;
  try {
    const [config] = await db.select().from(settings).limit(1);
    disconnected = !!config?.devDisconnected;
  } catch {
    disconnected = false;
  }

  if (disconnected) {
    return <DevDisconnectedScreen />;
  }

  return <LoginForm />;
}
