"use client";

import { useState } from "react";
import { addManagerComment } from "@/actions/checkins";
import { calculateScore } from "@/lib/scoreCalculator";
import { Save, ArrowLeft, Target, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export default function ManagerCheckInReview({ sheet, onBack }: { sheet: any, onBack: () => void }) {
  const [comments, setComments] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});

  const handleCommentSubmit = async (checkInId: string) => {
    setIsSubmitting(prev => ({ ...prev, [checkInId]: true }));
    const result = await addManagerComment(checkInId, comments[checkInId] || "");
    
    if (result.success) {
      toast.success("Comment saved successfully!");
    } else {
      toast.error("Failed to save comment");
    }
    setIsSubmitting(prev => ({ ...prev, [checkInId]: false }));
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="bg-slate-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center text-white">
          <button onClick={onBack} className="mr-4 hover:bg-slate-700 p-2 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold">Review Check-Ins: {sheet.employee?.name || "Employee"}</h2>
            <p className="text-slate-400 text-sm">Cycle: {sheet.cycle}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {sheet.goals.map((goal: any, idx: number) => {
          const checkIn = goal.checkIns?.[0]; // Assuming Q1 for demo
          const score = checkIn ? calculateScore(goal, checkIn.actualAchievement) : null;

          return (
            <div key={goal.id} className="border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-800">Goal {idx + 1}: {goal.title}</h4>
                  <p className="text-sm text-slate-500">Target: {goal.target} {goal.unitOfMeasurement !== "Numeric" && goal.unitOfMeasurement !== "Zero-based" && goal.unitOfMeasurement !== "Timeline" ? goal.unitOfMeasurement : ""}</p>
                </div>
                {checkIn ? (
                  <div className="text-right w-32">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Score</span>
                    <span className={`text-2xl font-black ${score === 100 ? "text-emerald-600" : score && score >= 50 ? "text-amber-500" : "text-red-500"}`}>
                      {score}%
                    </span>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                      <div className={`h-1.5 rounded-full ${score === 100 ? "bg-emerald-500" : score && score >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${Math.min(score || 0, 100)}%` }}></div>
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-slate-400 italic">No check-in yet</span>
                )}
              </div>

              {checkIn && (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Employee Update</h5>
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <p className="text-sm text-slate-500 mb-1">Status: <strong className="text-slate-800">{checkIn.status}</strong></p>
                      <p className="text-sm text-slate-500">Actual Achievement: <strong className="text-slate-800">{checkIn.actualAchievement}</strong></p>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Manager Comment
                    </h5>
                    <div className="space-y-2">
                      <textarea
                        defaultValue={checkIn.managerComment || ""}
                        onChange={(e) => setComments(prev => ({ ...prev, [checkIn.id]: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm min-h-[80px]"
                        placeholder="Add constructive feedback..."
                      />
                      <button
                        onClick={() => handleCommentSubmit(checkIn.id)}
                        disabled={isSubmitting[checkIn.id] || comments[checkIn.id] === undefined}
                        className="text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors w-full flex justify-center items-center"
                      >
                        {isSubmitting[checkIn.id] ? "Saving..." : "Save Comment"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
