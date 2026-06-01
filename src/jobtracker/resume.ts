export type ResumeExperience = {
  organization: string;
  location: string;
  role: string;
  start: string;
  end: string;
  bullets: string[];
};

export type Resume = {
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  education: { degree: string; school: string; date: string; notes?: string }[];
  experience: ResumeExperience[];
  certifications: string[];
  skills: string[];
  interests: string[];
};

export const RESUME: Resume = {
  name: "David Malinovsky",
  email: "Dmalinovsky4@gmail.com",
  phone: "631-796-8299",
  location: "New York, NY",
  summary:
    "Dedicated, licensed leader and educator specializing in middle grades and social studies. A proven track record of exceptional leadership and a passion for fostering student and organizational growth. Skilled in designing engaging and innovative curricula that inspire learning and critical thinking. Recognized for contributions to academic and extracurricular programs, with a strong commitment to promoting cultural enrichment, holistic student development, and lifelong learning.",
  education: [
    {
      degree: "MA in Middle Grades Education",
      school: "University of North Carolina, Charlotte",
      date: "May 2024",
      notes: "GPA: 4.0 | Phi Kappa Phi & Kappa Delta Pi Honor Societies",
    },
    {
      degree: "BA in Political Science & Philosophy",
      school: "Queens College, New York",
      date: "May 2020",
    },
  ],
  experience: [
    {
      organization: "United Charter High Schools",
      location: "Bronx, NY",
      role: "High School Social Studies Teacher",
      start: "August 2025",
      end: "Present",
      bullets: [
        "Implements NYS standards to teach towards social studies regents exams.",
        "Services diverse student learning needs with cutting edge artificial intelligence programs.",
        "Coaches flag football, founded model UN club.",
      ],
    },
    {
      organization: "Camp Sprout Lake Brooklyn",
      location: "Brooklyn, NY",
      role: "Operations Director (Summer position)",
      start: "June 2025",
      end: "August 2025",
      bullets: [
        "Integrated new technologies into summer leadership.",
        "Responsible for on-time bus transportation and vendor management.",
        "Worked with every level of camp to ensure smooth operations.",
      ],
    },
    {
      organization: "The Education Team",
      location: "Los Angeles, CA",
      role: "Teacher",
      start: "November 2024",
      end: "June 2025",
      bullets: [
        "Provided instruction to the highest level of special needs students.",
        "Assisted with emergency situations in short notice assignments.",
        "Delivered high quality K-12 long term instruction.",
      ],
    },
    {
      organization: "Union for Reform Judaism",
      location: "West Chester, PA",
      role: "Operations Director (Summer position)",
      start: "June 2024",
      end: "August 2024",
      bullets: [
        "Directed camp resources and allocations based on needs.",
        "Authored a comprehensive guidebook to standardize and improve future operational practices.",
        "Oversaw camp scholarship giveaways and worked with recipients.",
      ],
    },
    {
      organization: "National Heritage Academies",
      location: "Matthews, NC",
      role: "7th/8th Grade Social Studies Teacher",
      start: "August 2022",
      end: "June 2024",
      bullets: [
        "Designed and implemented lesson plans for students of all backgrounds.",
        "Advised middle school Student Council, fostering leadership and civic engagement.",
        "Professionally developed younger teachers in how to work with students from different communities.",
      ],
    },
    {
      organization: "Gaston County Schools",
      location: "Dallas, NC",
      role: "7th Grade Social Studies Teacher",
      start: "January 2022",
      end: "August 2022",
      bullets: [
        "Engaged with instruction aligned to North Carolina curriculum standards.",
        "Developed innovative teaching strategies to support diverse learner needs and promote academic achievement.",
        "Instrumental in meeting district-wide expectations for student progress and growth.",
      ],
    },
  ],
  certifications: [
    "Teaching License, North Carolina Department of Public Instruction",
    "Phi Kappa Phi Academic Honor Society",
    "Kappa Delta Pi Education Honor Society",
    "Member, National Council for Social Studies",
    "Teachers Advisory Council, National Constitution Center",
  ],
  skills: [
    "Curriculum Development & Instructional Design",
    "Student Engagement & Differentiated Instruction",
    "Leadership & Team Collaboration",
    "Budget Management & Logistical Coordination",
    "Fluent in Russian",
  ],
  interests: ["Music (guitar)", "Reading", "Badminton", "Fishing"],
};

export function resumeAsPlainText(r: Resume = RESUME): string {
  const lines: string[] = [];
  lines.push(r.name);
  lines.push(`${r.email} | ${r.phone} | ${r.location}`);
  lines.push("");
  lines.push("SUMMARY");
  lines.push(r.summary);
  lines.push("");
  lines.push("EDUCATION");
  for (const e of r.education) {
    lines.push(`- ${e.degree}, ${e.school} (${e.date})${e.notes ? ` — ${e.notes}` : ""}`);
  }
  lines.push("");
  lines.push("EXPERIENCE");
  for (const x of r.experience) {
    lines.push(`${x.role} — ${x.organization}, ${x.location} (${x.start} – ${x.end})`);
    for (const b of x.bullets) lines.push(`  • ${b}`);
  }
  lines.push("");
  lines.push("CERTIFICATIONS & MEMBERSHIPS");
  for (const c of r.certifications) lines.push(`- ${c}`);
  lines.push("");
  lines.push("SKILLS");
  for (const s of r.skills) lines.push(`- ${s}`);
  return lines.join("\n");
}
