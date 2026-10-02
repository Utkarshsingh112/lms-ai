import { cache } from "react";

import { getCompanion } from "@/lib/actions/companions.action";

// Deduplicates the lookup within one request, so `generateMetadata` and the
// page itself share a single database query.
export const getCompanionOnce = cache((id: string) => getCompanion(id));
