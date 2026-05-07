export interface Notification {
  id: number;
  recipientId: number;
  type: string;
  title: string;
  message: string;
  channel: string;
  relatedId: number;
  relatedType: string;
  read: boolean;
  sentAt: string;
}

export interface UnreadCountResponse {
  count: number;
}
