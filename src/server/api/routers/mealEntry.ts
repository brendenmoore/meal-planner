import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const mealEntryRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        mealName: z.string().min(1),
        description: z.string().optional(),
        templateId: z.string().min(1),
        position: z.number().int().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.mealEntry.create({
        data: {
          ...input,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        mealName: z.string().min(1),
        description: z.string().optional(),
        position: z.number().int().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      return ctx.db.mealEntry.update({
        where: { id },
        data: updateData,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.mealEntry.delete({
        where: { id: input.id },
      });
    }),

  getAll: protectedProcedure
    .input(z.object({ templateId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.mealEntry.findMany({
        where: {
          template: { id: input.templateId },
        },
        orderBy: { position: "asc" },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.mealEntry.findUnique({
        where: { id: input.id },
      });
    }),
});
