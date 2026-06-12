import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveBrandLogo } from "@/lib/brand-uploads";
import { saveUpload } from "@/lib/uploads";
import { createAuditLog, getClientIp, getUserAgent } from "@/lib/audit";
import { findExistingDuplicate, DUPLICATE_UPLOAD_MESSAGE } from "@/lib/media-dedup";
import { computeFileHash } from "@/lib/media-hash";
import { getImageDimensions } from "@/lib/image-dimensions";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const altText = (formData.get("altText") as string) ?? "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const context = request.nextUrl.searchParams.get("context");
    if (context === "brand") {
      const brandBuffer = Buffer.from(await file.arrayBuffer());
      const brandHash = computeFileHash(brandBuffer);
      const brandDims = getImageDimensions(brandBuffer, file.type);

      const brandDuplicate = await findExistingDuplicate({
        fileHash: brandHash,
        originalName: file.name,
        size: brandBuffer.length,
        width: brandDims?.width ?? null,
        height: brandDims?.height ?? null,
      });

      if (brandDuplicate) {
        await createAuditLog({
          userId: session.user.id,
          actorName: session.user.name ?? null,
          actorEmail: session.user.email ?? null,
          action: "FILE_UPLOADED",
          module: "Media",
          recordName: file.name,
          recordId: brandDuplicate.asset.id,
          ipAddress: getClientIp(request.headers),
          userAgent: getUserAgent(request.headers),
          targetType: "Media File",
          displayAction: "Created",
          summary: `Blocked duplicate brand logo upload of "${file.name}"`,
          details: { duplicate: true, matchKind: brandDuplicate.kind },
        });

        return NextResponse.json(
          {
            error: "duplicate",
            message: DUPLICATE_UPLOAD_MESSAGE,
            existing: {
              id: brandDuplicate.asset.id,
              url: brandDuplicate.asset.url,
              originalName: brandDuplicate.asset.originalName,
              size: brandDuplicate.asset.size,
              width: brandDuplicate.asset.width,
              height: brandDuplicate.asset.height,
            },
          },
          { status: 409 }
        );
      }

      const saved = await saveBrandLogo(file);
      const asset = await prisma.mediaAsset.create({
        data: {
          filename: saved.filename,
          originalName: saved.originalName,
          mimeType: saved.mimeType,
          size: saved.size,
          url: saved.url,
          width: saved.width,
          height: saved.height,
          fileHash: saved.fileHash,
          altText: altText || saved.originalName,
          uploadedBy: session.user.name ?? session.user.email ?? null,
        },
      });

      await createAuditLog({
        userId: session.user.id,
        actorName: session.user.name ?? null,
        actorEmail: session.user.email ?? null,
        action: "FILE_UPLOADED",
        module: "Media",
        recordName: asset.originalName,
        recordId: asset.id,
        ipAddress: getClientIp(request.headers),
        summary: `Uploaded brand logo "${asset.originalName}"`,
      });

      return NextResponse.json(asset);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileHash = computeFileHash(buffer);
    const dims = getImageDimensions(buffer, file.type);

    const duplicate = await findExistingDuplicate({
      fileHash,
      originalName: file.name,
      size: buffer.length,
      width: dims?.width ?? null,
      height: dims?.height ?? null,
    });

    if (duplicate) {
      await createAuditLog({
        userId: session.user.id,
        actorName: session.user.name ?? null,
        actorEmail: session.user.email ?? null,
        action: "FILE_UPLOADED",
        module: "Media",
        recordName: file.name,
        recordId: duplicate.asset.id,
        ipAddress: getClientIp(request.headers),
        summary: `Blocked duplicate upload of "${file.name}" — already exists as "${duplicate.asset.originalName}"`,
        details: { duplicate: true, matchKind: duplicate.kind },
      });

      return NextResponse.json(
        {
          error: "duplicate",
          message: DUPLICATE_UPLOAD_MESSAGE,
          existing: {
            id: duplicate.asset.id,
            url: duplicate.asset.url,
            originalName: duplicate.asset.originalName,
            size: duplicate.asset.size,
            width: duplicate.asset.width,
            height: duplicate.asset.height,
          },
        },
        { status: 409 }
      );
    }

    const saved = await saveUpload(file);

    const asset = await prisma.mediaAsset.create({
      data: {
        filename: saved.filename,
        originalName: saved.originalName,
        mimeType: saved.mimeType,
        size: saved.size,
        url: saved.url,
        width: saved.width,
        height: saved.height,
        fileHash: saved.fileHash,
        altText: altText || saved.originalName,
        uploadedBy: session.user.name ?? session.user.email ?? null,
      },
    });

    await createAuditLog({
      userId: session.user.id,
      actorName: session.user.name ?? null,
      actorEmail: session.user.email ?? null,
      action: "FILE_UPLOADED",
      module: "Media",
      recordName: asset.originalName,
      recordId: asset.id,
      ipAddress: getClientIp(request.headers),
      summary: `Uploaded file "${asset.originalName}"`,
      details: {
        changes: [
          `File type: ${asset.mimeType}`,
          `Size: ${asset.size} bytes`,
          asset.width && asset.height ? `Dimensions: ${asset.width}×${asset.height}` : null,
          `Saved as: ${asset.url}`,
        ].filter(Boolean),
      },
    });

    return NextResponse.json(asset);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
