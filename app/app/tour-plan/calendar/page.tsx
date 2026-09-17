import { redirect } from "next/navigation";

// This route duplicated the already fully backend-wired Tour Plans page
// at /manager/tour-plans (real apiClient.tourPlans() data, approve/reject/
// reassign actions). Redirect here instead of showing a second, fake-data
// copy.
export default function TourPlanPage() {
  redirect("/manager/tour-plans");
}
