diff --git a//dev/null b/prisma/migrations/20250307_add_cart_tables/migration.sql
index 0000000000000000000000000000000000000000..f4aa55b1391877c5c5559a43d8a2e0bc91b391e1 100644
--- a//dev/null
+++ b/prisma/migrations/20250307_add_cart_tables/migration.sql
@@ -0,0 +1,38 @@
+-- CreateTable
+CREATE TABLE "Cart" (
+    "id" TEXT NOT NULL,
+    "userId" TEXT NOT NULL,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+
+    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "CartItem" (
+    "id" TEXT NOT NULL,
+    "cartId" TEXT NOT NULL,
+    "packageId" TEXT NOT NULL,
+    "quantity" INTEGER NOT NULL DEFAULT 1,
+    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+
+    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateIndex
+CREATE UNIQUE INDEX "Cart_userId_key" ON "Cart"("userId");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "CartItem_cartId_packageId_key" ON "CartItem"("cartId", "packageId");
+
+-- CreateIndex
+CREATE INDEX "CartItem_packageId_idx" ON "CartItem"("packageId");
+
+-- AddForeignKey
+ALTER TABLE "Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "HealthPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
