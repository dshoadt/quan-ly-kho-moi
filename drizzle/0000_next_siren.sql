CREATE TABLE "materials" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"unit" varchar(50) NOT NULL,
	"location" varchar(255),
	"min_stock" double precision DEFAULT 0 NOT NULL,
	"max_stock" double precision DEFAULT 0 NOT NULL,
	"current_stock" double precision DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "materials_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "procurement_items" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"procurement_id" varchar(128) NOT NULL,
	"material_id" varchar(128) NOT NULL,
	"quantity" double precision NOT NULL,
	"supplier" varchar(255),
	"priority" varchar(20) DEFAULT 'NORMAL' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "procurements" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'DRAFT' NOT NULL,
	"priority" varchar(20) DEFAULT 'NORMAL' NOT NULL,
	"order_date" timestamp DEFAULT now() NOT NULL,
	"expected_date" timestamp,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "procurements_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"type" varchar(20) NOT NULL,
	"material_id" varchar(128) NOT NULL,
	"quantity" double precision NOT NULL,
	"customer" varchar(255),
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"role" varchar(20) DEFAULT 'USER' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "procurement_items" ADD CONSTRAINT "procurement_items_procurement_id_procurements_id_fk" FOREIGN KEY ("procurement_id") REFERENCES "public"."procurements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procurement_items" ADD CONSTRAINT "procurement_items_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE no action ON UPDATE no action;