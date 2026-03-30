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
    time: v.optional(v.union(v.string(), v.null())),
    monthlyTarget: v.optional(v.union(v.number(), v.null())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.insert("habits", {
      userId,
      name: args.name,
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
    time: v.optional(v.union(v.string(), v.null())),
    monthlyTarget: v.optional(v.union(v.number(), v.null())),
    history: v.optional(v.any()),
    streak: v.optional(v.number()),
    todayStr: v.optional(v.string()), // For proper streak context - updated
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const habit = await ctx.db.get(args.id);
    if (!habit || habit.userId !== userId) throw new Error("Not found");

    const { id, todayStr, ...updates } = args;
    // Filter out undefined values
    const cleanUpdates: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    }
    
    // Recalculate streak if history is updated
    if (cleanUpdates.history) {
      const history = cleanUpdates.history as Record<string, boolean>;
      const today = todayStr || new Date().toISOString().split('T')[0];
      
      let streak = 0;
      const [y, m, day] = today.split('-').map(Number);
      const curr = new Date(y, m - 1, day);

      const toStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      // If done today, start from today
      if (history[today]) {
        streak++;
        curr.setDate(curr.getDate() - 1);
      } else {
        // If NOT done today, start checking from yesterday to keep an existing streak alive
        curr.setDate(curr.getDate() - 1);
      }

      while (history[toStr(curr)]) {
        streak++;
        curr.setDate(curr.getDate() - 1);
        if (streak > 365) break; 
      }
      cleanUpdates.streak = streak;
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

export const resetAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Delete all habits
    const userHabits = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
      
    for (const habit of userHabits) {
      await ctx.db.delete(habit._id);
    }

    // Delete all saving goals
    const userGoals = await ctx.db
      .query("savingGoals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
      
    for (const goal of userGoals) {
      await ctx.db.delete(goal._id);
    }
  },
});


