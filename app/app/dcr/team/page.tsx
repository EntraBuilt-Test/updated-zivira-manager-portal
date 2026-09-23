import { redirect } from "next/navigation";

// This route duplicated the already fully backend-wired Team DCRs page at
// /manager/dcrs (real apiClient.dcrs() data, approve/reject actions).
// Redirect here instead of showing a second, fake-data copy.
export default function TeamDcrPage() {
  redirect("/manager/dcrs");
}
