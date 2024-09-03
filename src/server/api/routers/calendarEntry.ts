import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const calendarEntryRouter = createTRPCRouter({
  createEntryWithNewRecipe: protectedProcedure
    .input(z.object({ name: z.string(), date: z.date() }))
    .mutation(async ({ ctx, input }) => {
      const recipe = await ctx.db.recipe.create({
        data: {
          name: input.name,
          userId: ctx.session.user.id,
        },
      });
      const maxOrder = await ctx.db.calendarEntry.findFirst({
        where: { date: input.date, userId: ctx.session.user.id },
        orderBy: { order: "desc" },
        select: { order: true },
      });

      const newOrder = maxOrder ? maxOrder.order + 1 : 1;

      return ctx.db.calendarEntry.create({
        data: {
          recipeId: recipe.id,
          date: input.date,
          userId: ctx.session.user.id,
          order: newOrder,
        },
      });
    }),

  createWithExistingRecipe: protectedProcedure
    .input(z.object({ recipeId: z.number(), date: z.date() }))
    .mutation(async ({ ctx, input }) => {
      const maxOrder = await ctx.db.calendarEntry.findFirst({
        where: { date: input.date, userId: ctx.session.user.id },
        orderBy: { order: "desc" },
        select: { order: true },
      });

      const newOrder = maxOrder ? maxOrder.order + 1 : 1;

      return ctx.db.calendarEntry.create({
        data: {
          recipeId: input.recipeId,
          date: input.date,
          userId: ctx.session.user.id,
          order: newOrder,
        },
      });
    }),

  getByMonth: protectedProcedure
    .input(z.object({ month: z.number(), year: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.calendarEntry.findMany({
        where: {
          userId: ctx.session.user.id,
          date: {
            gte: new Date(input.year, input.month, 1),
            lt: new Date(input.year, input.month + 1, 1),
          },
        },
        orderBy: [{ date: "asc" }, { order: "asc" }],
        include: { recipe: true },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        recipeId: z.number(),
        date: z.date(),
        order: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.calendarEntry.update({
        where: { id: input.id, userId: ctx.session.user.id },
        data: {
          recipeId: input.recipeId,
          date: input.date,
          order: input.order,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.calendarEntry.delete({
        where: { id: input.id, userId: ctx.session.user.id },
      });
    }),
});
