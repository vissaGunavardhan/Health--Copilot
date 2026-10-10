/**
 * Health Copilot - AI Summarization Service Placeholder
 * 
 * Future Responsibilities:
 * - Format extracted raw medical report text into a structured prompt.
 * - Call an AI model (Local via Ollama/Llama 3 or free cloud API like Gemini Flash).
 * - Produce patient-friendly explanations, highlight abnormal ranges, and generate
 *   questions for doctor consultations.
 * - Enforce medical disclaimers and safety guardrails.
 */

/**
 * Standard System Prompt Template for Medical Report Simplification
 */
const SYSTEM_PROMPT = `
You are Health Copilot, an assistive tool designed to translate complex medical lab terminology into clear, accessible language for patients.
IMPORTANT SAFETY DIRECTIVE:
- You are NOT a medical doctor and MUST NOT provide medical diagnoses, treatment advice, or drug prescriptions.
- Always encourage patients to discuss their results with their healthcare provider.
- Identify the test name, reported value, reference/standard range, and flag values that appear out of reference range.
- Provide 2-3 clarifying questions the patient can ask their doctor.
`;

/**
 * Generates an AI-powered health summary from extracted document text.
 * @param {string} extractedText - Raw text extracted from the report.
 * @param {string} [category='General'] - Report category (e.g. Blood Test, Lipid Panel).
 * @returns {Promise<{ success: boolean, summary: object, status: string }>}
 */
async function generateHealthSummary(extractedText, category = 'General') {
  // TODO [Hackathon Sprint 4]: Connect to AI Provider (e.g., Ollama / Gemini / HuggingFace)
  // Example Ollama integration:
  // const response = await fetch('http://localhost:11434/api/generate', {
  //   method: 'POST',
  //   body: JSON.stringify({ model: 'llama3', prompt: ... })
  // });

  return {
    success: false,
    status: 'placeholder',
    message: 'AI Health Summary service placeholder. Model connection pending Sprint 4.',
    summary: {
      overview: 'AI summary has not been generated yet. Connect an AI provider in backend/services/ai.js.',
      keyFindings: [],
      metrics: [],
      doctorQuestions: [
        'What do my out-of-range values indicate regarding my overall health?',
        'Do I need follow-up lab testing or lifestyle adjustments?'
      ],
      disclaimer: 'This information is for educational purposes only and does not constitute medical advice.'
    }
  };
}

module.exports = {
  SYSTEM_PROMPT,
  generateHealthSummary
};
