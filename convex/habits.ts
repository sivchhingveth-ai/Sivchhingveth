import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    category: v.string(),
    time: v.optional(v.union(v.string(), v.null())),
    monthlyTarget: v.optional(v.union(v.number(), v.null())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.insert("habits", {
      userId,
      name: args.name,
      category: args.category,
      history: {},
      streak: 0,
      time: args.time,
      monthlyTarget: args.monthlyTarget,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("habits"),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    time: v.optional(v.union(v.string(), v.null())),
    monthlyTarget: v.optional(v.union(v.number(), v.null())),
    history: v.optional(v.any()),
    streak: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const habit = await ctx.db.get(args.id);
    if (!habit || habit.userId !== userId) throw new Error("Not found");

    const { id, ...updates } = args;
    // Filter out undefined values
    const cleanUpdates: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    }
    
    await ctx.db.patch(args.id, cleanUpdates);
  },
});

export const remove = mutation({
  args: { id: v.id("habits") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const habit = await ctx.db.get(args.id);
    if (!habit || habit.userId !== userId) throw new Error("Not found");
    
    await ctx.db.delete(args.id);
  },
});
