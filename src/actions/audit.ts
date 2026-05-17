"use server";

import { prisma } from "@/lib/prisma";

export async function createAuditLog({
  action,
  performedByRole,
  performedByName,
  targetSheetId
}: {
  action: string;
  performedByRole: string;
  performedByName: string;
  targetSheetId: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        performedByRole,
        performedByName,
        targetSheetId
      }
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}
