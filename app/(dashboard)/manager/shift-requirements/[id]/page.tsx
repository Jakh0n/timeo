import { ShiftRequirementDetail } from "@/components/dashboard/shift-requirement-detail";

export default async function ManagerShiftRequirementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ShiftRequirementDetail requirementId={id} />;
}
