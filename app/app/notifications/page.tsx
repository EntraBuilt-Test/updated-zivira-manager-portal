import { redirect } from "next/navigation";

// This route duplicated the already fully backend-wired Notifications
// page at /manager/notifications (real apiClient.notices() data). Redirect
// here instead of showing a second, fake-data copy.
export default function NotificationsPage() {
  redirect("/manager/notifications");
}
