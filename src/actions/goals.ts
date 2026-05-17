"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "./audit";

export async function submitGoalSheet(data: {
  cycle: string;
  goals: {
    title: string;
    description?: string;
    thrustArea: string;
    unitOfMeasurement: string;
    trackingType?: string | null;
    target: number | string;
    weightage: number;
    sharedKpiId?: string | null;
  }[];
}) {
  try {
    // Upsert a mock Employee user since we don't have real auth yet
    const employee = await prisma.user.upsert({
      where: { id: "mock-employee-id" }, // Using a fixed ID for the demo
      update: {},
      create: {
        id: "mock-employee-id",
        name: "Demo Employee",
        role: "Employee",
      },
    });

    // Create GoalSheet and nested Goals
    const goalSheet = await prisma.goalSheet.create({
      data: {
        cycle: data.cycle,
        status: "Submitted",
        employeeId: employee.id,
        goals: {
          create: data.goals.map(goal => ({
            title: goal.title,
            description: goal.description,
            thrustArea: goal.thrustArea,
            unitOfMeasurement: goal.unitOfMeasurement,
            trackingType: goal.trackingType,
            target: String(goal.target),
            weightage: goal.weightage,
            sharedKpiId: goal.sharedKpiId || null,
          })),
        },
      },
    });

    revalidatePath("/"); // Force Next.js to refresh data on the home page
    
    await createAuditLog({
      action: "Submitted Goal Sheet",
      performedByRole: "Employee",
      performedByName: "Demo Employee",
      targetSheetId: goalSheet.id,
    });
    
    return { success: true, goalSheetId: goalSheet.id };
  } catch (error) {
    console.error("Failed to submit goals:", error);
    return { success: false, error: "Failed to submit goals." };
  }
}

export async function getEmployeeGoalSheet() {
  try {
    const sheet = await prisma.goalSheet.findFirst({
      where: { employeeId: "mock-employee-id" },
      orderBy: { createdAt: "desc" },
      include: { goals: { include: { checkIns: true } } },
    });
    return { success: true, data: sheet };
  } catch (error) {
    console.error("Failed to fetch goals:", error);
    return { success: false, error: "Failed to fetch goals." };
  }
}

export async function getPendingGoalSheets() {
  try {
    const sheets = await prisma.goalSheet.findMany({
      where: { status: "Submitted" },
      include: {
        employee: true,
        goals: true
      },
      orderBy: { createdAt: "asc" }
    });
    return { success: true, data: sheets };
  } catch (error) {
    console.error("Failed to fetch pending sheets:", error);
    return { success: false, error: "Failed to fetch pending sheets." };
  }
}

export async function getApprovedGoalSheets() {
  try {
    const sheets = await prisma.goalSheet.findMany({
      where: { status: "Approved" },
      include: {
        employee: true,
        goals: {
          include: { checkIns: true }
        }
      },
      orderBy: { createdAt: "asc" }
    });
    return { success: true, data: sheets };
  } catch (error) {
    console.error("Failed to fetch approved sheets:", error);
    return { success: false, error: "Failed to fetch approved sheets." };
  }
}

export async function updateAndApproveGoalSheet(
  sheetId: string,
  updatedGoals: { id: string, target: string, weightage: number }[]
) {
  try {
    // Basic validation
    const totalWeight = updatedGoals.reduce((sum, g) => sum + g.weightage, 0);
    if (totalWeight !== 100) {
      return { success: false, error: "Total weightage must be exactly 100%." };
    }

    // Transaction to update goals and approve sheet
    let edited = false;
    await prisma.$transaction(async (tx) => {
      const originalSheet = await tx.goalSheet.findUnique({ where: { id: sheetId }, include: { goals: true } });
      if (originalSheet) {
        for (const originalGoal of originalSheet.goals) {
          const updatedGoal = updatedGoals.find(g => g.id === originalGoal.id);
          if (updatedGoal && (String(updatedGoal.target) !== originalGoal.target || updatedGoal.weightage !== originalGoal.weightage)) {
            edited = true; break;
          }
        }
      }

      for (const goal of updatedGoals) {
        await tx.goal.update({
          where: { id: goal.id },
          data: { target: String(goal.target), weightage: goal.weightage }
        });
      }

      await tx.goalSheet.update({
        where: { id: sheetId },
        data: { status: "Approved" }
      });
    });

    await createAuditLog({
      action: edited ? "Approved Goal Sheet (with manager edits)" : "Approved Goal Sheet",
      performedByRole: "Manager (L1)",
      performedByName: "Demo Manager",
      targetSheetId: sheetId,
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to approve sheet:", error);
    return { success: false, error: "Failed to approve sheet." };
  }
}

export async function getActiveSharedKPIs() {
  try {
    const kpis = await prisma.sharedKPI.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: kpis };
  } catch (error) {
    console.error("Failed to fetch KPIs:", error);
    return { success: false, error: "Failed to fetch KPIs" };
  }
}

export async function getTeamMembersCount() {
  try {
    const count = await prisma.user.count({
      where: {
        role: "Employee",
        goalSheets: { some: {} }
      }
    });
    return { success: true, count };
  } catch (error) {
    console.error("Failed to fetch team members count:", error);
    return { success: false, count: 0 };
  }
}

export async function returnGoalSheetForRework(sheetId: string) {
  try {
    await prisma.goalSheet.update({
      where: { id: sheetId },
      data: { status: "Draft" }
    });
    
    await createAuditLog({
      action: "Returned Goal Sheet for Rework",
      performedByRole: "Manager (L1)",
      performedByName: "Demo Manager",
      targetSheetId: sheetId,
    });
    
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to return sheet:", error);
    return { success: false, error: "Failed to return sheet." };
  }
}
