-- CreateTable
CREATE TABLE "DiscordChecks" (
    "id" SERIAL NOT NULL,
    "diamondPaws" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,

    PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DiscordChecks" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
