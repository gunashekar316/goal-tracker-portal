import { prisma } from "@/lib/prisma";
import { calculateScore } from "@/lib/scoreCalculator";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Fetch all approved goal sheets and their nested data
    const approvedSheets = await prisma.goalSheet.findMany({
      where: { status: "Approved" },
      include: {
        employee: true,
        goals: {
          include: {
            checkIns: {
              where: { quarter: "Q1" } // Just Q1 for the demo scope
            }
          }
        }
      }
    });

    // CSV Header
    let csvContent = "Employee Name,Thrust Area,Goal Title,UoM,Planned Target,Actual Achievement,Progress Score (%)\n";

    // Build Rows
    for (const sheet of approvedSheets) {
      for (const goal of sheet.goals) {
        const checkIn = goal.checkIns[0];
        
        const employeeName = `"${sheet.employee.name}"`;
        const thrustArea = `"${goal.thrustArea}"`;
        const title = `"${goal.title.replace(/"/g, '""')}"`; // Escape quotes
        const uom = `"${goal.unitOfMeasurement}"`;
        const target = `"${goal.target}"`;
        
        let actual = "Not Logged";
        let score = "0";

        if (checkIn) {
          actual = `"${checkIn.actualAchievement}"`;
          score = calculateScore(goal, checkIn.actualAchievement).toString();
        }

        csvContent += `${employeeName},${thrustArea},${title},${uom},${target},${actual},${score}\n`;
      }
    }

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=achievement_report.csv",
      },
    });
  } catch (error) {
    console.error("Failed to generate CSV:", error);
    return new NextResponse("Failed to generate CSV report", { status: 500 });
  }
}
