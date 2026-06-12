import { PrismaClient, ContentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { STOCK_IMAGES, PAGE_HERO_DEFAULTS, HERO_PAGE_TYPE_IMAGES } from "../src/data/stock-images";
import { DEFAULT_NAV_LINKS } from "../src/lib/header-config";
import {
  LANDING_PAGE_DEFAULTS,
  LANDING_PAGE_SLUG,
  LANDING_SECTION_KEYS,
} from "../src/lib/landing-page";
import { applyLandingV2PagePayload } from "../src/lib/landing-page-v2-apply";
import { LANDING_V2_DEFAULTS } from "../src/lib/landing-page-v2";

const prisma = new PrismaClient();

const HERO_IMAGES = [
  STOCK_IMAGES.road,
  STOCK_IMAGES.bridge,
  STOCK_IMAGES.construction,
];

async function main() {
  console.log("Seeding database...");

  const adminRole = await prisma.role.upsert({
    where: { name: "Administrator" },
    update: {},
    create: { name: "Administrator", description: "Full system access" },
  });

  await prisma.role.upsert({
    where: { name: "Editor" },
    update: {},
    create: { name: "Editor", description: "Content management access" },
  });

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@infrastructure.local";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "System Administrator",
      passwordHash: await bcrypt.hash(adminPassword, 12),
      roleId: adminRole.id,
      status: "ACTIVE",
    },
  });

  const settings = [
    { key: "orgName", value: "National Infrastructure Delivery Corporation", label: "Organisation Name" },
    { key: "orgSubtitle", value: "A Government-Owned Special Purpose Enterprise", label: "Subtitle" },
    { key: "orgTagline", value: "Building the foundations of tomorrow", label: "Tagline" },
    { key: "contactEmail", value: "info@infrastructure.gov", label: "Contact Email" },
    { key: "enquiryEmailForwardingEnabled", value: "true", label: "Enquiry Email Forwarding" },
    { key: "enquiryForwardTo", value: "info@infrastructure.gov", label: "Forward Enquiries To" },
    { key: "enquiryEmailSubjectPrefix", value: "New Website Enquiry", label: "Enquiry Email Subject Prefix" },
    { key: "contactPhone", value: "+1 (800) 555-0199", label: "Contact Phone" },
    { key: "contactAddress", value: "100 Capital Boulevard, Government District", label: "Address" },
    { key: "footerText", value: "Delivering critical infrastructure for the nation with transparency and excellence.", label: "Footer" },
    {
      key: "whoWeAreText",
      value: "The National Infrastructure Delivery Corporation is a special-purpose state enterprise established to accelerate the delivery of critical public infrastructure. We combine government accountability with private-sector efficiency.",
      label: "Who We Are",
    },
    {
      key: "mandateText",
      value: "We are mandated to plan, procure, and deliver major public infrastructure projects on behalf of the state, ensuring transparency, value for money, and world-class engineering standards.",
      label: "Mandate",
    },
    {
      key: "deliveryStatsJson",
      value: JSON.stringify([
        { label: "Active Projects", value: "24" },
        { label: "Capital Deployed", value: "$4.2B" },
        { label: "On-Time Delivery", value: "92%" },
        { label: "Contractors Registered", value: "380+" },
      ]),
      label: "Delivery Stats",
    },
    { key: "activeTheme", value: "dark", label: "Active Theme" },
    { key: "primaryAccentColor", value: "#3b82f6", label: "Primary Accent Color" },
    { key: "secondaryAccentColor", value: "#d4a853", label: "Secondary Accent Color" },
    { key: "heroOverlayDarkness", value: "0.55", label: "Hero Overlay Darkness" },
    { key: "brandDisplayText", value: "", label: "Header Brand Text" },
    { key: "brandDisplayMode", value: "full_logo", label: "Brand Display Mode" },
    { key: "headerBrandSubtitle", value: "", label: "Header Brand Subtitle" },
    { key: "showBrandText", value: "false", label: "Show Brand Text" },
    { key: "showBrandSubtitle", value: "false", label: "Show Brand Subtitle" },
    { key: "logoAlt", value: "", label: "Logo Alt Text" },
    { key: "logoMediaIdWhite", value: "", label: "White Logo" },
    { key: "logoMediaIdColored", value: "", label: "Colored Logo" },
    { key: "logoMediaIdDark", value: "", label: "White Logo (legacy)" },
    { key: "logoMediaIdLight", value: "", label: "Colored Logo (legacy)" },
    { key: "logoMediaIdCompact", value: "", label: "Compact Colored Logo" },
    { key: "logoMediaIdCompactWhite", value: "", label: "Compact White Logo" },
    { key: "headerLogoVariantMode", value: "always_white", label: "Logo Variant Mode" },
    { key: "showLogoImage", value: "true", label: "Show Logo Image" },
    { key: "headerLogoHeightDesktop", value: "64", label: "Logo Height Desktop" },
    { key: "headerLogoHeightMobile", value: "48", label: "Logo Height Mobile" },
    { key: "headerLogoMaxWidthDesktop", value: "400", label: "Logo Max Width Desktop" },
    { key: "headerLogoMaxWidthMobile", value: "280", label: "Logo Max Width Mobile" },
    { key: "headerBrandZoneWidthDesktop", value: "380", label: "Brand Zone Width Desktop" },
    { key: "headerStyle", value: "glass", label: "Header Style" },
    { key: "mainNavJson", value: JSON.stringify(DEFAULT_NAV_LINKS), label: "Main Navigation" },
    { key: "headerContactLabel", value: "Contact Us", label: "Header Contact Label" },
    { key: "headerContactHref", value: "/contact", label: "Header Contact Link" },
    { key: "headerContractorLabel", value: "Become a Contractor", label: "Header Contractor Label" },
    { key: "headerContractorHref", value: "/contractors", label: "Header Contractor Link" },
    { key: "showContractorHeaderCta", value: "false", label: "Show Contractor CTA in Header" },
    { key: "headerCtaStyle", value: "filled", label: "Header CTA Style" },
    { key: "showHamburgerDesktop", value: "false", label: "Show Hamburger on Desktop" },
    { key: "heroImageAbout", value: STOCK_IMAGES.about, label: "About Hero Image" },
    { key: "heroImageProjects", value: STOCK_IMAGES.construction, label: "Projects Hero Image" },
    { key: "heroImageTenders", value: STOCK_IMAGES.tenders, label: "Tenders Hero Image" },
    { key: "heroImageContractors", value: STOCK_IMAGES.contractors, label: "Contractors Hero Image" },
    { key: "heroImageGovernance", value: STOCK_IMAGES.governance, label: "Governance Hero Image" },
    { key: "heroImageNews", value: STOCK_IMAGES.news, label: "News Hero Image" },
    { key: "heroImageContact", value: STOCK_IMAGES.contact, label: "Contact Hero Image" },
    { key: "heroImageGeneric", value: STOCK_IMAGES.generic, label: "Generic Hero Image" },
  ];

  for (const s of settings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }

  const slideCount = await prisma.heroSlide.count();
  if (slideCount === 0) {
    await prisma.heroSlide.createMany({
      data: [
        {
          title: "Hero 1 - National Highways",
          eyebrow: "State Enterprise",
          heading: "Delivering infrastructure that powers national progress",
          subheading: "Planning, procuring, and building critical public works with transparency and engineering excellence.",
          primaryLabel: "View Projects",
          primaryUrl: "/projects",
          secondaryLabel: "Open Tenders",
          secondaryUrl: "/tenders?status=OPEN",
          mediaType: "IMAGE",
          mediaUrl: HERO_IMAGES[0],
          overlayOpacity: 0.6,
          sortOrder: 0,
          status: ContentStatus.PUBLISHED,
          showStats: true,
          statsJson: JSON.stringify([
            { label: "Active Projects", value: "24" },
            { label: "Capital Deployed", value: "$4.2B" },
            { label: "On-Time Delivery", value: "92%" },
          ]),
          publishedAt: new Date(),
        },
        {
          title: "Hero 2 - Bridges",
          eyebrow: "Major Works",
          heading: "Connecting communities through world-class engineering",
          subheading: "From highways to water systems, we deliver infrastructure that serves generations.",
          primaryLabel: "Our Mandate",
          primaryUrl: "/about",
          secondaryLabel: "Contact Us",
          secondaryUrl: "/contact",
          mediaType: "IMAGE",
          mediaUrl: HERO_IMAGES[1],
          overlayOpacity: 0.55,
          sortOrder: 1,
          status: ContentStatus.PUBLISHED,
          showStats: false,
          publishedAt: new Date(),
        },
        {
          title: "Hero 3 - Construction",
          eyebrow: "Procurement",
          heading: "Open tenders for qualified contractors",
          subheading: "Join our prequalified database and bid on major public infrastructure projects.",
          primaryLabel: "Contractor Portal",
          primaryUrl: "/contractors",
          secondaryLabel: "View Tenders",
          secondaryUrl: "/tenders",
          mediaType: "IMAGE",
          mediaUrl: HERO_IMAGES[2],
          overlayOpacity: 0.55,
          sortOrder: 2,
          status: ContentStatus.PUBLISHED,
          showStats: false,
          publishedAt: new Date(),
        },
      ],
    });
  }

  const projects = [
    {
      title: "Affordable Housing Programme - Phase 1",
      slug: "affordable-housing-phase-1",
      sector: "Housing & Residential",
      location: "Eastern District",
      description:
        "Construction of 2,400 affordable housing units across four mixed-use developments, including community centres, green spaces, and sustainable building standards.",
      cardSummary:
        "2,400 affordable homes across four developments with community facilities and sustainable design standards.",
      status: "IN_PROGRESS" as const,
      progressPercent: 35,
      contractor: "Urban Homes Development Ltd",
      contractValue: 540000000,
      startDate: new Date("2025-01-15"),
      expectedCompletion: new Date("2027-09-30"),
      featuredImageUrl: STOCK_IMAGES.housing,
      featuredImageAlt: "Residential housing development under construction",
      featured: true,
      publishedAt: new Date("2026-05-01"),
    },
    {
      title: "Northern Highway Expansion",
      slug: "northern-highway-expansion",
      sector: "Roads & Highways",
      location: "Northern Region",
      description: "A 120km highway expansion connecting major economic corridors, including four interchange upgrades and smart traffic management systems.",
      cardSummary: "120km highway expansion with smart traffic systems connecting key economic corridors across the Northern Region.",
      status: "IN_PROGRESS" as const,
      progressPercent: 68,
      contractor: "Global Infrastructure Partners Ltd",
      contractValue: 850000000,
      startDate: new Date("2023-06-01"),
      expectedCompletion: new Date("2026-12-31"),
      featuredImageUrl: STOCK_IMAGES.road,
      featuredImageAlt: "Highway construction and earthworks",
      featured: true,
      publishedAt: new Date("2026-04-15"),
    },
    {
      title: "Capital Water Treatment Plant",
      slug: "capital-water-treatment",
      sector: "Water & Wastewater",
      location: "Capital District",
      description: "New 200MLD water treatment facility serving 1.2 million residents with advanced filtration and sustainable operations.",
      cardSummary: "200MLD treatment plant delivering clean water to 1.2 million residents with advanced filtration technology.",
      status: "TENDERING" as const,
      progressPercent: 15,
      featuredImageUrl: STOCK_IMAGES.water,
      featuredImageAlt: "Water treatment infrastructure",
      featured: true,
      publishedAt: new Date("2025-11-10"),
    },
    {
      title: "East Coast Port Modernisation",
      slug: "east-coast-port",
      sector: "Ports & Maritime",
      location: "East Coast",
      description: "Deepening of berths, new container terminal, and rail connectivity to support increased trade volumes.",
      cardSummary: "Berth deepening and new container terminal to support growing maritime trade on the East Coast.",
      status: "AWARDED" as const,
      progressPercent: 25,
      contractor: "Maritime Construction Group",
      contractValue: 1200000000,
      startDate: new Date("2024-03-15"),
      expectedCompletion: new Date("2028-06-30"),
      featuredImageUrl: STOCK_IMAGES.port,
      featuredImageAlt: "Port and container terminal infrastructure",
      featured: true,
      publishedAt: new Date("2025-10-20"),
    },
    {
      title: "Metro Line Extension Phase 2",
      slug: "metro-line-extension",
      sector: "Rail & Transit",
      location: "Metropolitan Area",
      description: "18km metro extension with 12 new stations, improving urban mobility for 500,000 daily commuters.",
      cardSummary: "18km metro extension with 12 stations improving urban mobility for half a million daily commuters.",
      status: "PLANNED" as const,
      progressPercent: 5,
      featuredImageUrl: STOCK_IMAGES.rail,
      featuredImageAlt: "Metro rail transit infrastructure",
      featured: true,
      publishedAt: new Date("2025-09-05"),
    },
    {
      title: "Riverside Bridge Reconstruction",
      slug: "riverside-bridge",
      sector: "Bridges & Structures",
      location: "Central Province",
      description: "Replacement of ageing truss bridge with a modern cable-stayed structure improving freight capacity and flood resilience.",
      cardSummary: "Modern cable-stayed bridge replacing ageing structure to improve freight capacity and flood resilience.",
      status: "IN_PROGRESS" as const,
      progressPercent: 42,
      contractor: "BridgeWorks Engineering Consortium",
      contractValue: 320000000,
      startDate: new Date("2024-01-10"),
      expectedCompletion: new Date("2027-03-31"),
      featuredImageUrl: STOCK_IMAGES.bridge,
      featuredImageAlt: "Bridge construction and structural engineering",
      featured: true,
      publishedAt: new Date("2025-08-12"),
    },
    {
      title: "National Airport Terminal Expansion",
      slug: "airport-terminal-expansion",
      sector: "Aviation",
      location: "Capital International Airport",
      description: "New international terminal wing with expanded apron, baggage systems, and passenger processing capacity for 15 million annual travellers.",
      cardSummary: "International terminal expansion increasing passenger capacity to 15 million travellers per year.",
      status: "TENDERING" as const,
      progressPercent: 10,
      featuredImageUrl: STOCK_IMAGES.airport,
      featuredImageAlt: "Airport terminal and aviation infrastructure",
      featured: false,
      publishedAt: new Date("2025-07-01"),
    },
    {
      title: "Civic Administration Complex",
      slug: "civic-administration-complex",
      sector: "Government Buildings",
      location: "Capital District",
      description: "Energy-efficient government campus consolidating ministries with public service halls, digital infrastructure, and sustainable design.",
      cardSummary: "Energy-efficient government campus consolidating ministries with modern public service facilities.",
      status: "PLANNED" as const,
      progressPercent: 8,
      featuredImageUrl: STOCK_IMAGES.civic,
      featuredImageAlt: "Modern civic government building",
      featured: true,
      publishedAt: new Date("2026-03-20"),
    },
  ];

  for (const p of projects) {
    const { publishedAt, ...projectData } = p;
    await prisma.project.upsert({
      where: { slug: p.slug },
      update: {
        ...projectData,
        statusContent: ContentStatus.PUBLISHED,
        publishedAt: publishedAt ?? new Date(),
      },
      create: {
        ...projectData,
        statusContent: ContentStatus.PUBLISHED,
        publishedAt: publishedAt ?? new Date(),
      },
    });
  }

  const tenders = [
    {
      referenceNumber: "NIDC/T/2025/0142",
      title: "Capital Water Treatment Plant - Main Construction Contract",
      slug: "capital-water-treatment-main-contract",
      category: "Civil Works",
      department: "Ministry of Water Resources",
      description: "Design and construction of a 200MLD water treatment plant including intake structures, treatment units, and pumping stations.",
      openingDate: new Date("2025-04-01"),
      closingDate: new Date("2025-07-15"),
      status: "OPEN" as const,
      estimatedValue: 420000000,
      heroImageUrl: STOCK_IMAGES.water,
      heroImageAlt: "Water treatment plant procurement",
    },
    {
      referenceNumber: "NIDC/T/2025/0098",
      title: "Northern Highway Expansion - Electrical Systems",
      slug: "northern-highway-electrical",
      category: "Electrical",
      department: "Ministry of Transport",
      description: "Supply and installation of highway lighting, variable message signs, and traffic management systems.",
      openingDate: new Date("2025-03-01"),
      closingDate: new Date("2025-05-30"),
      status: "OPEN" as const,
      estimatedValue: 45000000,
      heroImageUrl: STOCK_IMAGES.road,
      heroImageAlt: "Highway electrical systems tender",
    },
    {
      referenceNumber: "NIDC/T/2024/0312",
      title: "East Coast Port - Berth Deepening Works",
      slug: "east-coast-berth-deepening",
      category: "Maritime",
      department: "Ministry of Maritime Affairs",
      description: "Dredging and berth deepening to accommodate larger container vessels.",
      openingDate: new Date("2024-09-01"),
      closingDate: new Date("2024-11-30"),
      status: "AWARDED" as const,
      estimatedValue: 180000000,
      successfulBidder: "Maritime Construction Group",
      awardInfo: "Contract awarded following competitive international tender process.",
      heroImageUrl: STOCK_IMAGES.port,
      heroImageAlt: "Port berth deepening works",
    },
    {
      referenceNumber: "NIDC/T/2025/0201",
      title: "Airport Terminal Expansion - Structural Works",
      slug: "airport-terminal-structural",
      category: "Building & Civil",
      department: "Ministry of Aviation",
      description: "Structural works package for the new international terminal wing including foundations, steel frame, and cladding systems.",
      openingDate: new Date("2025-05-01"),
      closingDate: new Date("2025-08-30"),
      status: "OPEN" as const,
      estimatedValue: 290000000,
      heroImageUrl: STOCK_IMAGES.airport,
      heroImageAlt: "Airport terminal structural works tender",
    },
  ];

  for (const t of tenders) {
    await prisma.tender.upsert({
      where: { slug: t.slug },
      update: {
        ...t,
        statusContent: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      create: {
        ...t,
        statusContent: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });
  }

  const newsPosts = [
    {
      title: "Northern Highway Project Reaches 68% Completion",
      slug: "northern-highway-68-percent",
      category: "Project Update",
      summary: "Major milestone achieved as highway expansion works pass two-thirds completion ahead of schedule.",
      body: "The Northern Highway Expansion project has reached 68% completion, with all four interchange upgrades now operational. The project remains on track for delivery by December 2026.",
      featuredImageUrl: STOCK_IMAGES.road,
      featuredImageAlt: "Northern highway construction progress",
      publishedAt: new Date("2025-05-15"),
    },
    {
      title: "Public Notice: Capital Water Treatment Tender Open",
      slug: "water-treatment-tender-notice",
      category: "Public Notice",
      summary: "Tender NIDC/T/2025/0142 is now open for prequalified contractors.",
      body: "The National Infrastructure Delivery Corporation invites prequalified contractors to submit bids for the main construction contract of the Capital Water Treatment Plant. Closing date: 15 July 2025.",
      featuredImageUrl: STOCK_IMAGES.water,
      featuredImageAlt: "Water treatment tender public notice",
      publishedAt: new Date("2025-04-01"),
    },
    {
      title: "Annual Report 2024 Now Available",
      slug: "annual-report-2024",
      category: "Governance",
      summary: "Our 2024 annual report highlights delivery performance and financial accountability.",
      body: "The 2024 Annual Report is now available for download in the Governance section. The report covers project delivery metrics, financial statements, and governance activities.",
      featuredImageUrl: STOCK_IMAGES.governance,
      featuredImageAlt: "Annual report publication",
      publishedAt: new Date("2025-03-20"),
    },
    {
      title: "Riverside Bridge Construction Enters Next Phase",
      slug: "riverside-bridge-phase-two",
      category: "Project Update",
      summary: "Cable-stayed superstructure works commence following completion of foundation piling.",
      body: "The Riverside Bridge Reconstruction project has commenced superstructure works. The new cable-stayed design will improve freight capacity and flood resilience for the Central Province corridor.",
      featuredImageUrl: STOCK_IMAGES.bridge,
      featuredImageAlt: "Bridge construction phase update",
      publishedAt: new Date("2025-05-28"),
    },
  ];

  for (const n of newsPosts) {
    await prisma.newsPost.upsert({
      where: { slug: n.slug },
      update: {
        ...n,
        status: ContentStatus.PUBLISHED,
      },
      create: {
        ...n,
        status: ContentStatus.PUBLISHED,
      },
    });
  }

  const pageSeeds = Object.entries(PAGE_HERO_DEFAULTS).map(([slug, defaults]) => ({
    slug,
    title: defaults.title,
    summary: defaults.subtitle,
    content: defaults.subtitle,
    heroEyebrow: defaults.eyebrow,
    heroTitle: defaults.title,
    heroSubtitle: defaults.subtitle,
    heroImageUrl: HERO_PAGE_TYPE_IMAGES[defaults.pageType],
    heroImageAlt: `${defaults.title} banner`,
    heroOverlayStrength: 0.55,
    status: ContentStatus.PUBLISHED,
    publishedAt: new Date(),
  }));

  for (const page of pageSeeds) {
    await prisma.page.upsert({
      where: { slug: page.slug },
      update: page,
      create: page,
    });
  }

  const boardCount = await prisma.boardMember.count();
  if (boardCount === 0) {
    await prisma.boardMember.createMany({
      data: [
        { name: "Dr. Sarah Mitchell", title: "Chairperson", bio: "Former Secretary of Infrastructure with 25 years of public service.", sortOrder: 0, status: ContentStatus.PUBLISHED },
        { name: "James Okonkwo", title: "Deputy Chairperson", bio: "Civil engineer and infrastructure policy advisor.", sortOrder: 1, status: ContentStatus.PUBLISHED },
        { name: "Maria Santos", title: "Board Member", bio: "Finance and governance specialist.", sortOrder: 2, status: ContentStatus.PUBLISHED },
      ],
    });
  }

  const leadershipCount = await prisma.leadershipMember.count();
  if (leadershipCount === 0) {
    await prisma.leadershipMember.createMany({
      data: [
        { name: "David Chen", title: "Chief Executive Officer", department: "Executive Office", bio: "Leading national infrastructure delivery strategy and operations.", sortOrder: 0, status: ContentStatus.PUBLISHED },
        { name: "Amara Osei", title: "Chief Operating Officer", department: "Operations", bio: "Overseeing project delivery and contractor management.", sortOrder: 1, status: ContentStatus.PUBLISHED },
        { name: "Robert Kim", title: "Chief Financial Officer", department: "Finance", bio: "Financial planning, procurement oversight, and reporting.", sortOrder: 2, status: ContentStatus.PUBLISHED },
      ],
    });
  }

  const landingPage = await prisma.page.upsert({
    where: { slug: LANDING_PAGE_SLUG },
    create: {
      slug: LANDING_PAGE_SLUG,
      title: "Landing Page",
      content: "",
      status: ContentStatus.PUBLISHED,
      metaTitle: "National Infrastructure Delivery Corporation",
      metaDescription:
        "Government-owned infrastructure delivery — projects, tenders, governance, and contractor registration.",
      isLandingPage: true,
      settingsJson: JSON.stringify(LANDING_PAGE_DEFAULTS.hero),
      publishedAt: new Date(),
    },
    update: {
      title: "Landing Page",
      isLandingPage: true,
      settingsJson: JSON.stringify(LANDING_PAGE_DEFAULTS.hero),
      metaTitle: "National Infrastructure Delivery Corporation",
      metaDescription:
        "Government-owned infrastructure delivery — projects, tenders, governance, and contractor registration.",
      status: ContentStatus.PUBLISHED,
    },
  });

  for (const [key, section] of Object.entries(LANDING_PAGE_DEFAULTS.sections)) {
    const sectionData = {
      sectionTitle: section.sectionTitle,
      eyebrow: section.eyebrow,
      subtitle: section.subtitle,
      body: section.body,
      imageUrl: section.imageUrl,
      imageAlt: section.imageAlt,
      ctaLabel: section.ctaLabel,
      ctaHref: section.ctaHref,
      settingsJson: JSON.stringify(section.settings ?? {}),
      displayOrder: section.displayOrder,
      isActive: section.isActive,
    };
    await prisma.pageSection.upsert({
      where: { pageId_sectionKey: { pageId: landingPage.id, sectionKey: key } },
      create: {
        pageId: landingPage.id,
        sectionKey: key,
        ...sectionData,
      },
      update: sectionData,
    });
  }

  await prisma.statItem.deleteMany({ where: { pageId: landingPage.id } });
  await prisma.statItem.createMany({
    data: LANDING_PAGE_DEFAULTS.statItems.map((stat, index) => ({
      pageId: landingPage.id,
      label: stat.label,
      value: stat.value,
      prefix: stat.prefix,
      suffix: stat.suffix,
      icon: stat.icon,
      displayOrder: stat.displayOrder ?? index,
      isActive: stat.isActive,
    })),
  });

  await applyLandingV2PagePayload({
    ...LANDING_V2_DEFAULTS,
    status: ContentStatus.PUBLISHED,
  });

  const landingSlideCount = await prisma.heroSlide.count({ where: { pageId: landingPage.id } });
  if (landingSlideCount === 0) {
    await prisma.heroSlide.createMany({
      data: LANDING_PAGE_DEFAULTS.heroSlides.map((slide, index) => ({
        pageId: landingPage.id,
        title: slide.title,
        eyebrow: slide.eyebrow,
        heading: slide.heading,
        subheading: slide.subheading,
        primaryLabel: slide.primaryLabel,
        primaryUrl: slide.primaryUrl,
        secondaryLabel: slide.secondaryLabel,
        secondaryUrl: slide.secondaryUrl,
        mediaType: "IMAGE" as const,
        mediaUrl: slide.mediaUrl,
        mediaAlt: slide.mediaAlt,
        overlayOpacity: slide.overlayOpacity,
        sortOrder: slide.sortOrder ?? index,
        isActive: slide.isActive,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
      })),
    });
  }

  console.log("Seed completed.");
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
