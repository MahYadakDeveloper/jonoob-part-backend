CREATE SCHEMA "actors";
--> statement-breakpoint
CREATE SCHEMA "order";
--> statement-breakpoint
CREATE TYPE "actors"."address_scope" AS ENUM('intra_city', 'inter_city');--> statement-breakpoint
CREATE TYPE "actors"."customer_type" AS ENUM('merchant', 'consumer', 'technician');--> statement-breakpoint
CREATE TYPE "actors"."technician_specialty" AS ENUM('electrical', 'mechanical', 'body_repair', 'painting', 'tire_service', 'detailing');--> statement-breakpoint
CREATE TYPE "actors"."wallet_transaction_reason" AS ENUM('cashback', 'manual_adjustment', 'refund', 'payment', 'withdrawal', 'cashback_reversal', 'withdrawal_request', 'manual');--> statement-breakpoint
CREATE TYPE "actors"."wallet_transaction_type" AS ENUM('deposit', 'withdraw', 'freeze', 'unfreeze');--> statement-breakpoint
CREATE TABLE "actors"."couriers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"full_name" text NOT NULL,
	"phone" text NOT NULL UNIQUE,
	"hashed_password" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "actors"."addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"customer_id" uuid NOT NULL,
	"scope" "actors"."address_scope" NOT NULL,
	"city_id" integer NOT NULL,
	"address" text NOT NULL,
	"province_id" integer,
	"postal_code" varchar,
	"latitude" double precision,
	"longitude" double precision,
	CONSTRAINT "chk_addresses_inter_city_required" CHECK ("scope" <> 'inter_city' OR ("province_id" IS NOT NULL AND "postal_code" IS NOT NULL)),
	CONSTRAINT "chk_addresses_coordinate_pair" CHECK (("latitude" IS NULL) = ("longitude" IS NULL)),
	CONSTRAINT "chk_addresses_coordinate_intra_only" CHECK ("scope" = 'intra_city' OR "latitude" IS NULL)
);
--> statement-breakpoint
CREATE TABLE "actors"."customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"full_name" varchar NOT NULL,
	"phone" varchar NOT NULL UNIQUE,
	"type" "actors"."customer_type" NOT NULL,
	"specialty" "actors"."technician_specialty",
	CONSTRAINT "chk_technician_specialty_required" CHECK (("type" = 'technician') = ("specialty" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "actors"."freezed_amounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"wallet_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"reason" "actors"."wallet_transaction_reason" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "actors"."wallet_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"wallet_id" uuid NOT NULL,
	"idempotency_key" varchar NOT NULL,
	"type" "actors"."wallet_transaction_type" NOT NULL,
	"amount" bigint NOT NULL,
	"reason" "actors"."wallet_transaction_reason" NOT NULL,
	"description" text,
	"freezed_amount_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_wallet_tx_idempotency" UNIQUE("wallet_id","idempotency_key"),
	CONSTRAINT "chk_wallet_tx_amount_positive" CHECK ("amount" > 0),
	CONSTRAINT "chk_wallet_tx_freeze_ref" CHECK ("type" <> 'freeze' OR "freezed_amount_id" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "actors"."wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"customer_id" uuid NOT NULL UNIQUE,
	"total" bigint DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_wallets_total_non_negative" CHECK ("total" >= 0)
);
--> statement-breakpoint
CREATE TABLE "actors"."managers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"full_name" text NOT NULL,
	"phone" text NOT NULL UNIQUE,
	"hashed_password" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order"."deliveries" (
	"courier_id" uuid
);
--> statement-breakpoint
CREATE TABLE "order"."orders" (

);
--> statement-breakpoint
ALTER TABLE "warehouse"."movements" ADD CONSTRAINT "movements_id_source_type_unique" UNIQUE("id","source_type");--> statement-breakpoint
CREATE INDEX "idx_addresses_customer_id" ON "actors"."addresses" ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_wallet_tx_freezed_amount" ON "actors"."wallet_transactions" ("freezed_amount_id");--> statement-breakpoint
ALTER TABLE "actors"."addresses" ADD CONSTRAINT "addresses_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "actors"."customers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "actors"."freezed_amounts" ADD CONSTRAINT "freezed_amounts_wallet_id_wallets_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "actors"."wallets"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "actors"."wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_wallets_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "actors"."wallets"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "actors"."wallet_transactions" ADD CONSTRAINT "wallet_transactions_freezed_amount_id_freezed_amounts_id_fkey" FOREIGN KEY ("freezed_amount_id") REFERENCES "actors"."freezed_amounts"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "actors"."wallets" ADD CONSTRAINT "wallets_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "actors"."customers"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "order"."deliveries" ADD CONSTRAINT "deliveries_courier_id_couriers_id_fkey" FOREIGN KEY ("courier_id") REFERENCES "actors"."couriers"("id");