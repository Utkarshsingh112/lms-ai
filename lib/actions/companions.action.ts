"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { getDatabaseErrorMessage } from "@/lib/errors";
import { createSupabaseClient } from "@/lib/supabase";
import type {
  Companion,
  CreateCompanionInput,
  GetAllCompanionsInput,
  SearchParamValue,
} from "@/types/companion";

const normalizeFilterValue = (value: SearchParamValue) =>
  Array.isArray(value) ? value[0] : value;

const logActionError = (
  action: string,
  error: unknown,
  metadata?: Record<string, unknown>
) => {
  console.error(`[companions.action] ${action} failed`, {
    error,
    ...metadata,
  });
};

export const createCompanion = async (formData: CreateCompanionInput) => {
  const { userId: author } = await auth();

  if (!author) {
    throw new Error("You must be signed in to create a companion.");
  }

  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("companions")
    .insert({ ...formData, author })
    .select()
    .single();

  if (error || !data) {
    logActionError("createCompanion", error, { author, formData });
    throw new Error(
      getDatabaseErrorMessage(
        error,
        "We could not create your companion right now."
      )
    );
  }

  revalidatePath("/");
  revalidatePath("/companions");
  revalidatePath("/my-journey");

  return data as Companion;
};

export const getAllCompanions = async ({
  limit = 10,
  page = 1,
  subject,
  topic,
}: GetAllCompanionsInput) => {
  const supabase = createSupabaseClient();
  const normalizedSubject = normalizeFilterValue(subject);
  const normalizedTopic = normalizeFilterValue(topic);

  let query = supabase.from("companions").select();

  if (normalizedSubject && normalizedTopic) {
    query = query
      .ilike("subject", `%${normalizedSubject}%`)
      .or(`topic.ilike.%${normalizedTopic}%,name.ilike.%${normalizedTopic}%`);
  } else if (normalizedSubject) {
    query = query.ilike("subject", `%${normalizedSubject}%`);
  } else if (normalizedTopic) {
    query = query.or(
      `topic.ilike.%${normalizedTopic}%,name.ilike.%${normalizedTopic}%`
    );
  }

  const { data, error } = await query.range((page - 1) * limit, page * limit - 1);

  if (error) {
    logActionError("getAllCompanions", error, {
      limit,
      page,
      normalizedSubject,
      normalizedTopic,
    });
    throw new Error(
      getDatabaseErrorMessage(error, "We could not load companions right now.")
    );
  }

  return (data ?? []) as Companion[];
};

export const getCompanion = async (id: string) => {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("companions")
    .select()
    .eq("id", id)
    .maybeSingle();

  if (error) {
    logActionError("getCompanion", error, { id });
    throw new Error(
      getDatabaseErrorMessage(error, "We could not load this companion.")
    );
  }

  return (data as Companion | null) ?? null;
};

export const addToSessionHistory = async (companionId: string) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("You must be signed in to save session history.");
  }

  const supabase = createSupabaseClient();
  const { data, error } = await supabase.from("session_history").insert({
    companion_id: companionId,
    user_id: userId,
  });

  if (error) {
    logActionError("addToSessionHistory", error, { companionId, userId });
    throw new Error(
      getDatabaseErrorMessage(
        error,
        "We could not save this session to your history."
      )
    );
  }

  revalidatePath("/");
  revalidatePath("/my-journey");

  return data;
};

export const getRecentSessions = async (limit = 10): Promise<Companion[]> => {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("session_history")
    .select("companions:companion_id (*)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logActionError("getRecentSessions", error, { limit });
    throw new Error(
      getDatabaseErrorMessage(
        error,
        "We could not load recent sessions right now."
      )
    );
  }

  return data
    .map(({ companions }) => companions)
    .filter(Boolean) as unknown as Companion[];
};

export const getUserSessions = async (
  userId: string,
  limit = 10
): Promise<Companion[]> => {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("session_history")
    .select("companions:companion_id (*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logActionError("getUserSessions", error, { userId, limit });
    throw new Error(
      getDatabaseErrorMessage(
        error,
        "We could not load your session history right now."
      )
    );
  }

  return data
    .map(({ companions }) => companions)
    .filter(Boolean) as unknown as Companion[];
};

export const getUserCompanions = async (userId: string): Promise<Companion[]> => {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("companions")
    .select()
    .eq("author", userId);

  if (error) {
    logActionError("getUserCompanions", error, { userId });
    throw new Error(
      getDatabaseErrorMessage(
        error,
        "We could not load your companions right now."
      )
    );
  }

  return (data ?? []) as Companion[];
};

export const newCompanionPermissions = async () => {
  const { userId, has } = await auth();

  if (!userId) {
    return false;
  }

  if (has({ plan: "pro" })) {
    return true;
  }

  let limit = 0;

  if (has({ feature: "10_active_companion_limit" })) {
    limit = 10;
  } else if (has({ feature: "3_companion_limit" })) {
    limit = 3;
  }

  if (limit === 0) {
    return false;
  }

  const supabase = createSupabaseClient();
  const { count, error } = await supabase
    .from("companions")
    .select("id", { count: "exact", head: true })
    .eq("author", userId);

  if (error) {
    logActionError("newCompanionPermissions", error, { userId, limit });
    throw new Error(
      getDatabaseErrorMessage(
        error,
        "We could not verify your companion limit right now."
      )
    );
  }

  return (count ?? 0) < limit;
};
