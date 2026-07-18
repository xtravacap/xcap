-- CreateIndex
CREATE UNIQUE INDEX "borrowers_organizationId_email_key" ON "borrowers"("organizationId", "email");
