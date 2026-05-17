"use client";

import { useState } from "react";
import { updateAndApproveGoalSheet, returnGoalSheetForRework } from "@/actions/goals";
import { CheckCircle2, XCircle, ArrowLeft, Save, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function ManagerReviewForm({ sheet, onBack }: { sheet: any, onBack: () => void }) {
  const [editedGoals, setEditedGoals] = useState(sheet.goals);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalWeightage = editedGoals.reduce((sum: number, g: any) => sum + Number(g.weightage), 0);

  const handleGoalChange = (id: string, field: string, value: string | number) => {
    setEditedGoals((prev: any) =>
      prev.map((g: any) => (g.id === id ? { ...g, [field]: value } : g))
    );
    setError(null);
  };

  const handleApprove = async () => {
    if (totalWeightage !== 100) {
      toast.warning(`Total weightage must be exactly 100% before approving. Current: ${totalWeightage}%`);
      return;
    }
    
    setIsSubmitting(true);
    const result = await updateAndApproveGoalSheet(
      sheet.id, 
      editedGoals.map((g: any) => ({ id: g.id, target: String(g.target), weightage: g.weightage }))
    );
    
    if (result.success) {
      toast.success("Goal sheet approved successfully!");
      onBack();
    } else {
      toast.error(result.error || "Failed to approve");
      setError(result.error || "Failed to approve");
    }
    setIsSubmitting(false);
  };

  const handleReturn = async () => {
    setIsSubmitting(true);
    const result = await returnGoalSheetForRework(sheet.id);
    if (result.success) {
      toast.success("Goal sheet returned for rework");
      onBack();
    } else {
      toast.error(result.error || "Failed to return");
      setError(result.error || "Failed to return");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="bg-slate-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center text-white">
          <button onClick={onBack} className="mr-4 hover:bg-slate-700 p-2 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold">Review Goals: {sheet.employee?.name || "Employee"}</h2>
            <p className="text-slate-400 text-sm">Cycle: {sheet.cycle}</p>
          </div>
        </div>
        <div className={`text-sm font-bold px-4 py-1.5 rounded-full ${totalWeightage === 100 ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          Total Weight: {totalWeightage}%
        </div>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-100 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <div className="space-y-4">
          {editedGoals.map((goal: any) => (
            <div key={goal.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 border border-slate-200 rounded-xl bg-slate-50">
              <div className="md:col-span-6">
                <h4 className="font-semibold text-slate-800">{goal.title}</h4>
                <p className="text-sm text-slate-500">Thrust: {goal.thrustArea} • UoM: {goal.unitOfMeasurement}</p>
              </div>
              
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">Target</label>
                {goal.unitOfMeasurement === "Timeline" ? (
                  <input
                    type="date"
                    value={goal.target}
                    onChange={(e) => handleGoalChange(goal.id, 'target', e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                ) : goal.unitOfMeasurement === "Zero-based" ? (
                  <input
                    type="number"
                    value={0}
                    disabled
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-100 text-slate-500 outline-none"
                  />
                ) : (
                  <input
                    type="number"
                    step="0.1"
                    value={goal.target}
                    onChange={(e) => handleGoalChange(goal.id, 'target', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                )}
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">Weightage (%)</label>
                <input
                  type="number"
                  value={goal.weightage}
                  onChange={(e) => handleGoalChange(goal.id, 'weightage', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-slate-200 flex justify-between">
          <button
            onClick={handleReturn}
            disabled={isSubmitting}
            className="flex items-center px-6 py-2.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 font-medium transition-colors"
          >
            <XCircle className="h-5 w-5 mr-2" />
            Return for Rework
          </button>
          
          <button
            onClick={handleApprove}
            disabled={isSubmitting || totalWeightage !== 100}
            className="flex items-center px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium transition-colors shadow-lg shadow-emerald-200"
          >
            <CheckCircle2 className="h-5 w-5 mr-2" />
            {isSubmitting ? "Processing..." : "Approve Goals"}
          </button>
        </div>
      </div>
    </div>
  );
}
