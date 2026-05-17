"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "./audit";

export async function getAdminDashboardData() {
  try {
    const employees = await prisma.user.findMany({
      where: { role: "Employee" },
      include: {
        goalSheets: {
          orderBy: { createdAt: "desc" },
          take: 1, // Get the latest goal sheet for the dashboard
          include: {
            goals: {
              include: { checkIns: true }
            }
          }
        }
      }
    });

    const formattedData = employees.map(emp => {
      const sheet = emp.goalSheets[0];
      let goalStatus = "Not Submitted";
      let checkInStatus = "Pending";
      let sheetId = null;

      if (sheet) {
        goalStatus = sheet.status;
        sheetId = sheet.id;
        
        // If approved, check if they have completed Q1 checkins
        if (sheet.status === "Approved") {
          const hasQ1CheckIns = sheet.goals.some(g => g.checkIns.some(c => c.quarter === "Q1"));
          if (hasQ1CheckIns) {
            checkInStatus = "Completed";
          }
        }
      }

      return {
        id: emp.id,
        name: emp.name,
        goalStatus,
        checkInStatus,
        sheetId
      };
    });

    return { success: true, data: formattedData };
  } catch (error) {
    console.error("Failed to fetch admin data:", error);
    return { success: false, error: "Failed to fetch admin data" };
  }
}

export async function unlockGoalSheet(sheetId: string) {
  try {
    await prisma.goalSheet.update({
      where: { id: sheetId },
      data: { status: "Draft" }
    });
    await createAuditLog({
      action: "Unlocked Goal Sheet (Override)",
      performedByRole: "Admin",
      performedByName: "System Admin",
      targetSheetId: sheetId,
    });
    
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to unlock goal sheet:", error);
    return { success: false, error: "Failed to unlock goal sheet" };
  }
}

export async function getSystemAuditLogs() {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: logs };
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    return { success: false, error: "Failed to fetch audit logs" };
  }
}

export async function createSharedKPI(data: {
  title: string;
  thrustArea: string;
  uom: string;
  trackingType?: string | null;
  target: string;
}) {
  try {
    const kpi = await prisma.sharedKPI.create({
      data: {
        title: data.title,
        thrustArea: data.thrustArea,
        uom: data.uom,
        trackingType: data.trackingType || null,
        target: data.target,
      }
    });
    
    await createAuditLog({
      action: "Created Company KPI",
      performedByRole: "Admin",
      performedByName: "System Admin",
      targetSheetId: kpi.id, // Using KPI ID as target for now
    });

    revalidatePath("/");
    return { success: true, data: kpi };
  } catch (error) {
    console.error("Failed to create KPI:", error);
    return { success: false, error: "Failed to create KPI" };
  }
}

export async function getSharedKPIs(activeOnly: boolean = false) {
  try {
    const kpis = await prisma.sharedKPI.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: kpis };
  } catch (error) {
    console.error("Failed to fetch KPIs:", error);
    return { success: false, error: "Failed to fetch KPIs" };
  }
}

export async function toggleSharedKPIStatus(id: string, isActive: boolean) {
  try {
    await prisma.sharedKPI.update({
      where: { id },
      data: { isActive },
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle KPI status:", error);
    return { success: false, error: "Failed to toggle KPI status" };
  }
}
