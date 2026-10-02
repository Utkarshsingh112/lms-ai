export type SearchParamValue = string | string[] | undefined;

export type SearchParamsMap = Record<string, SearchParamValue>;

export interface PageSearchParams {
  searchParams: Promise<SearchParamsMap>;
}

export interface Companion {
  id: string;
  name: string;
  subject: string;
  topic: string;
  duration: number;
  voice: string;
  style: string;
  author: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCompanionInput {
  name: string;
  subject: string;
  topic: string;
  voice: string;
  style: string;
  duration: number;
}

export interface GetAllCompanionsInput {
  limit?: number;
  page?: number;
  subject?: SearchParamValue;
  topic?: SearchParamValue;
}

export interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

export interface CompanionComponentProps {
  companionId: string;
  subject: string;
  topic: string;
  name: string;
  userName: string;
  userImage: string;
  voice: string;
  style: string;
  duration?: number;
}
