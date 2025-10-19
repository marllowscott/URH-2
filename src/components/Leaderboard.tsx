import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Trophy, Medal, Award } from "lucide-react";

type Row = { student_id: string; xp: number };

const Leaderboard = ({ program }: { program: string }) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [selfId, setSelfId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    setSelfId(userData?.user?.id || null);
    const { data, error } = await supabase.from("xp_events").select("student_id, xp").eq("program", program);
    if (error) return setRows([]);
    const totals = new Map<string, number>();
    for (const r of (data || []) as Row[]) totals.set(r.student_id, (totals.get(r.student_id) || 0) + (r.xp || 0));
    const items = Array.from(totals.entries()).map(([student_id, xp]) => ({ student_id, xp })).sort((a, b) => b.xp - a.xp).slice(0, 10);
    setRows(items);
  }, [program]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("leaderboard-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "xp_events" }, load)
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "xp_events" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const getRankIcon = (idx: number) => {
    if (idx === 0) return <Trophy className="h-5 w-5 text-[#FF8181]" />;
    if (idx === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (idx === 2) return <Award className="h-5 w-5 text-[#FF8181]" />;
    return null;
  };

  const getRankGlow = (idx: number) => {
    if (idx < 3) return "shadow-lg shadow-[#FF8181]/20";
    return "";
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-[#0747A1]" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No XP yet. Complete tasks to climb the ranks!</p>
        ) : (
          <div className="space-y-2">
            {rows.map((row, idx) => (
              <motion.div
                key={row.student_id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center justify-between p-4 border rounded-lg transition-all duration-300 ${
                  row.student_id === selfId
                    ? 'bg-[#E6F0FF] border-[#0747A1] shadow-md'
                    : idx < 3
                    ? `bg-gradient-to-r from-red-50 to-red-50 border-[#FF8181] ${getRankGlow(idx)}`
                    : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#0747A1] text-white font-bold text-sm">
                    {idx + 1}
                  </div>
                  {getRankIcon(idx)}
                  <div>
                    <span className="text-sm font-medium">{row.student_id.slice(0, 8)}…</span>
                    {row.student_id === selfId && (
                      <span className="text-xs text-[#0747A1] ml-2">(You)</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-[#0747A1]">{row.xp}</span>
                  <span className="text-sm text-muted-foreground">XP</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Leaderboard;


