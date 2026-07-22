import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

// -----------------------------------------------------------------------------
// SQLite ulanishi (node:sqlite - Node ichiga o'rnatilgan, tashqi kutubxonasiz).
// Dev rejimida hot-reload paytida bir nechta ulanish ochilib ketmasligi uchun
// globalThis da keshlaymiz.
// -----------------------------------------------------------------------------

const DB_PATH = process.env.DATABASE_PATH || "./data/crm.db";

function createDb(): DatabaseSync {
  const abs = path.resolve(process.cwd(), DB_PATH);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  const db = new DatabaseSync(abs);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  migrate(db);
  return db;
}

function migrate(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      phone2 TEXT,
      address TEXT,
      "group" TEXT NOT NULL DEFAULT 'C' CHECK("group" IN ('A','B','C','D')),
      rating REAL,
      reviews_count INTEGER,
      work_hours TEXT,
      info TEXT,
      instagram TEXT,
      status TEXT NOT NULL DEFAULT 'YANGI'
        CHECK(status IN ('YANGI','KOTARMADI','KEYINROQ','QIZIQDI','UCHRASHUV','RAD','SOTILDI','NOTOGRI_RAQAM')),
      reject_reason TEXT
        CHECK(reject_reason IS NULL OR reject_reason IN ('QIMMAT','INSTAGRAM_YETARLI','ISHONMADI','KERAK_EMAS','BOSHQA')),
      no_answer_streak INTEGER NOT NULL DEFAULT 0,
      next_action_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS calls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      called_at TEXT NOT NULL DEFAULT (datetime('now')),
      outcome TEXT NOT NULL
        CHECK(outcome IN ('KOTARMADI','KEYINROQ','QIZIQDI','UCHRASHUV','RAD','SOTILDI','NOTOGRI_RAQAM')),
      note TEXT,
      duration_hint TEXT CHECK(duration_hint IS NULL OR duration_hint IN ('QISQA','ORTACHA','UZOQ'))
    );

    CREATE TABLE IF NOT EXISTS meetings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      meet_at TEXT NOT NULL,
      location TEXT,
      status TEXT NOT NULL DEFAULT 'REJALANGAN'
        CHECK(status IN ('REJALANGAN','OTKAZILDI','BEKOR')),
      note TEXT
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      remind_at TEXT NOT NULL,
      type TEXT NOT NULL
        CHECK(type IN ('QAYTA_QONGIROQ','UCHRASHUV_1KUN','UCHRASHUV_2SOAT','RAD_QAYTA')),
      sent INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
    CREATE INDEX IF NOT EXISTS idx_leads_next ON leads(next_action_at);
    CREATE INDEX IF NOT EXISTS idx_calls_lead ON calls(lead_id);
    CREATE INDEX IF NOT EXISTS idx_reminders_pending ON reminders(sent, remind_at);
  `);
}

declare global {
  // eslint-disable-next-line no-var
  var __CRM_DB__: DatabaseSync | undefined;
}

export const db: DatabaseSync = globalThis.__CRM_DB__ ?? createDb();
if (process.env.NODE_ENV !== "production") globalThis.__CRM_DB__ = db;
