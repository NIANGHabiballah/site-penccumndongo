export interface ActivityItem {
  user: string;
  action: string;
  time: string;
  avatar: string;
}

export interface SyncStatus {
  lastSync: Date | null;
  isOnline: boolean;
  pendingChanges: number;
}