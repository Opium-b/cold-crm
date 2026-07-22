import { db } from "./db";
import { tashkentPreset, utcNow, utcPlus, DAY } from "./time";
import { queueCount } from "./leads";

export interface DashboardData {
  todayCalls: number;
  todayInterested: number;
  todayMeetings: number;
  todayRejected: number;
  waiting: number;
  upcomingMeetings: {
    id: number;
    lead_id: number;
    name: string;
    meet_at: string;
    location: string | null;
  }[];
  funnel: {
    total: number;
    called: number;
    interested: number;
    meeting: number;
    sold: number;
  };
}

function count(sql: string, ...params: (string | number | null)[]): number {
  const row = db.prepare(sql).get(...params) as { c: number };
  return row.c;
}

export function getDashboard(): DashboardData {
  const todayStart = tashkentPreset(0, 0, 0); // bugun 00:00 Tashkent -> UTC
  const now = utcNow();
  const in7 = utcPlus(7 * DAY);

  const todayCalls = count("SELECT COUNT(*) c FROM calls WHERE called_at >= ?", todayStart);
  const todayInterested = count(
    "SELECT COUNT(*) c FROM calls WHERE called_at >= ? AND outcome = 'QIZIQDI'",
    todayStart
  );
  const todayMeetings = count(
    "SELECT COUNT(*) c FROM calls WHERE called_at >= ? AND outcome = 'UCHRASHUV'",
    todayStart
  );
  const todayRejected = count(
    "SELECT COUNT(*) c FROM calls WHERE called_at >= ? AND outcome = 'RAD'",
    todayStart
  );

  const upcomingMeetings = db
    .prepare(
      `SELECT m.id, m.lead_id, l.name, m.meet_at, m.location
       FROM meetings m JOIN leads l ON l.id = m.lead_id
       WHERE m.status = 'REJALANGAN' AND m.meet_at >= ? AND m.meet_at <= ?
       ORDER BY m.meet_at ASC`
    )
    .all(now, in7) as DashboardData["upcomingMeetings"];

  const total = count("SELECT COUNT(*) c FROM leads");
  const called = count("SELECT COUNT(DISTINCT lead_id) c FROM calls");
  const interested = count(
    "SELECT COUNT(DISTINCT lead_id) c FROM calls WHERE outcome IN ('QIZIQDI','UCHRASHUV','SOTILDI')"
  );
  const meeting = count(
    "SELECT COUNT(DISTINCT lead_id) c FROM calls WHERE outcome IN ('UCHRASHUV','SOTILDI')"
  );
  const sold = count("SELECT COUNT(*) c FROM leads WHERE status = 'SOTILDI'");

  return {
    todayCalls,
    todayInterested,
    todayMeetings,
    todayRejected,
    waiting: queueCount(),
    upcomingMeetings,
    funnel: { total, called, interested, meeting, sold },
  };
}
