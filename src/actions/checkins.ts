"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "./audit";

export async function submitCheckIn(data: {
  goalId: string;
  quarter: string;
  actualAchievement: string;
  status: string;
}) {
  try {
    await prisma.checkIn.create({
      data: {
        goalId: data.goalId,
        quarter: data.quarter,
        actualAchievement: data.actualAchievement,
        status: data.status,
      },
    });

    const goal = await prisma.goal.findUnique({ where: { id: data.goalId } });

    if (goal) {
      await createAuditLog({
        action: `Logged Quarterly Check-In (${data.quarter})`,
        performedByRole: "Employee",
        performedByName: "Demo Employee",
        targetSheetId: goal.goalSheetId,
      });
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to submit check-in:", error);
    return { success: false, error: "Failed to submit check-in." };
  }
}

export async function addManagerComment(checkInId: string, managerComment: string) {
  try {
    await prisma.checkIn.update({
      where: { id: checkInId },
      data: { managerComment },
    });

    const checkIn = await prisma.checkIn.findUnique({
      where: { id: checkInId },
      include: { goal: true }
    });

    if (checkIn && checkIn.goal) {
      await createAuditLog({
        action: "Added Check-in Feedback",
        performedByRole: "Manager (L1)",
        performedByName: "Demo Manager",
        targetSheetId: checkIn.goal.goalSheetId,
      });
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to add manager comment:", error);
    return { success: false, error: "Failed to add manager comment." };
  }
}
