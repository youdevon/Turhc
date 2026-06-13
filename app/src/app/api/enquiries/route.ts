import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ENQUIRY_TYPE_VALUES } from "@/lib/enquiry-types";
import { createEnquiry } from "@/lib/enquiry-service";
import { checkRateLimit, sanitizeText } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/audit";

const schema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  companyName: z.string().max(200).optional().nullable(),
  email: z.string().email().max(254),
  phone: z.string().max(50).optional().nullable(),
  enquiryType: z
    .string()
    .refine((val) => (ENQUIRY_TYPE_VALUES as readonly string[]).includes(val), "Invalid enquiry type"),
  subject: z.string().max(300).optional().nullable(),
  message: z.string().min(10).max(10000),
  relatedTenderRef: z.string().max(100).optional().nullable(),
  relatedProjectRef: z.string().max(100).optional().nullable(),
  _hp_website: z.string().max(0).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers) ?? "unknown";
    const rate = await checkRateLimit(`enquiry:${ip}`);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();

    if (body._hp_website) {
      return NextResponse.json({ success: true });
    }

    const parsed = schema.parse({
      ...body,
      firstName: sanitizeText(body.firstName, 100),
      lastName: sanitizeText(body.lastName, 100),
      companyName: sanitizeText(body.companyName, 200) || null,
      email: sanitizeText(body.email, 254).toLowerCase(),
      phone: sanitizeText(body.phone, 50) || null,
      enquiryType: sanitizeText(body.enquiryType, 50),
      subject: sanitizeText(body.subject, 300) || null,
      message: sanitizeText(body.message, 10000),
      relatedTenderRef: sanitizeText(body.relatedTenderRef, 100) || null,
      relatedProjectRef: sanitizeText(body.relatedProjectRef, 100) || null,
    });

    const enquiry = await createEnquiry(parsed);

    return NextResponse.json({ success: true, id: enquiry.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Please check your form and try again." },
        { status: 400 }
      );
    }
    console.error("Enquiry submission failed:", error);
    return NextResponse.json(
      { error: "Unable to submit your enquiry right now. Please try again later." },
      { status: 500 }
    );
  }
}
