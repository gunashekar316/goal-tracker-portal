"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, Save, X } from "lucide-react";
import { useState, useEffect } from "react";
import { getActiveSharedKPIs } from "@/actions/goals";
import { toast } from "sonner";

// Base goal schema
const baseGoalSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  thrustArea: z.string().min(1, "Thrust area is required"),
  weightage: z.number({ message: "Weightage must be a number" }).min(10, "Minimum weightage is 10%"),
  sharedKpiId: z.string().optional().nullable(),
});

// Discriminated union for UoM logic
const goalSchema = z.discriminatedUnion("unitOfMeasurement", [
  baseGoalSchema.extend({
    unitOfMeasurement: z.literal("Numeric"),
    trackingType: z.enum(["Min (Higher is better)", "Max (Lower is better)"], { message: "Tracking type is required" }),
    target: z.union([z.number(), z.string().transform((val) => Number(val))]).refine((val) => !isNaN(Number(val)), { message: "Target must be a number" }),
  }),
  baseGoalSchema.extend({
    unitOfMeasurement: z.literal("%"),
    trackingType: z.enum(["Min (Higher is better)", "Max (Lower is better)"], { message: "Tracking type is required" }),
    target: z.union([z.number(), z.string().transform((val) => Number(val))]).refine((val) => !isNaN(Number(val)), { message: "Target must be a number" }),
  }),
  baseGoalSchema.extend({
    unitOfMeasurement: z.literal("Timeline"),
    trackingType: z.literal("").optional().nullable(),
    target: z.string().min(1, "Date is required"),
  }),
  baseGoalSchema.extend({
    unitOfMeasurement: z.literal("Zero-based"),
    trackingType: z.literal("").optional().nullable(),
    target: z.union([z.number(), z.string()]).transform(() => "0"),
  }),
]);

const goalSheetSchema = z.object({
  cycle: z.string().min(1, "Cycle is required (e.g., Q1 2024)"),
  goals: z.array(goalSchema)
    .min(1, "You must add at least one goal")
    .max(8, "Maximum of 8 goals allowed")
    .refine((goals) => {
      const totalWeightage = goals.reduce((sum, goal) => sum + (goal.weightage || 0), 0);
      return totalWeightage === 100;
    }, {
      message: "Total weightage of all goals must exactly equal 100%",
    }),
});

type GoalSheetFormValues = z.input<typeof goalSheetSchema>;

export default function GoalForm({ onCancel }: { onCancel: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeKpis, setActiveKpis] = useState<any[]>([]);

  useEffect(() => {
    getActiveSharedKPIs().then(res => {
      if (res.success && res.data) setActiveKpis(res.data);
    });
  }, []);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GoalSheetFormValues>({
    resolver: zodResolver(goalSheetSchema),
    defaultValues: {
      cycle: "Q1 2024",
      goals: [{ title: "", thrustArea: "Quality", unitOfMeasurement: "%", trackingType: "Min (Higher is better)", target: 0, weightage: 10 }] as any,
    },
  });

  const { fields, append, remove } = useFieldArray({
    name: "goals",
    control,
  });

  const watchGoals = watch("goals") || [];
  const totalWeightage = watchGoals.reduce((sum, goal) => sum + (Number(goal?.weightage) || 0), 0);

  const onSubmit = async (data: GoalSheetFormValues) => {
    setIsSubmitting(true);
    try {
      const { submitGoalSheet } = await import("@/actions/goals");
      const formattedData = {
        ...data,
        goals: data.goals.map(g => ({
          ...g,
          target: String(g.target),
          trackingType: (g.unitOfMeasurement === "Numeric" || g.unitOfMeasurement === "%") ? g.trackingType : undefined,
        }))
      };
      
      const result = await submitGoalSheet(formattedData as any);
      
      if (result.success) {
        toast.success("Goals successfully submitted for Manager approval!");
        onCancel();
      } else {
        toast.error("Failed to submit goals: " + result.error);
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitError = (errors: any) => {
    console.log("Zod Errors:", errors);
    if (errors.goals?.root?.message) {
      toast.warning(errors.goals.root.message);
    } else {
      toast.error("Please fix the validation errors in the form.");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
      <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Create Goal Sheet</h2>
        <button onClick={onCancel} className="text-indigo-100 hover:text-white transition-colors">
          <X className="h-6 w-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onSubmitError)} className="p-6 space-y-8">
        
        {/* Goal Sheet Metadata */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Cycle</label>
          <input
            {...register("cycle")}
            className="w-full max-w-xs px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            placeholder="e.g., Q1 2024"
          />
          {errors.cycle && <p className="text-red-500 text-xs mt-1">{errors.cycle.message}</p>}
        </div>

        {/* Dynamic Goal List */}
        <div className="space-y-6">
          <div className="flex justify-between items-end border-b border-slate-200 pb-2">
            <h3 className="text-lg font-semibold text-slate-800">Your Goals</h3>
            <div className={`text-sm font-bold px-3 py-1 rounded-full ${totalWeightage === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              Total Weightage: {totalWeightage}%
            </div>
          </div>

          {fields.map((field, index) => {
            const currentUoM = watchGoals[index]?.unitOfMeasurement || "Numeric";
            const needsTrackingType = currentUoM === "Numeric" || currentUoM === "%";
            
            // Auto-fill zero-based target
            if (currentUoM === "Zero-based" && watchGoals[index]?.target !== 0) {
              setTimeout(() => setValue(`goals.${index}.target` as any, 0), 0);
            }

            return (
              <div key={field.id} className="p-5 border border-slate-200 rounded-xl bg-slate-50 relative animate-in fade-in slide-in-from-top-2">
                <div className="absolute top-4 right-4">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1 text-indigo-600">Import Company KPI (Optional)</label>
                  <input type="hidden" {...register(`goals.${index}.sharedKpiId` as const)} />
                  <select 
                    value={watchGoals[index]?.sharedKpiId || ""}
                    onChange={(e) => {
                      const kpiId = e.target.value;
                      setValue(`goals.${index}.sharedKpiId` as any, kpiId || null, { shouldValidate: true, shouldDirty: true });
                      if (kpiId) {
                        const kpi = activeKpis.find(k => k.id === kpiId);
                        if (kpi) {
                          setValue(`goals.${index}.title` as any, kpi.title, { shouldValidate: true, shouldDirty: true });
                          setValue(`goals.${index}.thrustArea` as any, kpi.thrustArea, { shouldValidate: true, shouldDirty: true });
                          setValue(`goals.${index}.unitOfMeasurement` as any, kpi.uom, { shouldValidate: true, shouldDirty: true });
                          setValue(`goals.${index}.trackingType` as any, kpi.trackingType || null, { shouldValidate: true, shouldDirty: true });
                          
                          // Format target
                          let targetValue: any = Number(kpi.target);
                          if (kpi.uom === "Timeline") {
                            targetValue = kpi.target.split('T')[0];
                          } else if (kpi.uom === "Zero-based") {
                            targetValue = kpi.target;
                          }
                          setValue(`goals.${index}.target` as any, targetValue, { shouldValidate: true, shouldDirty: true });
                        }
                      }
                    }}
                    className="w-full px-4 py-2 border border-indigo-200 bg-indigo-50/30 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">-- Custom Personal Goal --</option>
                    {activeKpis.map(kpi => (
                      <option key={kpi.id} value={kpi.id}>{kpi.title}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Goal Title</label>
                    <input
                      {...register(`goals.${index}.title` as const)}
                      readOnly={!!watchGoals[index]?.sharedKpiId}
                      className={`w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${watchGoals[index]?.sharedKpiId ? 'bg-slate-100 text-slate-500 cursor-not-allowed pointer-events-none' : ''}`}
                    />
                    {errors.goals?.[index]?.title && <p className="text-red-500 text-xs mt-1">{errors.goals[index]?.title?.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Thrust Area</label>
                    <select
                      {...register(`goals.${index}.thrustArea` as const)}
                      className={`w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${watchGoals[index]?.sharedKpiId ? 'bg-slate-100 text-slate-500 cursor-not-allowed pointer-events-none' : ''}`}
                    >
                      <option value="Quality">Quality</option>
                      <option value="Delivery">Delivery</option>
                      <option value="Cost">Cost</option>
                      <option value="Innovation">Innovation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Unit of Measurement</label>
                    <select
                      {...register(`goals.${index}.unitOfMeasurement` as const)}
                      className={`w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${watchGoals[index]?.sharedKpiId ? 'bg-slate-100 text-slate-500 cursor-not-allowed pointer-events-none' : ''}`}
                      onChange={(e) => {
                        const val = e.target.value;
                        setValue(`goals.${index}.unitOfMeasurement` as any, val);
                        if (val === "Numeric" || val === "%") {
                          setValue(`goals.${index}.trackingType` as any, "Min (Higher is better)");
                        } else {
                          setValue(`goals.${index}.trackingType` as any, null);
                        }
                      }}
                    >
                      <option value="Numeric">Numeric</option>
                      <option value="%">%</option>
                      <option value="Timeline">Timeline</option>
                      <option value="Zero-based">Zero-based</option>
                    </select>
                  </div>

                  {needsTrackingType && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tracking Type</label>
                      <select
                        {...register(`goals.${index}.trackingType` as const)}
                        className={`w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${watchGoals[index]?.sharedKpiId ? 'bg-slate-100 text-slate-500 cursor-not-allowed pointer-events-none' : ''}`}
                      >
                        <option value="Min (Higher is better)">Min (Higher is better)</option>
                        <option value="Max (Lower is better)">Max (Lower is better)</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Target</label>
                    {currentUoM === "Timeline" ? (
                      <input
                        type="date"
                        {...register(`goals.${index}.target` as const)}
                        readOnly={!!watchGoals[index]?.sharedKpiId}
                        className={`w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${watchGoals[index]?.sharedKpiId ? 'bg-slate-100 text-slate-500 cursor-not-allowed pointer-events-none' : ''}`}
                      />
                    ) : (
                      <input
                        type={currentUoM === "Zero-based" ? "text" : "number"}
                        {...register(`goals.${index}.target` as const)}
                        readOnly={currentUoM === "Zero-based" || !!watchGoals[index]?.sharedKpiId}
                        className={`w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${currentUoM === "Zero-based" || watchGoals[index]?.sharedKpiId ? 'bg-slate-100 text-slate-500 cursor-not-allowed pointer-events-none' : ''}`}
                      />
                    )}
                    {errors.goals?.[index]?.target && <p className="text-red-500 text-xs mt-1">{errors.goals[index]?.target?.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Weightage (%)</label>
                    <input
                      type="number"
                      {...register(`goals.${index}.weightage` as const, { valueAsNumber: true })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    {errors.goals?.[index]?.weightage && <p className="text-red-500 text-xs mt-1">{errors.goals[index]?.weightage?.message}</p>}
                  </div>
                </div>
              </div>
            );
          })}

          {fields.length < 8 && (
            <button
              type="button"
              onClick={() => append({ title: "", thrustArea: "Quality", unitOfMeasurement: "%", trackingType: "Min (Higher is better)", target: 0, weightage: 10 } as any)}
              className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Another Goal
            </button>
          )}
          {fields.length >= 8 && (
            <p className="text-sm text-amber-600 italic">Maximum of 8 goals reached.</p>
          )}
        </div>

        <div className="pt-6 border-t border-slate-200 flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium transition-colors shadow-lg shadow-indigo-200"
          >
            {isSubmitting ? "Submitting..." : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Submit Goals
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
