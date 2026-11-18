import React, { useEffect, useState } from 'react';
import { History, CheckCircle, XCircle, ArrowRight, RefreshCw, FileText } from 'lucide-react';
import * as api from '../api/client';

export function MissionHistory() {
  const [missions, setMissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await api.fetchMissions();
      setMissions(data.history || []);
    } catch (e) {
      console.error('Failed to load mission history:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    const interval = setInterval(loadHistory, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
          <History className="w-4 h-4 text-cyan-400" />
          <span>MISSION AUDIT TRAIL (SQLITE)</span>
        </div>
        <button
          onClick={loadHistory}
          disabled={isLoading}
          className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
        {missions.length === 0 ? (
          <div className="text-center p-4 text-gray-500 text-xs font-mono bg-gray-900/60 rounded-xl">
            No missions recorded yet in database.
          </div>
        ) : (
          missions.map((m) => (
            <div
              key={m.id}
              className="bg-gray-900/80 p-2.5 rounded-xl border border-gray-800 text-[11px] font-mono hover:border-gray-700 transition-all"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-cyan-300">{m.id}</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                  m.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                  m.status === 'CANCELLED' ? 'bg-red-950 text-red-300 border border-red-800' :
                  'bg-cyan-950 text-cyan-300 border border-cyan-800'
                }`}>
                  {m.status}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-gray-300 mb-1">
                <span className="text-gray-400">{m.pickup_dept_id?.toUpperCase()}</span>
                <ArrowRight className="w-3 h-3 text-gray-500" />
                <span className="text-emerald-400">{m.delivery_dept_id?.toUpperCase()}</span>
              </div>

              <div className="text-[10px] text-gray-400 mb-1">
                {m.package_type} • Priority: <span className="text-amber-400">{m.priority}</span>
              </div>

              <div className="flex items-center justify-between text-[9px] text-gray-500 pt-1.5 border-t border-gray-800/80">
                <span>Dist: {m.distance_traveled_m ? m.distance_traveled_m.toFixed(1) : 0}m</span>
                <span>Time: {m.duration_seconds ? m.duration_seconds.toFixed(0) : 0}s</span>
                <span>Reroutes: {m.reroutes_count || 0}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
