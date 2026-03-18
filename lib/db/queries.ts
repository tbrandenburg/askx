// Stub functions for removed database functionality
// These stubs prevent compilation errors during Phase 1 transition

import type { Chat, DBMessage, Document, Suggestion } from "./schema";

// Chat functions (stubs)
export async function getChatById(params: {
  id: string;
}): Promise<Chat | null> {
  return null;
}

export async function getMessagesByChatId(params: {
  id: string;
}): Promise<DBMessage[]> {
  return [];
}

export async function saveChat(params: {
  id: string;
  userId: string;
  title: string;
  visibility: string;
}): Promise<void> {
  // No-op in stateless mode
}

export async function saveMessages(params: { messages: any[] }): Promise<void> {
  // No-op in stateless mode
}

export async function updateChatTitleById(params: {
  chatId: string;
  title: string;
}): Promise<void> {
  // No-op in stateless mode
}

export async function deleteChatById(params: { id: string }): Promise<void> {
  // No-op in stateless mode
}

export async function updateMessage(params: {
  id: string;
  parts: any[];
}): Promise<void> {
  // No-op in stateless mode
}

export async function getMessageCountByUserId(params: {
  id: string;
  differenceInHours: number;
}): Promise<number> {
  return 0;
}

// Document functions (stubs)
export async function getDocumentById(params: {
  id: string;
}): Promise<Document | null> {
  return null;
}

export async function saveDocument(params: any): Promise<void> {
  // No-op in stateless mode
}

// Suggestion functions (stubs)
export async function getSuggestionsByDocumentId(params: {
  documentId: string;
}): Promise<Suggestion[]> {
  return [];
}

export async function saveSuggestions(params: {
  suggestions: any[];
}): Promise<void> {
  // No-op in stateless mode
}

// Stream functions (stubs)
export async function createStreamId(params: {
  streamId: string;
  chatId: string;
}): Promise<void> {
  // No-op in stateless mode
}
