import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const recipeRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.recipe.create({
        data: {
          name: input.name,
          userId: ctx.session.user.id,
        },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.recipe.findUnique({
        where: { id: input.id, userId: ctx.session.user.id },
      });
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.recipe.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "asc" },
    });
  }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.recipe.update({
        where: { id: input.id, userId: ctx.session.user.id },
        data: { name: input.name },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.recipe.delete({
        where: { id: input.id, userId: ctx.session.user.id },
      });
    }),
});
