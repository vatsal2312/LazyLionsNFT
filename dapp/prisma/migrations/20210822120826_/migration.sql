-- CreateTable
CREATE TABLE "TwitterChecks" (
    "id" INTEGER NOT NULL,
    "profilePictureUrl" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "containsEmojii" BOOLEAN NOT NULL,
    "hasNFTAsPFP" BOOLEAN NOT NULL,
    "pfpMatch" INTEGER NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TwitterChecks" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
