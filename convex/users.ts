import { query } from "./_generated/server";
import { v } from "convex/values";

export const checkEmailExists = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase();
    
    // Check the users table from authTables
    // Note: We use filter because the users table might not have 
    // a customized index in this schema, though standard authTables has them.
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), normalizedEmail))
      .first();
    
    return !!user;
  },
});
