// Stub types for removed database functionality
// These types are kept to prevent compilation errors during Phase 1

export type Vote = {
  id: string;
  messageId: string;
  type: "up" | "down";
  userId: string;
  createdAt: Date;
};

export type Document = {
  id: string;
  title: string;
  content: string;
  kind: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Suggestion = {
  id: string;
  documentId: string;
  content: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type DBMessage = {
  id: string;
  role: "user" | "assistant";
  parts: any[];
  chatId: string;
  createdAt: Date;
  attachments?: any[];
};

export type User = {
  id: string;
  email: string;
  type: string;
  createdAt: Date;
};

export type Chat = {
  id: string;
  title: string;
  userId: string;
  visibility: string;
  createdAt: Date;
  updatedAt: Date;
};
