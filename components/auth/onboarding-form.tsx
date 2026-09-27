"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { createOrganization, currentUserQueryKey } from "@/lib/auth";

const onboardingSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter your restaurant's name.")
    .max(80, "That name is too long."),
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

export function OnboardingForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    mode: "onBlur",
    defaultValues: { name: "" },
  });

  const create = useMutation({
    mutationFn: createOrganization,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
      router.push("/dashboard");
    },
  });

  const formError =
    create.error instanceof ApiError
      ? create.error.message
      : create.error
        ? "Something went wrong. Try again."
        : null;

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => {
          create.mutate(values);
        })}
        noValidate
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Restaurant name</FormLabel>
              <FormControl>
                <Input autoComplete="organization" className="h-10" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {formError ? (
          <p className="text-sm text-destructive">{formError}</p>
        ) : null}
        <Button type="submit" className="h-10 w-full" disabled={create.isPending}>
          {create.isPending ? "Saving…" : "Continue to dashboard"}
        </Button>
      </form>
    </Form>
  );
}
