import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin-dashboard";

export const metadata: Metadata = { title: "Painel de gestão", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function AdminPage() {
  return <AdminDashboard />;
}
