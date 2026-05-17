"use client";

import { useState } from "react";
import { submitCheckIn } from "@/actions/checkins";
import { calculateScore } from "@/lib/scoreCalculator";
import { Save, ArrowLeft, Target, CalendarDays, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function EmployeeCheckInForm({ sheet, onBack }: { sheet: any, onBack: () => void }) {
  const [activeGoal, setActiveGoal] = useState<any>(sheet.goals[0]);
  const [actual, setActual] = useState("");
  const [status, setStatus] = useState("On Track");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const score = calculateScore(activeGoal, actual);
  
  // Check if a checkin exists for this quarter (for demo simplicity, we assume Q1)
  const existingCheckIn = activeGoal.checkIns?.find((c: any) => c.quarter === "Q1");

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const result = await submitCheckIn({
      goalId: activeGoal.id,
      quarter: "Q1",
      actualAchievement: actual,
      status,
    });
    
    if (result.success) {
      toast.success("Check-in logged successfully!");
      onBack();
    } else {
      toast.error("Failed to submit check-in");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center text-white">
          <button onClick={onBack} className="mr-4 hover:bg-indigo-500 p-2 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold">Quarterly Check-In (Q1)</h2>
            <p className="text-indigo-200 text-sm">Cycle: {sheet.cycle}</p>
          </div>
        </div>
      </div>

      <div className="flex border-b border-slate-200">
        {sheet.goals.map((goal: any, idx: number) => (
          <button
            key={goal.id}
            onClick={() => {
              setActiveGoal(goal);
              setActual("");
            }}
            className={`px-6 py-4 font-medium text-sm transition-colors border-b-2 ${
              activeGoal.id === goal.id ? "border-indigo-600 text-indigo-700 bg-indigo-50" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            Goal {idx + 1}
          </button>
        ))}
      </div>

      <div className="p-6">
        {existingCheckIn ? (() => {
          const completedScore = calculateScore(activeGoal, existingCheckIn.actualAchievement);
          return (
          <div className="text-center py-12">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800">Check-in Complete</h3>
            <p className="text-slate-500 mt-2">You have already logged your progress for this goal for Q1.</p>
            
            <div className="mt-8 max-w-lg mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 grid grid-cols-2 gap-6 border-b border-slate-100">
                <div>
                  <p className="text-sm text-slate-500 mb-1 font-medium">Target</p>
                  <p className="text-lg font-bold text-slate-800">{activeGoal.target}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1 font-medium">Actual Logged</p>
                  <p className="text-lg font-bold text-slate-800">{existingCheckIn.actualAchievement}</p>
                </div>
              </div>
              <div className="p-6 bg-slate-50 flex items-center justify-between">
                <div className="text-left">
                  <p className="text-sm text-slate-500 mb-1 font-medium">Status</p>
                  <p className="text-sm font-bold text-slate-800">{existingCheckIn.status}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500 mb-1 font-medium">Progress Score</p>
                  <span className={`inline-block px-4 py-1.5 rounded-full text-lg font-black ${completedScore === 100 ? 'bg-emerald-100 text-emerald-700' : completedScore >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                    {completedScore}%
                  </span>
                </div>
              </div>
            </div>

            {existingCheckIn.managerComment && (
              <div className="mt-6 max-w-lg mx-auto bg-indigo-50 border border-indigo-100 p-6 rounded-xl text-left">
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Manager Feedback</p>
                <p className="text-indigo-900 italic font-medium">"{existingCheckIn.managerComment}"</p>
              </div>
            )}
          </div>
          );
        })() : (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-2">{activeGoal.title}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                <div>
                  <span className="text-slate-500 block mb-1">Unit of Measurement</span>
                  <span className="font-semibold px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700">{activeGoal.unitOfMeasurement}</span>
                </div>
                {activeGoal.trackingType && (
                  <div>
                    <span className="text-slate-500 block mb-1">Tracking Type</span>
                    <span className="font-semibold px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700">{activeGoal.trackingType}</span>
                  </div>
                )}
                <div className="col-span-2 mt-2">
                  <span className="text-slate-500 block mb-1">Target</span>
                  <span className="text-lg font-bold text-indigo-700">{activeGoal.target}</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Log Actual Achievement</label>
                {activeGoal.unitOfMeasurement === "Timeline" ? (
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                    <input
                      type="date"
                      value={actual}
                      onChange={(e) => setActual(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                ) : activeGoal.unitOfMeasurement === "Zero-based" ? (
                  <input
                    type="number"
                    value={actual}
                    onChange={(e) => setActual(e.target.value)}
                    placeholder="Enter incidents/errors"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                ) : (
                  <input
                    type="number"
                    value={actual}
                    onChange={(e) => setActual(e.target.value)}
                    placeholder={`Enter actual ${activeGoal.unitOfMeasurement === "%" ? "percentage" : "value"}`}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Current Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Not Started">Not Started</option>
                  <option value="On Track">On Track</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
                <span className="block text-sm font-medium text-emerald-800 mb-1">Computed Progress Score</span>
                <span className="text-4xl font-black text-emerald-600">{actual ? score : 0}%</span>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !actual}
                  className="flex items-center px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold transition-colors shadow-lg shadow-indigo-200"
                >
                  <Save className="h-5 w-5 mr-2" />
                  {isSubmitting ? "Saving..." : "Submit Check-In"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
