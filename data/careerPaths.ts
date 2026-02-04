export interface CareerPath {
  id: string;
  title: string;
  category:
    | "Tech"
    | "Business"
    | "Creative"
    | "Healthcare"
    | "Trades"
    | "Education"
    | "Service";
  description: string;
  incomeRange: string;
  timeline: string;
  conformityLevel: "Traditional" | "Balanced" | "Unconventional";
  icon: string;
  keySkills: string[];
  initialSteps: string[];
}

export const careerPaths: CareerPath[] = [
  // Tech Careers
  {
    id: "web-dev",
    title: "Web Developer",
    category: "Tech",
    description:
      "Build websites and web applications using modern frameworks. High demand, remote-friendly, constantly evolving field.",
    incomeRange: "Year 1: $50-70K, Year 3: $80-120K",
    timeline: "6-12 months to first role",
    conformityLevel: "Balanced",
    icon: "💻",
    keySkills: ["HTML/CSS", "JavaScript", "React", "Problem-solving"],
    initialSteps: [
      "Complete freeCodeCamp or The Odin Project curriculum (3-6 months)",
      "Build 3-5 portfolio projects to showcase your skills",
      "Apply to junior developer positions and bootcamp graduate roles",
    ],
  },
  {
    id: "ux-designer",
    title: "UX/UI Designer",
    category: "Tech",
    description:
      "Design user-friendly digital experiences. Combines creativity with psychology and data. Growing demand across all industries.",
    incomeRange: "Year 1: $55-75K, Year 3: $85-130K",
    timeline: "6-9 months to first role",
    conformityLevel: "Balanced",
    icon: "🎨",
    keySkills: ["Figma", "User research", "Prototyping", "Visual design"],
    initialSteps: [
      "Take Google UX Design Certificate on Coursera (6 months)",
      "Complete 3 case study projects for your portfolio",
      "Network in design communities and apply to junior UX roles",
    ],
  },
  {
    id: "data-analyst",
    title: "Data Analyst",
    category: "Tech",
    description:
      "Turn data into insights that drive business decisions. Excel, SQL, and visualization skills open doors across industries.",
    incomeRange: "Year 1: $55-70K, Year 3: $75-110K",
    timeline: "4-8 months to first role",
    conformityLevel: "Traditional",
    icon: "📊",
    keySkills: ["Excel", "SQL", "Python/R", "Data visualization"],
    initialSteps: [
      "Complete Google Data Analytics Certificate (6 months)",
      "Build portfolio projects using real datasets from Kaggle",
      "Apply to entry-level analyst roles in any industry",
    ],
  },

  // Business Careers
  {
    id: "digital-marketing",
    title: "Digital Marketing Specialist",
    category: "Business",
    description:
      "Help businesses grow online through social media, content, SEO, and ads. Creative and analytical, with clear metrics for success.",
    incomeRange: "Year 1: $40-55K, Year 3: $60-90K",
    timeline: "3-6 months to first role",
    conformityLevel: "Balanced",
    icon: "📱",
    keySkills: ["Social media", "Content creation", "Google Analytics", "SEO"],
    initialSteps: [
      "Get Google Digital Marketing & E-commerce Certificate (3 months)",
      "Run a small campaign for a local business or personal project",
      "Build portfolio showcasing results and apply to agency or in-house roles",
    ],
  },
  {
    id: "project-manager",
    title: "Project Manager",
    category: "Business",
    description:
      "Coordinate teams and keep projects on track. Every industry needs PMs. Organizational skills and leadership matter more than technical background.",
    incomeRange: "Year 1: $60-75K, Year 3: $80-120K",
    timeline: "6-12 months to first role",
    conformityLevel: "Traditional",
    icon: "📋",
    keySkills: [
      "Organization",
      "Communication",
      "Agile/Scrum",
      "Risk management",
    ],
    initialSteps: [
      "Get Google Project Management Certificate (6 months)",
      "Lead a volunteer project or freelance coordination work",
      "Apply to junior PM or project coordinator roles",
    ],
  },

  // Creative Careers
  {
    id: "content-creator",
    title: "Content Creator / YouTuber",
    category: "Creative",
    description:
      "Build an audience creating videos, podcasts, or written content. Monetize through ads, sponsorships, and products. High risk, high reward.",
    incomeRange: "Year 1: $0-30K, Year 3: $50-200K+",
    timeline: "12-24 months to sustainable income",
    conformityLevel: "Unconventional",
    icon: "🎬",
    keySkills: [
      "Video editing",
      "Storytelling",
      "Consistency",
      "Audience building",
    ],
    initialSteps: [
      "Choose your niche and platform, post consistently for 90 days",
      "Learn basic editing (DaVinci Resolve or CapCut)",
      "Focus on providing genuine value, not just chasing views",
    ],
  },
  {
    id: "graphic-designer",
    title: "Graphic Designer",
    category: "Creative",
    description:
      "Create visual content for brands, websites, and marketing. Freelance-friendly with low startup costs. Portfolio matters more than degree.",
    incomeRange: "Year 1: $35-50K, Year 3: $55-85K",
    timeline: "6-12 months to first clients",
    conformityLevel: "Balanced",
    icon: "🖼️",
    keySkills: [
      "Adobe Creative Suite",
      "Typography",
      "Branding",
      "Client communication",
    ],
    initialSteps: [
      "Master Figma, Adobe Illustrator, and Photoshop through YouTube",
      "Create 10 portfolio pieces (spec work for real brands)",
      "Start freelancing on Upwork/Fiverr while building direct clients",
    ],
  },

  // Trades & Service
  {
    id: "electrician",
    title: "Electrician",
    category: "Trades",
    description:
      "Install and maintain electrical systems. Stable demand, good pay, union benefits. Requires apprenticeship but no college debt.",
    incomeRange: "Year 1: $35-45K, Year 3: $55-75K, Experienced: $80-120K",
    timeline: "4-5 years (including apprenticeship)",
    conformityLevel: "Traditional",
    icon: "⚡",
    keySkills: [
      "Technical aptitude",
      "Problem-solving",
      "Safety consciousness",
      "Physical stamina",
    ],
    initialSteps: [
      "Research local IBEW union or non-union apprenticeship programs",
      "Apply to apprenticeships (often competitive, highlight any relevant skills)",
      "Begin earning while learning - paid from day one",
    ],
  },
  {
    id: "personal-trainer",
    title: "Personal Trainer",
    category: "Service",
    description:
      "Help people reach fitness goals. Flexible schedule, active lifestyle, relationship-based. Can build to online coaching or gym ownership.",
    incomeRange: "Year 1: $30-45K, Year 3: $50-80K",
    timeline: "3-6 months to start",
    conformityLevel: "Balanced",
    icon: "💪",
    keySkills: ["Fitness knowledge", "Motivation", "Programming", "Sales"],
    initialSteps: [
      "Get certified (NASM, ACE, or ISSA - 3 months)",
      "Start training friends/family for free to build testimonials",
      "Get hired at a gym or start building online clients",
    ],
  },

  // Healthcare
  {
    id: "medical-coder",
    title: "Medical Coder",
    category: "Healthcare",
    description:
      "Translate medical procedures into billing codes. Remote-friendly, stable healthcare industry, detail-oriented work. No patient contact required.",
    incomeRange: "Year 1: $40-50K, Year 3: $50-65K",
    timeline: "6-12 months to certification",
    conformityLevel: "Traditional",
    icon: "🏥",
    keySkills: [
      "Attention to detail",
      "Medical terminology",
      "ICD-10/CPT codes",
      "HIPAA compliance",
    ],
    initialSteps: [
      "Complete AAPC or AHIMA certification program (6-12 months)",
      "Pass CPC or CCS exam",
      "Apply to remote medical coding positions or healthcare facilities",
    ],
  },
];
