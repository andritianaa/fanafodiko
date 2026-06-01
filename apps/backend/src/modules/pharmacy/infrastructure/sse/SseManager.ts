/**
 * In-memory SSE hub.
 *
 * Two channels :
 *   • search channel   → streams response events to the user who created the search
 *   • pharmacy channel → streams incoming search-request events to connected pharmacy staff
 *
 * For production, replace the in-memory Map with Redis pub/sub.
 */

type Sender = (data: string, event?: string) => void;

class Channel {
  private clients = new Map<string, Sender>();

  add(clientId: string, sender: Sender) {
    this.clients.set(clientId, sender);
  }

  remove(clientId: string) {
    this.clients.delete(clientId);
  }

  broadcast(data: object, event = "message") {
    const payload = JSON.stringify(data);
    for (const sender of this.clients.values()) {
      try { sender(payload, event); } catch { /* closed */ }
    }
  }

  size() { return this.clients.size; }
}

class SseManager {
  /** searchId → connected searcher clients */
  private searches = new Map<string, Channel>();
  /** pharmacyId → connected staff clients */
  private pharmacies = new Map<string, Channel>();

  // ── Search channel ───────────────────────────────────────────────────────────

  subscribeSearch(searchId: string, clientId: string, sender: Sender): () => void {
    if (!this.searches.has(searchId)) this.searches.set(searchId, new Channel());
    this.searches.get(searchId)!.add(clientId, sender);
    return () => {
      this.searches.get(searchId)?.remove(clientId);
      if (this.searches.get(searchId)?.size() === 0) this.searches.delete(searchId);
    };
  }

  pushToSearch(searchId: string, data: object, event = "response") {
    this.searches.get(searchId)?.broadcast(data, event);
  }

  // ── Pharmacy channel ─────────────────────────────────────────────────────────

  subscribePharmacy(pharmacyId: string, clientId: string, sender: Sender): () => void {
    if (!this.pharmacies.has(pharmacyId)) this.pharmacies.set(pharmacyId, new Channel());
    this.pharmacies.get(pharmacyId)!.add(clientId, sender);
    return () => {
      this.pharmacies.get(pharmacyId)?.remove(clientId);
      if (this.pharmacies.get(pharmacyId)?.size() === 0) this.pharmacies.delete(pharmacyId);
    };
  }

  /** Notify all connected staff of the given pharmacies about a new search. */
  notifyPharmacies(pharmacyIds: string[], data: object) {
    for (const pid of pharmacyIds) {
      this.pharmacies.get(pid)?.broadcast(data, "new-search");
    }
  }
}

export const sseManager = new SseManager();
