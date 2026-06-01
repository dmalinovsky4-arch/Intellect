import { RESUME, resumeAsPlainText } from "./resume";
import type { Job } from "./types";

function todayLong(): string {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function templateCoverLetter(job: Pick<Job, "title" | "company" | "description">): string {
  const r = RESUME;
  const role = job.title.trim() || "[Role]";
  const company = job.company.trim() || "[Company]";
  const recent = r.experience[0];
  const middleExp = r.experience.find((e) =>
    /teacher|education|school/i.test(e.role + e.organization),
  );

  const hookFromDescription = job.description
    .split(/\n+/)
    .map((s) => s.trim())
    .find((s) => s.length > 40 && s.length < 240);

  const paragraphs: string[] = [];
  paragraphs.push(`${todayLong()}`);
  paragraphs.push(`${r.name}\n${r.email} • ${r.phone} • ${r.location}`);
  paragraphs.push(`Hiring Team\n${company}`);
  paragraphs.push(`Dear ${company} Hiring Team,`);

  paragraphs.push(
    `I am writing to apply for the ${role} position at ${company}. As a licensed educator with a Master's in Middle Grades Education and a 4.0 GPA from UNC Charlotte, I bring a record of building engaging classrooms, leading operational programs, and developing curricula that reach students of every background.`,
  );

  if (hookFromDescription) {
    paragraphs.push(
      `Your description of the role — "${hookFromDescription.replace(/"/g, "'")}" — resonates with the work I have been doing. ${recent ? `In my current role as ${recent.role} at ${recent.organization}, I ${recent.bullets[0].replace(/\.$/, "").toLowerCase()}, and ${recent.bullets[1] ? recent.bullets[1].replace(/\.$/, "").toLowerCase() : "lead initiatives that connect rigorous content to real student outcomes"}.` : ""}`,
    );
  } else if (recent) {
    paragraphs.push(
      `In my current role as ${recent.role} at ${recent.organization}, I ${recent.bullets[0].replace(/\.$/, "").toLowerCase()}, ${recent.bullets[1] ? recent.bullets[1].replace(/\.$/, "").toLowerCase() : ""}, and ${recent.bullets[2] ? recent.bullets[2].replace(/\.$/, "").toLowerCase() : "support whole-school priorities"}.`,
    );
  }

  if (middleExp && middleExp !== recent) {
    paragraphs.push(
      `Earlier, at ${middleExp.organization}, I served as a ${middleExp.role.toLowerCase()}, where I ${middleExp.bullets[0].replace(/\.$/, "").toLowerCase()}. That experience grounded my approach to ${role.toLowerCase()} work: design with the standards, differentiate for the student in front of you, and keep families and colleagues informed.`,
    );
  }

  paragraphs.push(
    `Beyond the classroom, I have led summer operations for two camps, managing transportation, vendors, and staff across every level of the organization. That blend of instructional depth and operational discipline is what I would bring to ${company}.`,
  );

  paragraphs.push(
    `I would welcome the chance to talk about how I can contribute to your team. Thank you for considering my application.`,
  );

  paragraphs.push(`Sincerely,\n${r.name}`);

  return paragraphs.join("\n\n");
}

export type GenerateOptions = {
  apiKey: string;
  model: string;
  job: Pick<Job, "title" | "company" | "url" | "description">;
};

export async function generateCoverLetterWithClaude(opts: GenerateOptions): Promise<string> {
  const { apiKey, model, job } = opts;
  const system = `You are helping ${RESUME.name} write a tailored, single-page cover letter for a job application. Use only facts present in the resume below. Match the tone of an experienced educator — warm, specific, no clichés, no em-dashes, no flattery. Output the letter only, no preamble.

RESUME:
${resumeAsPlainText()}`;

  const user = `Write a cover letter for this job.

Role: ${job.title || "(not provided)"}
Company: ${job.company || "(not provided)"}
Posting URL: ${job.url || "(not provided)"}

Job description / notes:
${job.description || "(none provided — write a strong generalist letter for the role and company above)"}

Constraints:
- Open with the date and the candidate's contact block, then "Dear ${job.company || "Hiring"} Hiring Team,"
- 3–4 body paragraphs
- Tie at least one concrete bullet from the resume to a specific need implied by the description
- Close with "Sincerely," and the candidate's name
- Plain text, no markdown`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1500,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${text}`);
  }
  const data = (await res.json()) as { content: { type: string; text: string }[] };
  return data.content
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("\n")
    .trim();
}
