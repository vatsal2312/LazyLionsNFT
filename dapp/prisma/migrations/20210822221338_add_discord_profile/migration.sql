-- CreateTable
CREATE TABLE "DiscordProfile" (
    "id" SERIAL NOT NULL,
    "discordId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "userId" TEXT,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscordProfile_userId_unique" ON "DiscordProfile"("userId");

-- AddForeignKey
ALTER TABLE "DiscordProfile" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
