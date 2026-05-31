# TODO - CV Tools / Analyzer + Ollama feedback

## Plan (approved)
1. Frontend routing + UI rename
   - Rename “CV Builder” to “CV Tools” in navigation and page title.
   - Add dropdown with options: “CV Analyzer” and “CV Builder”.
   - Keep existing CV Builder flow/features except CV upload.

2. Create/Update frontend pages
   - New page/route for **CV Analyzer** that contains the CV upload/extraction + Ollama report generation.
   - Update existing **CvBuilder.tsx** to remove the CV upload step and any upload UI while keeping the rest.

3. Backend: move CV upload workflow to CV Analyzer
   - Add a new endpoint (under `/api/cv-analyzer/...`) that accepts uploaded CV, extracts text, then calls Ollama to generate an objective feedback report (strengths, weaknesses, recommended improvements).
   - Reuse existing extract/scoring utilities where appropriate, but ensure the new report is Ollama-generated.

4. Backend: Ollama integration
   - Implement a server-side function that builds a strong prompt and calls Ollama (non-chat / generate or chat endpoint) to return structured feedback.

5. Frontend wiring
   - Add client methods to call the new analyzer endpoint.
   - Display the returned report in the analyzer UI.

6. Cleanup & consistency
   - Update any references to “CV Builder” labels in dashboard cards and layout mappings.
   - Ensure routes still work for non-kid users.

7. Test
   - Run backend checks (unit/lint if available).
   - Manually exercise analyzer upload and builder generation in the browser.

