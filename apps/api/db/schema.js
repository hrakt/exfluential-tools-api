const { pgTable, serial, text, boolean, timestamp, integer } = require('drizzle-orm/pg-core');

const tools = pgTable('tools', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    type: text('type').notNull(),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
});


const requests = pgTable('requests', {
    id: serial('id').primaryKey(),
    doctorName: text('doctor_name').notNull(),
    practiceName: text('practice_name').notNull(),
    practiceType: text('practice_type').notNull(),
    channel: text('channel').notNull(),
    primaryMessage: text('primary_message').notNull(),
    status: text('status').notNull().default('pending'),
    assetUrl: text('asset_url'),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

const jobs = pgTable('jobs', {
    id: serial('id').primaryKey(),
    requestId: integer('requestId').notNull().references(() => requests.id),
    type: text('type').notNull(),
    status: text('status').notNull().default('queued'),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
});

module.exports = { tools, jobs, requests };
