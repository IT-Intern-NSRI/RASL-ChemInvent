-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "password" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lab" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Lab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogSection" (
    "id" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "parentId" TEXT,
    "label" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CatalogSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogItem" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "catalogNo" TEXT,
    "quantityRaw" TEXT NOT NULL,
    "footnote" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryDocument" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "formNo" TEXT NOT NULL DEFAULT 'RASL Form 19 Appendix 4.5.1a',
    "section" TEXT NOT NULL DEFAULT 'Management Procedure',
    "issueNo" TEXT NOT NULL DEFAULT '01',
    "issueDate" TEXT NOT NULL DEFAULT '15 August 2017',
    "authorizedBy" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocSection" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "labId" TEXT,
    "parentId" TEXT,
    "label" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DocSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocItem" (
    "id" TEXT NOT NULL,
    "docSectionId" TEXT NOT NULL,
    "catalogItemId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "catalogNo" TEXT,
    "quantityRaw" TEXT NOT NULL,
    "footnote" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DocItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuarterEntry" (
    "id" TEXT NOT NULL,
    "docItemId" TEXT NOT NULL,
    "quarter" INTEGER NOT NULL,
    "currentInventory" DOUBLE PRECISION,
    "forPurchase" DOUBLE PRECISION,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuarterEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Lab_name_key" ON "Lab"("name");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryDocument_year_key" ON "InventoryDocument"("year");

-- CreateIndex
CREATE UNIQUE INDEX "QuarterEntry_docItemId_quarter_key" ON "QuarterEntry"("docItemId", "quarter");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogSection" ADD CONSTRAINT "CatalogSection_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogSection" ADD CONSTRAINT "CatalogSection_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CatalogSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogItem" ADD CONSTRAINT "CatalogItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "CatalogSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryDocument" ADD CONSTRAINT "InventoryDocument_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocSection" ADD CONSTRAINT "DocSection_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "InventoryDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocSection" ADD CONSTRAINT "DocSection_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "DocSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocItem" ADD CONSTRAINT "DocItem_docSectionId_fkey" FOREIGN KEY ("docSectionId") REFERENCES "DocSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocItem" ADD CONSTRAINT "DocItem_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuarterEntry" ADD CONSTRAINT "QuarterEntry_docItemId_fkey" FOREIGN KEY ("docItemId") REFERENCES "DocItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuarterEntry" ADD CONSTRAINT "QuarterEntry_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
