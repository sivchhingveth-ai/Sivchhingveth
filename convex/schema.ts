import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  habits: defineTable({
    userId: v.string(),
    name: v.string(),
    category: v.string(),
    history: v.any(), // Record<string, boolean>
    streak: v.number(),
    time: v.optional(v.union(v.string(), v.null())),
    monthlyTarget: v.optional(v.union(v.number(), v.null())),
  }).index("by_user", ["userId"]),

  savingGoals: defineTable({
    userId: v.string(),
    name: v.string(),
    goal: v.number(),
    saved: v.number(),
    color: v.string(),
    startDate: v.string(),
    targetDate: v.string(),
    history: v.any(), // Record<string, number>
  }).index("by_user", ["userId"]),
});
