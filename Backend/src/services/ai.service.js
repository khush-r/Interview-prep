const Groq = require("groq-sdk");
const { z } = require("zod");
const puppeteer = require("puppeteer");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const interviewReportSchema = z.object({
    matchScore: z.number(),
    technicalQuestions: z.array(
        z.object({
            question: z.string(),
            intention: z.string(),
            answer: z.string(),
        })
    ),
    behavioralQuestions: z.array(
        z.object({
            question: z.string(),
            intention: z.string(),
            answer: z.string(),
        })
    ),
    skillGaps: z.array(
        z.object({
            skill: z.string(),
            severity: z.enum(["low", "medium", "high"]),
        })
    ),
    preparationPlan: z.array(
        z.object({
            day: z.number(),
            focus: z.string(),
            tasks: z.array(z.string()),
        })
    ),
    title: z.string(),
});

async function generateInterviewReport({
    resume,
    selfDescription,
    jobDescription,
}) {

    const prompt = `
Generate an interview report.

Resume:
${resume}

Self Description:
${selfDescription}

Job Description:
${jobDescription}

Return ONLY valid JSON.

Format:

{
"matchScore":80,
"technicalQuestions":[
{
"question":"",
"intention":"",
"answer":""
}
],
"behavioralQuestions":[
{
"question":"",
"intention":"",
"answer":""
}
],
"skillGaps":[
{
"skill":"",
"severity":"low"
}
],
"preparationPlan":[
{
"day":1,
"focus":"",
"tasks":[]
}
],
"title":""
}
`;

    try {

        const completion = await groq.chat.completions.create({

            model: "llama-3.3-70b-versatile",

            temperature: 0.3,

            response_format: {
                type: "json_object",
            },

            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
        });

        const json = JSON.parse(
            completion.choices[0].message.content
        );

        return interviewReportSchema.parse(json);

    } catch (err) {

        console.error(err);

        throw err;

    }
}


console.log("6. Browser launched");

async function generatePdfFromHtml(htmlContent) {

    console.log("5. Launching browser");

const browser = await puppeteer.launch({
    headless: true,
    args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
    ],
});

    const page = await browser.newPage();

    await page.setContent(htmlContent, {
        waitUntil: "networkidle0",
    });

    const pdfBuffer = await page.pdf({
        format: "A4",
        margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm",
        },
    });

    await browser.close();

    return pdfBuffer;
}

async function generateResumePdf({
    resume,
    selfDescription,
    jobDescription,
}) {

    try {
        console.log("===== generateResumePdf Started =====");

        const prompt = `
You are an expert resume writer.

Create a professional ATS-friendly resume based on the information below.

Resume:
${resume}

Self Description:
${selfDescription}

Job Description:
${jobDescription}

IMPORTANT:
- Return ONLY a valid JSON object.
- Do NOT return markdown.
- Do NOT use \`\`\`.
- The JSON must contain exactly one property named "html".
- The "html" value must be a COMPLETE HTML document.

Example:

{
  "html": "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Resume</title></head><body><h1>John Doe</h1></body></html>"
}
`;

        console.log("Sending request to Groq...");

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            temperature: 0.3,
            response_format: {
                type: "json_object",
            },
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
        });

        console.log("Groq response received");

        console.log("===== RAW RESPONSE =====");
        console.log(completion.choices[0].message.content);
        console.log("========================");

        let json;

        try {
            json = JSON.parse(completion.choices[0].message.content);
            console.log("JSON parsed successfully");
        } catch (err) {
            console.error("JSON Parse Error:", err);
            throw err;
        }

        console.log("Generating PDF from HTML...");

        const pdf = await generatePdfFromHtml(json.html);

        console.log("PDF generated successfully");

        return pdf;

    } catch (error) {
        console.error("generateResumePdf Error:");
        console.error(error);
        throw error;
    }
}
console.log(generateResumePdf);
module.exports = {
    generateInterviewReport,
    
    generateResumePdf,
};