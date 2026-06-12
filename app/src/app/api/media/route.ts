import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const assets = await prisma.mediaAsset.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      url: true,
      originalName: true,
      mimeType: true,
      altText: true,
      width: true,
      height: true,
      size: true,
    },
  });

  return NextResponse.json(assets);
}
