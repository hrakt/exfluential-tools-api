const { pgTable, serial, text, boolean, timestamp } = require('drizzle-orm/pg-core');

const tools = pgTable('tools', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    type: text('type').notNull(),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
});

module.exports = { tools };