import type { Role } from "@prisma/client";

// Fixed per-member charges, ported verbatim from the original design's logic script.
export const DUES_AMOUNT = 1000;
// The member hosting a given meeting pays this elevated rate instead of DUES_AMOUNT.
export const HOST_DUES_AMOUNT = 5000;
export const LATE_FEE = 100;
export const DEFAULT_LEVY_AMOUNT = 5000;

/** The amount a member owes/paid for a meeting, given whether they're its host. */
export function dueAmountFor(isHost: boolean, late: boolean) {
  return (isHost ? HOST_DUES_AMOUNT : DUES_AMOUNT) + (late ? LATE_FEE : 0);
}

export const AVATAR_COLORS = [
  "#C1622D",
  "#2F4B3C",
  "#D9A441",
  "#7A5C3E",
  "#9C4D21",
  "#4B7B4F",
  "#B8860B",
  "#6B4226",
];

export const ROLE_LABELS: Record<Role, string> = {
  CHAIRMAN: "Chairman",
  FINSEC: "Fin-Sec",
  SECRETARY: "Secretary",
  MEMBER: "Member",
};

export const ROLE_OPTIONS: Role[] = ["CHAIRMAN", "FINSEC", "SECRETARY", "MEMBER"];

export function canRecordPayments(role: Role | undefined) {
  return role === "CHAIRMAN" || role === "FINSEC";
}
export function canManageLevies(role: Role | undefined) {
  return role === "CHAIRMAN" || role === "FINSEC";
}
export function canManageMembers(role: Role | undefined) {
  return role === "CHAIRMAN" || role === "FINSEC";
}
export function canCreateMeeting(role: Role | undefined) {
  return role === "CHAIRMAN" || role === "FINSEC";
}
export function canUploadMinutes(role: Role | undefined) {
  return role === "CHAIRMAN" || role === "SECRETARY";
}
