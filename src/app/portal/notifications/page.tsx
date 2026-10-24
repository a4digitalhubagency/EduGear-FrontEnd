import type { Metadata } from "next";
import { PortalNotifications } from "@/components/portal/PortalNotifications";

export const metadata: Metadata = { title: "EduGear - Notifications" };

export default function PortalNotificationsPage() {
  return <PortalNotifications />;
}
