import type { Metadata } from "next";
import { AccountDashboard } from "@/components/account-dashboard";

export const metadata: Metadata = { title: "Minha conta", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ phone?: string }> }) {
  const { phone = "" } = await searchParams;
  return <AccountDashboard phone={phone} />;
}
