"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { getDatabaseErrorMessage } from "@/lib/errors";
import { createSupabaseClient } from "@/lib/supabase";
import { quoteFilterValue, toIlikePattern } from "@/lib/utils";
import { companionFormSchema } from "@/lib/validations/companion";
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

const LIMIT_REACHED_MESSAGE =
  "You have reached your companion limit. Upgrade your plan to create more.";

type SupabaseClient = ReturnType<typeof createSupabaseClient>;

const countUserCompanions = async (
  supabase: SupabaseClient,
  userId: string
) => {
  const { count, error } = await supabase
    .from("companions")
    .select("id", { count: "exact", head: true })
    .eq("author", userId);

  if (error) {
    logActionError("countUserCompanions", error, { userId });
    throw new Error(
      getDatabaseErrorMessage(
        error,
        "We could not verify your companion limit right now."
      )
    );
  }

  return count ?? 0;
};

// Returns how many companions the signed-in user may own (Infinity for pro).
const getCompanionLimit = async (): Promise<{
  userId: string | null;
  limit: number;
}> => {
  const { userId, has } = await auth();

  if (!userId) {
    return { userId: null, limit: 0 };
  }

  if (has({ plan: "pro" })) {
    return { userId, limit: Infinity };
  }

  if (has({ feature: "10_active_companion_limit" })) {
    return { userId, limit: 10 };
  }

  if (has({ feature: "3_companion_limit" })) {
    return { userId, limit: 3 };
  }

  return { userId, limit: 0 };
};

export const createCompanion = async (formData: CreateCompanionInput) => {
  const { userId: author, limit } = await getCompanionLimit();

  if (!author) {
    throw new Error("You must be signed in to create a companion.");
  }

  const parsed = companionFormSchema.safeParse(formData);

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? "Invalid companion details."
    );
  }

  const supabase = createSupabaseClient();

  if (
    Number.isFinite(limit) &&
    (await countUserCompanions(supabase, author)) >= limit
  ) {
    throw new Error(LIMIT_REACHED_MESSAGE);
  }

  // Only the validated fields are persisted; never spread raw client input.
  const { data, error } = await supabase
    .from("companions")
    .insert({ ...parsed.data, author })
    .select()
    .single();

  if (error || !data) {
    logActionError("createCompanion", error, { author });
    throw new Error(
      getDatabaseErrorMessage(
        error,
        "We could not create your companion right now."
      )
    );
  }

  // The check above and the insert are separate calls, so concurrent requests
  // can slip past it. Re-count and roll back the new row if we went over.
  if (
    Number.isFinite(limit) &&
    (await countUserCompanions(supabase, author)) > limit
  ) {
    const { error: rollbackError } = await supabase
      .from("companions")
      .delete()
      .eq("id", (data as Companion).id)
      .eq("author", author);

    if (rollbackError) {
      logActionError("createCompanion.rollback", rollbackError, { author });
    }

    throw new Error(LIMIT_REACHED_MESSAGE);
  }

  revalidatePath("/");
  revalidatePath("/companions");
  revalidatePath("/my-journey");

  return data as Companion;
};

const fetchCompanions = async (
  { subject, topic }: Pick<GetAllCompanionsInput, "subject" | "topic">,
  from: number,
  to: number
) => {
  const supabase = createSupabaseClient();
  const normalizedSubject = normalizeFilterValue(subject);
  const normalizedTopic = normalizeFilterValue(topic);

  // Stable ordering keeps pages consistent between requests.
  let query = supabase
    .from("companions")
    .select()
    .order("id", { ascending: true });

  if (normalizedSubject) {
    query = query.ilike("subject", toIlikePattern(normalizedSubject));
  }

  if (normalizedTopic) {
    const pattern = quoteFilterValue(toIlikePattern(normalizedTopic));
    query = query.or(`topic.ilike.${pattern},name.ilike.${pattern}`);
  }

  const { data, error } = await query.range(from, to);

  if (error) {
    logActionError("getAllCompanions", error, {
      from,
      to,
      normalizedSubject,
      normalizedTopic,
    });
    throw new Error(
      getDatabaseErrorMessage(error, "We could not load companions right now.")
    );
  }

  return (data ?? []) as Companion[];
};

export const getAllCompanions = async ({
  limit = 10,
  page = 1,
  subject,
  topic,
}: GetAllCompanionsInput) =>
  fetchCompanions({ subject, topic }, (page - 1) * limit, page * limit - 1);

// Fetches one extra row so callers know whether a next page exists.
export const getCompanionsPage = async ({
  limit = 9,
  page = 1,
  subject,
  topic,
}: GetAllCompanionsInput) => {
  const from = (page - 1) * limit;
  const rows = await fetchCompanions({ subject, topic }, from, from + limit);

  return { companions: rows.slice(0, limit), hasMore: rows.length > limit };
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

// Scoped to the signed-in user; signed-out visitors get an empty list.
export const getRecentSessions = async (limit = 10): Promise<Companion[]> => {
  const { userId } = await auth();

  if (!userId) {
    return [];
  }

  return getUserSessions(userId, limit);
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
  const { userId, limit } = await getCompanionLimit();

  if (!userId || limit === 0) {
    return false;
  }

  if (!Number.isFinite(limit)) {
    return true;
  }

  const count = await countUserCompanions(createSupabaseClient(), userId);

  return count < limit;
};
