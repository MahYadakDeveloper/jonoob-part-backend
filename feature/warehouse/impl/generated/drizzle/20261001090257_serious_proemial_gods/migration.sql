CREATE SCHEMA "warehouse";
--> statement-breakpoint
CREATE TYPE "warehouse"."barcode_type" AS ENUM('UPC_A', 'UPC_E', 'EAN_13', 'EAN_8', 'Code39', 'Code93', 'Code128', 'Codabar');--> statement-breakpoint
CREATE TYPE "warehouse"."unit_of_measure" AS ENUM('piece', 'pair', 'set');--> statement-breakpoint
CREATE TABLE "warehouse"."movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"idempotency_key" uuid NOT NULL,
	"items" jsonb NOT NULL,
	"direction" varchar NOT NULL,
	"source_type" varchar NOT NULL,
	"source_boundary" varchar,
	"reference_id" uuid,
	"reason" text,
	"reverses_id" uuid UNIQUE,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_direction" CHECK ("direction" in ('inbound', 'outbound')),
	CONSTRAINT "chk_source_type" CHECK ("source_type" in ('adjustment', 'procurement', 'sales', 'return')),
	CONSTRAINT "chk_source_boundary" CHECK ("source_boundary" in ('order', 'supply', 'pos'))
);
--> statement-breakpoint
CREATE TABLE "warehouse"."quarantines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"stockId" uuid NOT NULL,
	"referenceId" varchar NOT NULL,
	"reason" text NOT NULL,
	"qty" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warehouse"."reserves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"reference_id" varchar NOT NULL,
	"stock_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	CONSTRAINT "uq_ref_id_stock_id" UNIQUE("reference_id","stock_id")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."stocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"barcodeValue" text NOT NULL,
	"barcodeType" "warehouse"."barcode_type" NOT NULL,
	"qty" integer DEFAULT 0 NOT NULL,
	"unitOfMeasure" "warehouse"."unit_of_measure" NOT NULL,
	"storageLocation" text,
	CONSTRAINT "stocks_barcodeType_barcodeValue_unique" UNIQUE("barcodeType","barcodeValue")
);
--> statement-breakpoint
ALTER TABLE "warehouse"."movements" ADD CONSTRAINT "movements_reverses_id_movements_id_fkey" FOREIGN KEY ("reverses_id") REFERENCES "warehouse"."movements"("id");--> statement-breakpoint
ALTER TABLE "warehouse"."quarantines" ADD CONSTRAINT "quarantines_stockId_stocks_id_fkey" FOREIGN KEY ("stockId") REFERENCES "warehouse"."stocks"("id");--> statement-breakpoint
ALTER TABLE "warehouse"."reserves" ADD CONSTRAINT "reserves_stock_id_stocks_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "warehouse"."stocks"("id");