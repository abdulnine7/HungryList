export type Priority = 'must' | 'soon' | 'optional';

export type Section = {
  id: string;
  name: string;
  icon: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type Item = {
  id: string;
  sectionId: string;
  name: string;
  description: string;
  priority: Priority;
  remindEveryDays: number;
  checked: boolean;
  favorite: boolean;
  runningLow: boolean;
  lastCheckedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  reminderDue: boolean;
};

export type BackupRecord = {
  id: string;
  filename: string;
  reason: string;
  created_at: string;
};

export type ApiErrorShape = {
  code: string;
  message: string;
  details?: unknown;
};

export type ActiveTab =
  | 'myList'
  | 'nextTrip'
  | 'favorites'
  | 'runningLow'
  | 'reminders'
  | 'settings';
