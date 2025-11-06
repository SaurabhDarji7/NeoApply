Below are concrete, implementable requirements (business logic only) for resume/docx upload + parsing + editor + job-description parsing using the LLM. No code; just a precise spec you can hand to devs.

High-level goals
Allow users to upload only .docx resumes OR paste resume text in a text box (same modal).
Parse resumes and job-description URLs with the LLM into a strictly predefined JSON shape.
LLM must return only JSON, follow provided JSON schema rules, return null for any unknown/missing value (avoid hallucination), and respect enumerations (e.g., job_type).
Surface errors from OpenAI or validation to the user clearly (parsing status states: pending → parsing → completed → failed).
Provide preview + in-browser Word editing of uploaded .docx after parsing. Allow insertion/visualization of “variables” (templating tokens) like {{company_name}} that map to values extracted from the selected job description.
Job-descriptions are provided as a URL only; backend fetches page HTML and sends text to LLM (simple fetch for now).
File upload validation (backend)
Use active_storage_validations to enforce:
Allowed content_types: application/vnd.openxmlformats-officedocument.wordprocessingml.document (.docx) only.
Max file size: 10 MB (adjustable constant).
Validate presence of either file OR text input in the modal (not both required).
On validation failure: return a 422 with a human-readable message (e.g., "Only .docx files under 10MB are allowed").
Resume & Job Description JSON schema rules (LLM must follow)
LLM must return strictly valid JSON only (no explanatory text).
If a field is absent, LLM must set it to null (not empty string) or an empty array [] for lists.
For array fields like top skills: LLM should return up to 5 items; if fewer than 5, pad with nulls (business rule).
For job_type use exact enum values: ["full_time","part_time","seasonal","contract","permanent"] (LLM must return one of these or null).
Use a server-side json_schema validation step (json-schema) to verify shape and types after LLM response. If schema validation fails, surface a readable error and persist raw LLM response for debugging.
Suggested JSON Schema (examples — enforce on server):

And for job description:

LLM prompt & response rules (business instructions)
System prompt must:
Explicitly instruct: "Return ONLY a single valid JSON object conforming to the supplied schema."
Tell model to respond with null when it cannot find a value; do NOT guess.
Provide enumerations for fields like job_type and exact formatting rules for dates (YYYY-MM or 'Present').
For skills arrays: "Return exactly up to 5 skill strings/objects; if fewer than 5 exist, the remaining slots must be null."
When possible present short examples of expected JSON shape inline (no extra text).
Client (server) must pass the schema or embed schema requirements into the prompt (concise) so parsing is consistent.
OpenAI error handling & retry logic
Retry policy:
Retry only on connection / transient transport errors (timeouts, 5xx from OpenAI) with exponential backoff: retry up to 3 times (e.g., 1s, 2s, 4s).
Do NOT retry on schema/validation failures or 4xx client errors.
On persistent OpenAI error:
Log full response/errors.
Mark parse job as failed with error_message "LLM error: <short message>".
Save raw API response/payload to an audit table or attach to the JobDescription/Resume parsing record (for debugging).
Surface a human-friendly message to user: "Parsing failed due to a temporary service error. Try again or contact support."
Schema validation & error surfacing
After LLM returns JSON:
Validate against JSON Schema using json-schema gem server-side.
If invalid:
Store raw LLM response.
Attempt a single gentle automated re-parse request to LLM with the message: "Your previous response failed validation for these reasons: <validation errors>. Please return only valid JSON conforming to the schema and set unknown fields to null." (1 retry only).
If still invalid: mark failed, persist raw response, and show user a page/modal with:
Human-readable validation errors (e.g., "job_type expected one of [full_time,...] but got 'X'").
Button: "Try again" (manual re-parse) and "Edit parsed values" (allow user to correct fields manually if desired).
Always store parsed_attributes (successful) and raw_llm_response (successful or failed) in DB.
Background processing & statuses
Use background job (ActiveJob / Sidekiq) to run parse so UI is responsive.
Model fields: status: enum { pending, parsing, completed, failed }, parsed_attributes (jsonb), raw_llm_response (jsonb), error_message (string), attempt_count (int), started_at/completed_at timestamps.
When a parse starts: set status=parsing, increment attempt_count; on success set completed and store parsed_attributes; on failure set failed with error_message.
Resume preview & edit (docx handling)
UX: Templates page modal has two mutually exclusive inputs:
Upload .docx file (required validation: .docx).
Or paste resume text into text area (plain text).
After upload & successful parse, open a document-editing modal that shows the uploaded resume in Word format and allows users to:
Preview the document.
Edit document text (WYSIWYG Word-like if possible).
Insert/inspect variable tokens — tokens displayed as styled elements (e.g., pill buttons) but stored as templating placeholders in .docx ({{company_name}}).
Editor integration options (choose one):
Replace the editor-integration section with the following (uses Syncfusion DocumentEditor for Vue + docx→pdf conversion guidance).

Editor integration (use Syncfusion DocumentEditor Vue, Community license)

Frontend (Vue)

Use Syncfusion DocumentEditor Vue component: @syncfusion/ej2-vue-documenteditor (Community license if you qualify).
Flow:
After .docx upload, backend stores file (ActiveStorage) and provides a download endpoint that returns the raw .docx bytes.
Frontend fetches the .docx as ArrayBuffer and opens it in the Syncfusion DocumentEditor:
documentEditor.open(arrayBuffer, 'Docx');
Let users edit and insert styled placeholder tokens like {{company_name}}. Represent tokens as plain text with distinct formatting (color/background) so they are visible but remain valid docx text.
On save, call documentEditor.save('filename', 'Docx') to get the DOCX blob and upload it back to the backend to persist (replace the stored ActiveStorage attachment).
Notes:
Avoid relying on Syncfusion server libraries; client-side open/save works with binary docx bytes.
Tokens inserted in editor are preserved inside the .docx binary; backend replacement will find {{token}} text.
Token UX

Show available tokens in the UI (company_name, top_5_skills_needed, job_location, title, job_type, etc.).
Allow insertion via a button; style tokens via the editor character format API so users see them as “chips”.
Token replacement: when finalizing, send chosen mappings to backend which performs safe templating on the .docx (see below).
docx → PDF conversion (recommended approaches)

Always convert in background job with timeouts and resource limits.
Persist both .docx and generated PDF as separate ActiveStorage attachments.
Validate conversion success and surface friendly messages on failure.
Test for formatting fidelity; LibreOffice works well in many cases but may differ on complex Word features.
Summary / recommendation

Use Syncfusion DocumentEditor Vue on the frontend for editing .docx in-browser (community license as applicable).
For server-side docx→pdf conversion, use LibreOffice headless in a dedicated conversion container (recommended) or a Syncfusion/.NET conversion service if you prefer their server libraries and license.
Implement conversion as an asynchronous backend job that attaches a PDF to the template and returns a download URL.



Use Mammoth.js to convert .docx -> HTML for preview/editing in the Vue editor.
For final output, maintain original docx by using Docxtemplater to replace placeholder tokens in the .docx binary when exporting.
Pros: easy Vue integration and direct token replacement; Cons: fidelity loss vs full Word editor.
Requirement: Keep saved/editable file as .docx. Use Docxtemplater or OnlyOffice server to export final .docx.
Variable tokens & mapping workflow
Canonical variable set available to templates editor: company_name, top_5_skills_needed, job_location, title, job_type, experience_level, etc.
UI: tokens appear as styled inline elements; clicking a token opens a small dropdown showing candidate values from the selected job description; user can choose one value or leave token as-is.
Replacement logic:
When user chooses to "apply" job-description values, server runs a token replacement on the .docx:
Use docx templating library (docxtemplater or server-side docx library) to replace {{token}} with the chosen value.
If chosen value is an array (e.g., top_5_skills_needed), map to comma-separated string or repeat tokens for lists — define exact replacement behavior in implementation.
Safety: sanitize replacements to avoid injecting arbitrary XML content into .docx.
Job description parsing (URL input)
Input: only a URL string.
Backend fetch behavior (simple initial implementation):
Fetch the page HTML (HTTP GET) with reasonable timeout and user-agent.
Extract visible text (simple HTML→text, no heavy scraping). For future: add Readability.
Pass extracted text to LLM with the job JSON schema and strict instructions (same rules: only JSON, null for unknown).
Security: for now allow arbitrary URL fetch; add a future requirement to implement domain allowlist or admin-only toggles before production.
API & UI endpoints (recommended)
POST /templates — create a new template record with either .docx or text; returns template id and status.
POST /templates/:id/parse — trigger parse (background job) for resume or job description (URL).
GET /templates/:id — returns record with status, parsed_attributes, raw_llm_response (for admins), preview URL for docx.
GET /templates/:id/download?format=docx — downloads current .docx
POST /templates/:id/apply-job/:job_id — apply job description to tokens and produce final .docx (returns download link).
UX flow (Templates page)
Modal step:
Choose mode: Upload .docx OR Paste resume text.
Submit -> shows a job (parsing) card with status.
When completed:
Show parsed result summary (collapsed).
Button: "Edit document" -> open Word editor modal showing uploaded .docx with tokens highlighted.
Button: "Attach Job Description (URL)" -> paste job URL; backend fetches and parses job; after job parse success, tokens dropdown populated.
User can click tokens and map them to job values or type overrides.
Button "Export .docx" to download final document (server-side replace + return).
No intermediate editable JSON form required per your request.
Error messages & user-facing text
LLM transient error: "Parsing failed due to a service error. Please try again."
Schema validation error: "Parsing produced an unexpected structure. Please try re-parsing or edit the document manually."
File validation error: "Upload failed — only .docx files under 10MB are accepted."
Logging, observability, and audit
Persist raw_llm_response and request payload for each parse attempt (secure access).
Track attempt_count, timestamps, and LLM error codes.
Add admin view to inspect raw responses and validation errors.
Add metrics (parse success rate, average latency, parse failures by error type).
Tests & QA
Unit tests:
ActiveStorage validations for file upload.
LLM client ensure_utf8 and request payload formation.
Schema validator: valid response passes, invalid fails.
Integration tests:
Full parse flow mocking OpenAI responses (happy path and invalid JSON).
Retry behavior for network errors.
E2E tests (optional):
Upload .docx, parse, open editor, apply job mapping, export .docx.
Acceptance criteria
Upload rejects non-.docx immediately with correct error.
Parse job moves to completed and stores parsed_attributes that pass server-side schema validation.
If LLM returns invalid JSON, system attempts one automated correction; if still invalid, status=failed and raw response saved; user can retry.
Editor displays tokens visually and allows mapping to job-description values. Final exported file remains .docx and contains replacements.

