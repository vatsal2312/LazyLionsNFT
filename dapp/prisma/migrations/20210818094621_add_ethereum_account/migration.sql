-- CreateTable
CREATE TABLE "EthereumAccount" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EthereumAccount_userId_unique" ON "EthereumAccount"("userId");

-- AddForeignKey
ALTER TABLE "EthereumAccount" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
