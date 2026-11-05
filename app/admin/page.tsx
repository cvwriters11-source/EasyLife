import type { Metadata } from "next";
import { AdminDesk } from "@/components/AdminDesk";
import { AdminLogin } from "@/components/AdminLogin";
import { adminConfigured, isAdmin } from "@/lib/admin-auth";
import { readRecords } from "@/lib/records";

export const metadata: Metadata = {
  title: "Admin desk",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) {
    return <AdminLogin configured={adminConfigured()} />;
  }
  const records = await readRecords();
  return <AdminDesk records={records} />;
}
