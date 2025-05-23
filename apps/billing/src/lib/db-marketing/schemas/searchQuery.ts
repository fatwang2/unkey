import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  int,
  mysqlTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import type { z } from "zod";
import { entries } from "./entries";
import { firecrawlResponses } from "./firecrawl";
import { serperSearchResponses } from "./serper";

export const searchQueries = mysqlTable(
  "search_queries",
  {
    id: int("id").primaryKey().autoincrement(),
    inputTerm: varchar("input_term", { length: 767 }).notNull(),
    query: text("query").notNull(),
    isTermAsQueryAmbiguous: boolean("is_term_as_query_ambiguous").notNull().default(false),
    ambiguityReason: text("ambiguity_reason").notNull().default(""),
    clarifyingContext: text("clarifying_context").notNull().default(""),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    inputTermIdx: index("input_term_idx").on(table.inputTerm),
    uniqueInputTerm: unique("search_queries_input_term_unique").on(table.inputTerm),
  }),
);

export const insertSearchQuerySchema = createInsertSchema(searchQueries).extend({});

export type NewSearchQueryParams = z.infer<typeof insertSearchQuerySchema>;

// every searchQuery can have an optional 1:1 serperResult searchResponses associated with it
// because the fk is stored in the serperResult table, the searchQueries relation have neither fields nor references
export const searchQueryRelations = relations(searchQueries, ({ one, many }) => ({
  searchResponse: one(serperSearchResponses, {
    fields: [searchQueries.inputTerm],
    references: [serperSearchResponses.inputTerm],
  }),
  firecrawlResponses: many(firecrawlResponses),
  entry: one(entries, {
    fields: [searchQueries.inputTerm],
    references: [entries.inputTerm],
  }),
}));

export type SearchQuery = typeof searchQueries.$inferSelect;
export type NewSearchQuery = typeof searchQueries.$inferInsert;
