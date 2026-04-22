import { z } from "zod";

export const companionFormSchema = z.object({
  name: z.string().min(1, { message: "Companion name is required." }),
  subject: z.string().min(1, { message: "Subject is required." }),
  topic: z.string().min(1, { message: "Topic is required." }),
  voice: z.string().min(1, { message: "Voice is required." }),
  style: z.string().min(1, { message: "Style is required." }),
  duration: z.coerce
    .number()
    .int({ message: "Duration must be a whole number." })
    .min(1, { message: "Duration is required." }),
});

export type CompanionFormValues = z.infer<typeof companionFormSchema>;
