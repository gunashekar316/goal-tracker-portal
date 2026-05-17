"use client";

import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { PlusCircle, Target, Users, LayoutDashboard, CheckCircle2, Activity } from "lucide-react";
import { useState } from "react";
import GoalForm from "@/components/GoalForm";

export const dynamic = 'force-dynamic';

export default function Dashboard() {
  const { role } = useAuth();

  return (
    <div className="flex-1 w-full bg-slate-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Header Section */}
        <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">
            Welcome back, {role}!
          </h1>
          <p className="text-slate-500 text-lg">
            Here is what is happening with your goals today.
          </p>
        </div>

        {/* Dynamic Content based on Role */}
        {role === "Employee" && <EmployeeView />}
        {role === "Manager (L1)" && <ManagerView />}
        {role === "Admin" && <AdminView />}

      </div>
    </div>
  );
}

import { useEffect, useCallback } from "react";
import { getEmployeeGoalSheet, getPendingGoalSheets, getApprovedGoalSheets, getTeamMembersCount } from "@/actions/goals";
import EmployeeCheckInForm from "@/components/EmployeeCheckInForm";
import ManagerReviewForm from "@/components/ManagerReviewForm";
import ManagerCheckInReview from "@/components/ManagerCheckInReview";
import { calculateScore } from "@/lib/scoreCalculator";

function EmployeeView() {
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [goalSheet, setGoalSheet] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    setIsLoading(true);
    const result = await getEmployeeGoalSheet();
    if (result.success && result.data) {
      setGoalSheet(result.data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  if (showGoalForm) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
        <GoalForm onCancel={() => {
          setShowGoalForm(false);
          fetchGoals();
        }} />
      </div>
    );
  }

  if (showCheckInForm && goalSheet) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
        <EmployeeCheckInForm sheet={goalSheet} onBack={() => {
          setShowCheckInForm(false);
          fetchGoals();
        }} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-200 h-28 rounded-2xl"></div>
          <div className="bg-slate-200 h-28 rounded-2xl"></div>
          <div className="bg-slate-200 h-28 rounded-2xl"></div>
        </div>
        <div className="bg-slate-200 h-64 rounded-2xl"></div>
      </div>
    );
  }

  const hasSubmitted = !!goalSheet;
  const activeGoalsCount = goalSheet?.goals?.length || 0;
  const hasGoals = activeGoalsCount > 0;
  const isApproved = hasGoals && goalSheet?.status === "Approved";
  const displayStatus = hasGoals ? goalSheet.status : (hasSubmitted ? "Draft" : "Not Started");

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Active Goals" value={activeGoalsCount.toString()} icon={<Target className="text-indigo-500" />} />
        <StatCard title="Status" value={displayStatus} icon={<CheckCircle2 className="text-emerald-500" />} />
        
        {!hasGoals || goalSheet.status === "Draft" ? (
          <div 
            onClick={() => setShowGoalForm(true)}
            className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl shadow-indigo-200 p-6 flex flex-col justify-between group cursor-pointer hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex justify-between items-start">
              <h3 className="text-white font-semibold text-lg">Create New Goal</h3>
              <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                <PlusCircle className="text-white h-6 w-6" />
              </div>
            </div>
            <p className="text-indigo-100 text-sm mt-4">Draft a new objective for this quarter.</p>
          </div>
        ) : isApproved ? (
          <div 
            onClick={() => setShowCheckInForm(true)}
            className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl shadow-emerald-200 p-6 flex flex-col justify-between group cursor-pointer hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex justify-between items-start">
              <h3 className="text-white font-semibold text-lg">Quarterly Check-In</h3>
              <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                <Activity className="text-white h-6 w-6" />
              </div>
            </div>
            <p className="text-emerald-100 text-sm mt-4">Log your actual progress for Q1.</p>
          </div>
        ) : (
          <div className="bg-amber-50 rounded-2xl shadow-sm border border-amber-200 p-6 flex flex-col justify-center">
            <h3 className="text-amber-800 font-bold text-lg mb-2">Pending Manager Approval</h3>
            <p className="text-amber-600 text-sm">Your goals have been submitted for review. They are locked until your manager approves or returns them.</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-6">My Current Goals</h2>
        <div className="space-y-4">
          {!hasGoals ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
              <Target className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-700">You haven't set any goals yet</h3>
              <p className="text-slate-500 mt-2">Click the "Create New Goal" button above to get started for this quarter!</p>
            </div>
          ) : goalSheet.goals.map((goal: any, index: number) => {
            const hasCheckIn = goal.checkIns?.length > 0;
            return (
              <div key={goal.id} className="flex items-center p-4 border border-slate-100 rounded-xl bg-slate-50/50">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
                  <Target className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-800">{goal.title}</h4>
                  <p className="text-sm text-slate-500">Thrust Area: {goal.thrustArea} • Weightage: {goal.weightage}%</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-1">
                    {goal.unitOfMeasurement}
                  </span>
                  <p className="text-sm font-semibold text-slate-700">Target: {goal.unitOfMeasurement === "Timeline" ? new Date(goal.target).toLocaleDateString() : goal.target}</p>
                  {hasCheckIn ? (() => {
                    const checkIn = goal.checkIns[0];
                    const completedScore = calculateScore(goal, checkIn.actualAchievement);
                    return (
                      <div className="mt-2 text-right">
                        <span className="text-xs text-slate-500 block mb-1">Actual: {checkIn.actualAchievement}</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-black ${completedScore === 100 ? 'bg-emerald-100 text-emerald-700' : completedScore >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          Score: {completedScore}%
                        </span>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                          <div className={`h-1.5 rounded-full ${completedScore === 100 ? 'bg-emerald-500' : completedScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(completedScore || 0, 100)}%` }}></div>
                        </div>
                      </div>
                    );
                  })() : (
                    <span className="text-xs font-medium text-slate-400 mt-1 block">No check-in yet</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ManagerView() {
  const [pendingSheets, setPendingSheets] = useState<any[]>([]);
  const [approvedSheets, setApprovedSheets] = useState<any[]>([]);
  const [teamMembersCount, setTeamMembersCount] = useState(0);
  const [selectedSheetForReview, setSelectedSheetForReview] = useState<any>(null);
  const [selectedSheetForCheckIn, setSelectedSheetForCheckIn] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const [pending, approved, teamCount] = await Promise.all([
      getPendingGoalSheets(),
      getApprovedGoalSheets(),
      getTeamMembersCount()
    ]);
    
    if (pending.success && pending.data) setPendingSheets(pending.data);
    if (approved.success && approved.data) setApprovedSheets(approved.data);
    if (teamCount.success && typeof teamCount.count === 'number') setTeamMembersCount(teamCount.count);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!selectedSheetForReview && !selectedSheetForCheckIn) {
      fetchData();
    }
  }, [selectedSheetForReview, selectedSheetForCheckIn, fetchData]);

  if (selectedSheetForReview) {
    return <ManagerReviewForm sheet={selectedSheetForReview} onBack={() => setSelectedSheetForReview(null)} />;
  }

  if (selectedSheetForCheckIn) {
    return <ManagerCheckInReview sheet={selectedSheetForCheckIn} onBack={() => setSelectedSheetForCheckIn(null)} />;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Team Members" value={teamMembersCount.toString()} icon={<Users className="text-blue-500" />} />
        <StatCard title="Pending Approvals" value={pendingSheets.length.toString()} icon={<CheckCircle2 className="text-amber-500" />} />
        <StatCard title="Active Approved Sheets" value={approvedSheets.length.toString()} icon={<Target className="text-emerald-500" />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Pending Approvals Queue</h2>
          
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-20 bg-slate-200 rounded-xl"></div>
              <div className="h-20 bg-slate-200 rounded-xl"></div>
            </div>
          ) : pendingSheets.length === 0 ? (
            <div className="text-center py-12 text-slate-500 italic border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
              No pending goal sheets to review. Great job!
            </div>
          ) : (
            <div className="space-y-4">
              {pendingSheets.map((sheet) => (
                <div key={sheet.id} className="flex items-center p-4 border border-slate-100 rounded-xl hover:border-amber-100 hover:shadow-md hover:shadow-amber-50 transition-all bg-slate-50/50">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-800">{sheet.employee?.name || "Employee"}</h4>
                    <p className="text-sm text-slate-500">Submitted {sheet.goals.length} goals for {sheet.cycle}</p>
                  </div>
                  <div>
                    <button 
                      onClick={() => setSelectedSheetForReview(sheet)}
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors"
                    >
                      Review Goals
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Quarterly Check-In Reviews</h2>
          
          {isLoading ? (
            <div className="text-center py-10 text-slate-500">Loading check-ins...</div>
          ) : approvedSheets.length === 0 ? (
            <div className="text-center py-12 text-slate-500 italic border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
              No active goal sheets with check-ins.
            </div>
          ) : (
            <div className="space-y-4">
              {approvedSheets.map((sheet) => (
                <div key={sheet.id} className="flex items-center p-4 border border-slate-100 rounded-xl hover:border-emerald-100 hover:shadow-md hover:shadow-emerald-50 transition-all bg-slate-50/50">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-800">{sheet.employee?.name || "Employee"}</h4>
                    <p className="text-sm text-slate-500">Cycle: {sheet.cycle}</p>
                  </div>
                  <div>
                    <button 
                      onClick={() => setSelectedSheetForCheckIn(sheet)}
                      className="text-sm font-semibold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-lg transition-colors"
                    >
                      View Check-ins
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { getAdminDashboardData, unlockGoalSheet, getSystemAuditLogs, createSharedKPI, getSharedKPIs, toggleSharedKPIStatus } from "@/actions/admin";
import { Download, Unlock, Clock, Power } from "lucide-react";

function AdminView() {
  const [dashboardData, setDashboardData] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnlocking, setIsUnlocking] = useState<Record<string, boolean>>({});
  
  const [newKpi, setNewKpi] = useState({
    title: "", thrustArea: "Quality", uom: "%", trackingType: "Min (Higher is better)", target: ""
  });
  const [isCreatingKpi, setIsCreatingKpi] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const [dashResult, auditResult, kpiResult] = await Promise.all([
      getAdminDashboardData(),
      getSystemAuditLogs(),
      getSharedKPIs()
    ]);
    if (dashResult.success && dashResult.data) {
      setDashboardData(dashResult.data);
    }
    if (auditResult.success && auditResult.data) {
      setAuditLogs(auditResult.data);
    }
    if (kpiResult.success && kpiResult.data) {
      setKpis(kpiResult.data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUnlock = (sheetId: string) => {
    toast('Are you sure you want to unlock these goals?', {
      description: 'This will change the status back to Draft.',
      action: {
        label: 'Yes, Unlock',
        onClick: async () => {
          setIsUnlocking(prev => ({ ...prev, [sheetId]: true }));
          const result = await unlockGoalSheet(sheetId);
          if (result.success) {
            toast.success("Goals unlocked successfully!");
            fetchData(); // Refresh the tables
          } else {
            toast.error("Failed to unlock goals");
          }
          setIsUnlocking(prev => ({ ...prev, [sheetId]: false }));
        }
      },
      cancel: { label: 'Cancel', onClick: () => {} }
    });
  };

  const handleCreateKpi = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Sanitize values before sending to the server
    const targetValue = newKpi.uom === "Zero-based" ? "0" : newKpi.target;
    const trackingTypeValue = (newKpi.uom === "%" || newKpi.uom === "Numeric") ? newKpi.trackingType : null;

    if (!newKpi.title || !targetValue) return toast.warning("Title and Target are required.");
    
    setIsCreatingKpi(true);
    const result = await createSharedKPI({
      ...newKpi,
      target: targetValue,
      trackingType: trackingTypeValue
    });

    if (result.success) {
      toast.success("KPI created successfully!");
      setNewKpi({ title: "", thrustArea: "Quality", uom: "%", trackingType: "Min (Higher is better)", target: "" });
      fetchData();
    } else {
      toast.error("Failed to create KPI.");
    }
    setIsCreatingKpi(false);
  };

  const handleToggleKpi = async (id: string, currentStatus: boolean) => {
    const result = await toggleSharedKPIStatus(id, !currentStatus);
    if (result.success) {
      toast.success(`KPI ${currentStatus ? 'deactivated' : 'activated'}!`);
      fetchData();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-64 bg-slate-200 rounded-xl mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-slate-200 h-28 rounded-2xl"></div>
          <div className="bg-slate-200 h-28 rounded-2xl"></div>
          <div className="bg-slate-200 h-28 rounded-2xl"></div>
          <div className="bg-slate-200 h-28 rounded-2xl"></div>
        </div>
        <div className="bg-slate-200 h-96 rounded-2xl mt-8"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Governance & Reporting</h2>
        <a 
          href="/api/export-achievements"
          download="achievement_report.csv"
          className="flex items-center px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors shadow-lg shadow-indigo-200"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Achievement Report (CSV)
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Employees" value={dashboardData.length.toString()} icon={<Users className="text-purple-500" />} />
        <StatCard title="Approved Goals" value={dashboardData.filter(d => d.goalStatus === 'Approved').length.toString()} icon={<Target className="text-indigo-500" />} />
        <StatCard title="System Health" value="100%" icon={<Activity className="text-emerald-500" />} />
        <StatCard title="Active Sessions" value="1" icon={<LayoutDashboard className="text-blue-500" />} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Company KPIs</h2>
        </div>
        
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <form onSubmit={handleCreateKpi} className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-slate-700 mb-1">KPI Title</label>
              <input type="text" value={newKpi.title} onChange={e => setNewKpi({...newKpi, title: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Increase Revenue" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Thrust Area</label>
              <select value={newKpi.thrustArea} onChange={e => setNewKpi({...newKpi, thrustArea: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none">
                <option value="Quality">Quality</option>
                <option value="Delivery">Delivery</option>
                <option value="Cost">Cost</option>
                <option value="Innovation">Innovation</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">UoM</label>
              <select value={newKpi.uom} onChange={e => setNewKpi({...newKpi, uom: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none">
                <option value="%">%</option>
                <option value="Numeric">Numeric</option>
                <option value="Timeline">Timeline</option>
                <option value="Zero-based">Zero-based</option>
              </select>
            </div>
            {(newKpi.uom === "%" || newKpi.uom === "Numeric") && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tracking Type</label>
                <select value={newKpi.trackingType} onChange={e => setNewKpi({...newKpi, trackingType: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none">
                  <option value="Min (Higher is better)">Min (Higher is better)</option>
                  <option value="Max (Lower is better)">Max (Lower is better)</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Target</label>
              {newKpi.uom === "Timeline" ? (
                <input type="date" value={newKpi.target} onChange={e => setNewKpi({...newKpi, target: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" required />
              ) : newKpi.uom === "Zero-based" ? (
                <input type="text" value="0" disabled className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg outline-none text-slate-500" />
              ) : (
                <input type="number" value={newKpi.target} onChange={e => setNewKpi({...newKpi, target: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" required />
              )}
            </div>
            <button type="submit" disabled={isCreatingKpi} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg disabled:opacity-50 transition-colors h-[42px] flex items-center">
              <PlusCircle className="h-4 w-4 mr-2" />
              {isCreatingKpi ? "Adding..." : "Add KPI"}
            </button>
          </form>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-slate-500">Loading KPIs...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-sm font-semibold">
                  <th className="px-6 py-4">KPI Title</th>
                  <th className="px-6 py-4">Thrust Area</th>
                  <th className="px-6 py-4">Target (UoM)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {kpis.map((kpi) => (
                  <tr key={kpi.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{kpi.title}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        {kpi.thrustArea}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-700">{kpi.target} <span className="text-slate-400 font-normal">({kpi.uom})</span></div>
                      {kpi.trackingType && <div className="text-xs text-slate-400">{kpi.trackingType}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${kpi.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                        {kpi.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleKpi(kpi.id, kpi.isActive)}
                        className={`inline-flex items-center px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors ${
                          kpi.isActive 
                            ? "border-amber-200 text-amber-600 hover:bg-amber-50" 
                            : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        <Power className="h-4 w-4 mr-1.5" />
                        {kpi.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
                {kpis.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500 italic">No Company KPIs have been created yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Completion Dashboard</h2>
        </div>
        
        {isLoading ? (
          <div className="text-center py-12 text-slate-500">Loading dashboard data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-sm font-semibold">
                  <th className="px-6 py-4">Employee Name</th>
                  <th className="px-6 py-4">Goal Setting Status</th>
                  <th className="px-6 py-4">Q1 Check-in Status</th>
                  <th className="px-6 py-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dashboardData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800 flex items-center">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                        <span className="text-indigo-700 text-xs font-bold">{row.name.charAt(0)}</span>
                      </div>
                      {row.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        row.goalStatus === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        row.goalStatus === "Submitted" ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-slate-100 text-slate-600 border-slate-200"
                      }`}>
                        {row.goalStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        row.checkInStatus === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        "bg-slate-100 text-slate-500 border-slate-200"
                      }`}>
                        {row.checkInStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {row.goalStatus === "Approved" && row.sheetId ? (
                        <button
                          onClick={() => handleUnlock(row.sheetId)}
                          disabled={isUnlocking[row.sheetId]}
                          className="inline-flex items-center px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          <Unlock className="h-4 w-4 mr-1.5" />
                          {isUnlocking[row.sheetId] ? "Unlocking..." : "Unlock Goals"}
                        </button>
                      ) : (
                        <span className="text-slate-300 text-sm italic">No override available</span>
                      )}
                    </td>
                  </tr>
                ))}
                {dashboardData.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">No employees found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">System Audit Logs</h2>
        </div>
        
        {isLoading ? (
          <div className="text-center py-12 text-slate-500">Loading audit trail...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-sm font-semibold">
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Performed By</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Target Sheet ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-500 flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-slate-400" />
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{log.performedByName}</div>
                      <div className="text-xs text-slate-500">{log.performedByRole}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-indigo-700">{log.action}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                      {log.targetSheetId}
                    </td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">No audit logs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">{value}</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl">
          {icon}
        </div>
      </div>
    </div>
  );
}
