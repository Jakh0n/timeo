import { api } from "@/lib/api";

export type Branch = {
  id: string;
  name: string;
  address: string;
};

export const branchesQueryKey = ["branches"] as const;

export function fetchBranches(): Promise<Branch[]> {
  return api<Branch[]>("/api/branches");
}

export function createBranch(input: {
  name: string;
  address: string;
}): Promise<Branch> {
  return api<Branch>("/api/branches", { method: "POST", body: input });
}

export function updateBranch(
  branchId: string,
  input: { name: string; address: string },
): Promise<Branch> {
  return api<Branch>(`/api/branches/${branchId}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteBranch(branchId: string): Promise<void> {
  return api<void>(`/api/branches/${branchId}`, { method: "DELETE" });
}
