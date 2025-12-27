
import { AppData, Trip, Expense, Friend, Notification } from '../types.ts';
import { db } from './db.ts';

class CloudService {
  async initSchema() {
    try {
      await db.batch([
        "CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, password_hash TEXT NOT NULL, phone_number TEXT, avatar_color TEXT, avatar_image TEXT, currency TEXT, theme TEXT, cloud_id TEXT UNIQUE, last_synced_at INTEGER)",
        "CREATE TABLE IF NOT EXISTS trips (id TEXT PRIMARY KEY, owner_username TEXT NOT NULL, name TEXT NOT NULL, status TEXT, members TEXT, created_at INTEGER, ended_at INTEGER)",
        "CREATE TABLE IF NOT EXISTS expenses (id TEXT PRIMARY KEY, trip_id TEXT NOT NULL, amount REAL, description TEXT, category TEXT, paid_by TEXT, split_among TEXT, timestamp INTEGER)",
        "CREATE TABLE IF NOT EXISTS friends (user_username TEXT NOT NULL, friend_username TEXT NOT NULL, PRIMARY KEY(user_username, friend_username))",
        "CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, from_username TEXT NOT NULL, to_username TEXT NOT NULL, type TEXT, status TEXT, timestamp INTEGER, trip_id TEXT, trip_name TEXT)",
        "CREATE TABLE IF NOT EXISTS trip_participants (trip_id TEXT NOT NULL, username TEXT NOT NULL, PRIMARY KEY(trip_id, username))"
      ], "write");
    } catch (e) {
      console.error("[CloudService] Failed to initialize schema:", e);
    }
  }

  async auth(username: string, password_hash: string, isSignUp: boolean, details?: any): Promise<boolean> {
    await this.initSchema();
    const cleanUsername = username.trim();
    if (isSignUp) {
      const checkResult = await db.execute({
        sql: "SELECT username FROM users WHERE username = ?",
        args: [cleanUsername]
      });
      if (checkResult.rows.length > 0) throw new Error("Username already taken.");
      await db.execute({
        sql: "INSERT INTO users (username, password_hash, phone_number, avatar_color, currency, theme, cloud_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
        args: [cleanUsername, password_hash, details?.phoneNumber || '', '#ec4899', 'INR', 'system', `user_${Math.random().toString(36).substr(2, 9)}`]
      });
      return true;
    } else {
      const result = await db.execute({
        sql: "SELECT password_hash FROM users WHERE username = ?",
        args: [cleanUsername]
      });
      if (result.rows.length === 0) throw new Error("Account doesn't exist");
      if (result.rows[0].password_hash !== password_hash) throw new Error("Invalid password");
      return true;
    }
  }

  async changePassword(username: string, currentPasswordHash: string, newPasswordHash: string): Promise<boolean> {
    const result = await db.execute({
      sql: "SELECT password_hash FROM users WHERE username = ?",
      args: [username.trim()]
    });
    if (result.rows.length === 0 || result.rows[0].password_hash !== currentPasswordHash) {
      throw new Error("Current password incorrect");
    }
    await db.execute({
      sql: "UPDATE users SET password_hash = ? WHERE username = ?",
      args: [newPasswordHash, username.trim()]
    });
    return true;
  }

  async fetchUserData(username: string): Promise<AppData | null> {
    const cleanUsername = username.trim();
    try {
      const [userRes, tripIdsRes] = await Promise.all([
        db.execute({ sql: "SELECT * FROM users WHERE username = ?", args: [cleanUsername] }),
        db.execute({ 
          sql: `SELECT DISTINCT trip_id FROM trip_participants WHERE username = ?`, 
          args: [cleanUsername] 
        })
      ]);
      const userRow = userRes.rows[0];
      if (!userRow) return null;
      const tripIds = tripIdsRes.rows.map(r => r.trip_id as string);
      if (tripIds.length === 0) {
        return this.fetchRemainingData(cleanUsername, userRow, []);
      }
      const [tripsFullRes, participantsRes, expensesRes, tripNotifsRes] = await Promise.all([
        db.execute({
          sql: `SELECT * FROM trips WHERE id IN (${tripIds.map(() => '?').join(',')})`,
          args: tripIds
        }),
        db.execute({
          sql: `SELECT * FROM trip_participants WHERE trip_id IN (${tripIds.map(() => '?').join(',')})`,
          args: tripIds
        }),
        db.execute({
          sql: `SELECT * FROM expenses WHERE trip_id IN (${tripIds.map(() => '?').join(',')})`,
          args: tripIds
        }),
        db.execute({
          sql: `SELECT * FROM notifications WHERE trip_id IN (${tripIds.map(() => '?').join(',')})`,
          args: tripIds
        })
      ]);
      const participantsByTrip: Record<string, string[]> = {};
      participantsRes.rows.forEach(row => {
        const tid = row.trip_id as string;
        if (!participantsByTrip[tid]) participantsByTrip[tid] = [];
        participantsByTrip[tid].push(row.username as string);
      });
      const trips: Trip[] = tripsFullRes.rows.map((row) => {
        const tid = row.id as string;
        let members: string[] = [];
        try {
            members = JSON.parse(row.members as string) || [];
        } catch (e) {
            members = participantsByTrip[tid] || [];
        }
        return {
          id: tid,
          name: row.name as string,
          status: row.status as any,
          members: members,
          participants: participantsByTrip[tid] || [],
          createdAt: Number(row.created_at),
          endedAt: row.ended_at ? Number(row.ended_at) : undefined,
          expenses: []
        };
      });
      const expenses = expensesRes.rows.map((row) => ({
        id: row.id as string,
        trip_id: row.trip_id as string,
        amount: row.amount as number,
        description: row.description as string || undefined,
        category: row.category as any,
        paidBy: row.paid_by as string,
        splitAmong: JSON.parse(row.split_among as string),
        timestamp: Number(row.timestamp)
      }));
      trips.forEach(t => {
        t.expenses = expenses.filter(e => e.trip_id === t.id);
      });
      return this.fetchRemainingData(cleanUsername, userRow, trips, tripNotifsRes.rows);
    } catch (e) {
      console.error("[CloudService] Fetch failed:", e);
      return null;
    }
  }

  private async fetchRemainingData(username: string, userRow: any, trips: Trip[], tripRelatedNotifs: any[] = []): Promise<AppData> {
    const [friendsRes, receivedNotifsRes, sentNotifsRes] = await Promise.all([
        db.execute({
            sql: `SELECT u.username, u.avatar_color, u.avatar_image 
                  FROM users u JOIN friends f ON u.username = f.friend_username 
                  WHERE f.user_username = ?`,
            args: [username]
        }),
        db.execute({
            sql: "SELECT * FROM notifications WHERE to_username = ? AND status = 'PENDING'",
            args: [username]
        }),
        db.execute({
            sql: "SELECT * FROM notifications WHERE from_username = ? AND type = 'TRIP_INVITATION'",
            args: [username]
        })
    ]);
    const friends: Friend[] = friendsRes.rows.map(row => ({
      username: row.username as string,
      avatarColor: row.avatar_color as string,
      avatarImage: row.avatar_image as string || undefined
    }));
    const mapNotif = (row: any): Notification => ({
      id: row.id as string,
      fromUsername: row.from_username as string,
      toUsername: row.to_username as string,
      type: row.type as any,
      status: row.status as any,
      timestamp: Number(row.timestamp),
      tripId: row.trip_id as string || undefined,
      tripName: row.trip_name as string || undefined
    });
    const allReceived = receivedNotifsRes.rows.map(mapNotif);
    const allSent = [...sentNotifsRes.rows.map(mapNotif), ...tripRelatedNotifs.map(mapNotif)];
    const uniqueSent = Array.from(new Map(allSent.map(n => [n.id, n])).values());
    return {
      isAuthenticated: true,
      profile: {
        name: userRow.username as string,
        phoneNumber: userRow.phone_number as string,
        avatarColor: userRow.avatar_color as string,
        avatarImage: userRow.avatar_image as string || undefined
      },
      settings: {
        currency: userRow.currency as any,
        theme: userRow.theme as any
      },
      trips,
      friends,
      notifications: allReceived,
      sentNotifications: uniqueSent,
      cloudId: userRow.cloud_id as string,
      lastSyncedAt: userRow.last_synced_at ? Number(userRow.last_synced_at) : undefined
    };
  }

  async respondToNotification(notificationId: string, status: 'ACCEPTED' | 'DECLINED'): Promise<void> {
    const notifRes = await db.execute({ sql: "SELECT * FROM notifications WHERE id = ?", args: [notificationId] });
    if (notifRes.rows.length === 0) return;
    const notif = notifRes.rows[0];
    const to = notif.to_username as string;
    const from = notif.from_username as string;
    const type = notif.type as string;
    const tid = notif.trip_id as string;
    if (status === 'ACCEPTED') {
      if (type === 'FRIEND_REQUEST') {
        await db.batch([
          { sql: "INSERT OR IGNORE INTO friends (user_username, friend_username) VALUES (?, ?)", args: [from, to] },
          { sql: "INSERT OR IGNORE INTO friends (user_username, friend_username) VALUES (?, ?)", args: [to, from] }
        ], "write");
      } else if (type === 'TRIP_INVITATION' && tid) {
        await db.execute({
          sql: "INSERT OR IGNORE INTO trip_participants (trip_id, username) VALUES (?, ?)",
          args: [tid, to]
        });
        const tripRes = await db.execute({ sql: "SELECT members FROM trips WHERE id = ?", args: [tid] });
        if (tripRes.rows.length > 0) {
            let members: string[] = [];
            try {
                members = JSON.parse(tripRes.rows[0].members as string) || [];
            } catch (e) {}
            if (!members.includes(to)) {
                members.push(to);
                await db.execute({
                    sql: "UPDATE trips SET members = ? WHERE id = ?",
                    args: [JSON.stringify(members), tid]
                });
            }
        }
      }
    }
    await db.execute({
      sql: "UPDATE notifications SET status = ? WHERE id = ?",
      args: [status, notificationId]
    });
  }

  async syncToCloud(data: AppData): Promise<boolean> {
    if (!data.cloudId || !data.isAuthenticated) return false;
    try {
      const uname = data.profile.name;
      const statements: any[] = [];
      statements.push({
        sql: "UPDATE users SET username = ?, phone_number = ?, avatar_color = ?, avatar_image = ?, currency = ?, theme = ?, last_synced_at = ? WHERE cloud_id = ?",
        args: [uname, data.profile.phoneNumber, data.profile.avatarColor, data.profile.avatarImage || null, data.settings.currency, data.settings.theme, Date.now(), data.cloudId]
      });
      for (const trip of data.trips) {
        statements.push({
          sql: "INSERT INTO trips (id, owner_username, name, status, members, created_at, ended_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, status=excluded.status, members=excluded.members, ended_at=excluded.ended_at",
          args: [trip.id, uname, trip.name, trip.status, JSON.stringify(trip.members), trip.createdAt, trip.endedAt || null]
        });
        statements.push({
          sql: "INSERT OR IGNORE INTO trip_participants (trip_id, username) VALUES (?, ?)",
          args: [trip.id, uname]
        });
        for (const exp of trip.expenses) {
          statements.push({
            sql: "INSERT INTO expenses (id, trip_id, amount, description, category, paid_by, split_among, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET amount=excluded.amount, description=excluded.description, category=excluded.category, paid_by=excluded.paid_by, split_among=excluded.split_among, timestamp=excluded.timestamp",
            args: [exp.id, trip.id, exp.amount, exp.description || null, exp.category, exp.paidBy, JSON.stringify(exp.splitAmong), exp.timestamp]
          });
        }
      }
      await db.batch(statements, "write");
      return true;
    } catch (e) {
      console.error('[CloudService] Sync failed:', e);
      return false;
    }
  }

  async removeParticipant(tripId: string, username: string): Promise<void> {
    await db.execute({
      sql: "DELETE FROM trip_participants WHERE trip_id = ? AND username = ?",
      args: [tripId, username]
    });
  }

  async deleteTrip(tripId: string): Promise<void> {
    await db.batch([
      { sql: "DELETE FROM expenses WHERE trip_id = ?", args: [tripId] },
      { sql: "DELETE FROM trip_participants WHERE trip_id = ?", args: [tripId] },
      { sql: "DELETE FROM notifications WHERE trip_id = ?", args: [tripId] },
      { sql: "DELETE FROM trips WHERE id = ?", args: [tripId] }
    ], "write");
  }

  async clearHistory(username: string): Promise<void> {
    const res = await db.execute({
      sql: "SELECT trip_id FROM trip_participants WHERE username = ?",
      args: [username]
    });
    const tripIds = res.rows.map(r => r.trip_id as string);
    if (tripIds.length === 0) return;
    const endedRes = await db.execute({
      sql: `SELECT id FROM trips WHERE id IN (${tripIds.map(() => '?').join(',')}) AND status = 'ended'`,
      args: tripIds
    });
    if (endedRes.rows.length === 0) return;
    const statements: any[] = [];
    for (const row of endedRes.rows) {
      const tid = row.id as string;
      statements.push({ sql: "DELETE FROM expenses WHERE trip_id = ?", args: [tid] });
      statements.push({ sql: "DELETE FROM trip_participants WHERE trip_id = ? AND username = ?", args: [tid, username] });
    }
    await db.batch(statements, "write");
  }

  async searchUsers(query: string, currentUsername: string): Promise<string[]> {
    if (!query || query.length < 2) return [];
    const searchPattern = `%${query}%`;
    const result = await db.execute({
      sql: "SELECT username FROM users WHERE (username LIKE ? OR phone_number LIKE ?) AND username != ? LIMIT 8",
      args: [searchPattern, searchPattern, currentUsername]
    });
    return result.rows.map(row => row.username as string);
  }

  async sendFriendRequest(from: string, to: string): Promise<void> {
    await db.execute({
      sql: "INSERT INTO notifications (id, from_username, to_username, type, status, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
      args: [crypto.randomUUID(), from, to, 'FRIEND_REQUEST', 'PENDING', Date.now()]
    });
  }

  async sendTripInvitation(from: string, to: string, tripId: string, tripName: string): Promise<void> {
    await db.execute({
      sql: "INSERT INTO notifications (id, from_username, to_username, type, status, timestamp, trip_id, trip_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      args: [crypto.randomUUID(), from, to, 'TRIP_INVITATION', 'PENDING', Date.now(), tripId, tripName]
    });
  }

  async removeFriend(user: string, friend: string): Promise<void> {
    await db.batch([
      { sql: "DELETE FROM friends WHERE user_username = ? AND friend_username = ?", args: [user, friend] },
      { sql: "DELETE FROM friends WHERE user_username = ? AND friend_username = ?", args: [friend, user] }
    ], "write");
  }
}

export const cloudService = new CloudService();
