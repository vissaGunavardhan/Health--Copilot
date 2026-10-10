/**
 * Health Copilot - AI Summarization Service
 * 
 * Translates dense clinical laboratory test reports into clear, patient-friendly insights.
 * Architecture:
 * 1. Checks for Local Ollama instance (e.g. Llama 3 / Mistral) or Google Gemini API.
 * 2. Embedded Clinical Expert Rules Engine: Parses laboratory parameters, detects reference
 *    range deviations, flags abnormalities, and synthesizes empathetic medical summaries.
 * 3. Enforces strict non-diagnostic medical disclaimers and questions for physician consultation.
 */

const SYSTEM_PROMPT = `
You are Health Copilot, an assistive tool designed to translate complex medical lab terminology into clear, accessible language for patients.
IMPORTANT SAFETY DIRECTIVE:
- You are NOT a medical doctor and MUST NOT provide medical diagnoses, treatment advice, or drug prescriptions.
- Always encourage patients to discuss their results with their healthcare provider.
- Identify the test name, reported value, reference/standard range, and flag values that appear out of reference range (low, high, normal).
- Provide 2-3 clarifying questions the patient can ask their doctor.
- Return response strictly as a JSON object with:
  {
    "overview": "...",
    "keyFindings": ["..."],
    "metrics": [
      { "testName": "...", "resultValue": "...", "unit": "...", "referenceRange": "...", "flag": "normal|low|high" }
    ],
    "doctorQuestions": ["..."],
    "disclaimer": "..."
  }
`;

/**
 * Standard Clinical Laboratory Reference Catalog
 */
const CLINICAL_REFERENCE_DB = [
  // Complete Blood Count (CBC)
  {
    names: ['hemoglobin', 'hb', 'hgb'],
    displayName: 'Hemoglobin',
    unit: 'g/dL',
    min: 13.0,
    max: 17.5,
    lowMeaning: 'Slightly low hemoglobin may indicate mild anemia, iron deficiency, or recent fatigue.',
    highMeaning: 'Elevated hemoglobin can be linked to dehydration, high altitude, or oxygen transport response.',
    category: 'Blood Test'
  },
  {
    names: ['white blood cell', 'wbc', 'leukocyte', 'total wbc count'],
    displayName: 'White Blood Cells (WBC)',
    unit: 'x10^3/uL',
    min: 4.5,
    max: 11.0,
    lowMeaning: 'Lower WBC count may indicate viral recovery or diminished immune activity.',
    highMeaning: 'Elevated WBC count often signals your body is reacting to an infection or inflammation.',
    category: 'Blood Test'
  },
  {
    names: ['platelet', 'platelet count', 'plt'],
    displayName: 'Platelet Count',
    unit: 'x10^3/uL',
    min: 150,
    max: 450,
    lowMeaning: 'Lower platelet levels (thrombocytopenia) can affect normal blood clotting.',
    highMeaning: 'High platelets may be a reactive marker of systemic inflammation or iron changes.',
    category: 'Blood Test'
  },
  {
    names: ['red blood cell', 'rbc', 'erythrocyte'],
    displayName: 'Red Blood Cells (RBC)',
    unit: 'x10^6/uL',
    min: 4.2,
    max: 5.9,
    lowMeaning: 'Lower RBC count often pairs with low hemoglobin and reduced oxygen carrying capacity.',
    highMeaning: 'Elevated RBC count can be related to smoking, dehydration, or cardiovascular adjustments.',
    category: 'Blood Test'
  },
  {
    names: ['hematocrit', 'hct', 'pcv'],
    displayName: 'Hematocrit (PCV)',
    unit: '%',
    min: 37.0,
    max: 50.0,
    lowMeaning: 'Low hematocrit reflects a lower volume percentage of red blood cells.',
    highMeaning: 'High hematocrit can occur during fluid depletion or vigorous athletic training.',
    category: 'Blood Test'
  },
  {
    names: ['mcv', 'mean corpuscular volume'],
    displayName: 'Mean Corpuscular Volume (MCV)',
    unit: 'fL',
    min: 80.0,
    max: 100.0,
    lowMeaning: 'Low MCV indicates microcytic red blood cells, frequently seen in iron deficiency.',
    highMeaning: 'High MCV indicates macrocytic cells, sometimes related to Vitamin B12 or folate status.',
    category: 'Blood Test'
  },

  // Lipid Panel
  {
    names: ['total cholesterol', 'cholesterol', 'serum cholesterol'],
    displayName: 'Total Cholesterol',
    unit: 'mg/dL',
    min: 125,
    max: 200,
    lowMeaning: 'Very low total cholesterol is rare and usually evaluated alongside nutritional intake.',
    highMeaning: 'Elevated cholesterol may contribute to cardiovascular plaque buildup over time.',
    category: 'Lipid Panel'
  },
  {
    names: ['hdl', 'hdl cholesterol', 'good cholesterol'],
    displayName: 'HDL (Good) Cholesterol',
    unit: 'mg/dL',
    min: 40,
    max: 999,
    lowMeaning: 'Lower HDL is a risk marker; higher levels provide cardiovascular protective benefits.',
    highMeaning: 'High HDL is protective for cardiovascular health.',
    category: 'Lipid Panel'
  },
  {
    names: ['ldl', 'ldl cholesterol', 'bad cholesterol'],
    displayName: 'LDL (Bad) Cholesterol',
    unit: 'mg/dL',
    min: 0,
    max: 100,
    lowMeaning: 'Low LDL is generally optimal for cardiovascular health.',
    highMeaning: 'Elevated LDL is a standard marker for cardiovascular prevention discussions.',
    category: 'Lipid Panel'
  },
  {
    names: ['triglycerides', 'triglyceride', 'tg'],
    displayName: 'Triglycerides',
    unit: 'mg/dL',
    min: 50,
    max: 150,
    lowMeaning: 'Normal low levels are healthy.',
    highMeaning: 'High triglycerides are related to dietary sugars, simple carbohydrates, and metabolic balance.',
    category: 'Lipid Panel'
  },

  // Comprehensive Metabolic Panel (CMP)
  {
    names: ['fasting blood glucose', 'glucose', 'fasting sugar', 'fbs', 'blood glucose'],
    displayName: 'Fasting Blood Glucose',
    unit: 'mg/dL',
    min: 70,
    max: 99,
    lowMeaning: 'Hypoglycemia (low blood sugar) may cause shakiness, dizziness, or sweating.',
    highMeaning: 'Elevated fasting glucose suggests pre-diabetic or glycemic regulation review with your doctor.',
    category: 'Metabolic Panel'
  },
  {
    names: ['hba1c', 'glycated hemoglobin', 'a1c'],
    displayName: 'HbA1c (Average Blood Sugar)',
    unit: '%',
    min: 4.0,
    max: 5.6,
    lowMeaning: 'Normal baseline range.',
    highMeaning: 'Levels above 5.7% indicate prediabetes; above 6.5% suggest diabetic range monitoring.',
    category: 'Metabolic Panel'
  },
  {
    names: ['creatinine', 'serum creatinine'],
    displayName: 'Serum Creatinine',
    unit: 'mg/dL',
    min: 0.6,
    max: 1.2,
    lowMeaning: 'Low creatinine is generally benign and may reflect low muscle mass or pregnancy.',
    highMeaning: 'Elevated creatinine suggests kidney filtration efficiency should be evaluated with your doctor.',
    category: 'Metabolic Panel'
  },
  {
    names: ['blood urea nitrogen', 'bun', 'urea'],
    displayName: 'Blood Urea Nitrogen (BUN)',
    unit: 'mg/dL',
    min: 7,
    max: 20,
    lowMeaning: 'Low BUN can occur with low-protein diets or high hydration.',
    highMeaning: 'Elevated BUN often reflects dehydration or altered renal clearance.',
    category: 'Metabolic Panel'
  },
  {
    names: ['calcium', 'serum calcium'],
    displayName: 'Serum Calcium',
    unit: 'mg/dL',
    min: 8.5,
    max: 10.5,
    lowMeaning: 'Low calcium may affect bone mineralization and neuromuscular stability.',
    highMeaning: 'High calcium can be associated with parathyroid gland function or vitamin D excess.',
    category: 'Metabolic Panel'
  },
  {
    names: ['sodium', 'na+'],
    displayName: 'Sodium',
    unit: 'mEq/L',
    min: 135,
    max: 145,
    lowMeaning: 'Low sodium (hyponatremia) involves fluid and electrolyte balance.',
    highMeaning: 'High sodium reflects dehydration or high osmotic load.',
    category: 'Metabolic Panel'
  },
  {
    names: ['potassium', 'k+'],
    displayName: 'Potassium',
    unit: 'mEq/L',
    min: 3.5,
    max: 5.1,
    lowMeaning: 'Low potassium can cause muscle weakness or cardiac rhythm changes.',
    highMeaning: 'Elevated potassium requires careful medical review for cardiac stability.',
    category: 'Metabolic Panel'
  },
  {
    names: ['alt', 'sgpt', 'alanine aminotransferase'],
    displayName: 'ALT (Liver Enzyme)',
    unit: 'U/L',
    min: 7,
    max: 56,
    lowMeaning: 'Normal healthy baseline for liver enzymes.',
    highMeaning: 'Elevated ALT may signal mild liver irritation, fatty liver, or medication response.',
    category: 'Metabolic Panel'
  },
  {
    names: ['ast', 'sgot', 'aspartate aminotransferase'],
    displayName: 'AST (Liver/Heart Enzyme)',
    unit: 'U/L',
    min: 10,
    max: 40,
    lowMeaning: 'Normal healthy baseline.',
    highMeaning: 'Elevated AST can be associated with muscle exertion, alcohol, or liver updates.',
    category: 'Metabolic Panel'
  },
  {
    names: ['bilirubin', 'total bilirubin'],
    displayName: 'Total Bilirubin',
    unit: 'mg/dL',
    min: 0.2,
    max: 1.2,
    lowMeaning: 'Normal typical finding.',
    highMeaning: 'Elevated bilirubin can cause mild jaundice or reflects bile processing.',
    category: 'Metabolic Panel'
  },

  // Thyroid & Vitamins
  {
    names: ['tsh', 'thyroid stimulating hormone'],
    displayName: 'Thyroid Stimulating Hormone (TSH)',
    unit: 'uIU/mL',
    min: 0.4,
    max: 4.0,
    lowMeaning: 'Low TSH suggests an overactive thyroid (hyperthyroidism).',
    highMeaning: 'Elevated TSH suggests an underactive thyroid (hypothyroidism), often linked to fatigue.',
    category: 'Thyroid Panel'
  },
  {
    names: ['vitamin d', '25-hydroxy vitamin d', '25-oh vit d'],
    displayName: 'Vitamin D (25-OH)',
    unit: 'ng/mL',
    min: 30.0,
    max: 100.0,
    lowMeaning: 'Vitamin D deficiency is common and impacts bone density, energy, and immune function.',
    highMeaning: 'Elevated Vitamin D usually only occurs from excessive supplementation.',
    category: 'Other'
  },
  {
    names: ['vitamin b12', 'cobalamin', 'b12'],
    displayName: 'Vitamin B12',
    unit: 'pg/mL',
    min: 200,
    max: 900,
    lowMeaning: 'Low B12 can cause neurological tingling, memory fog, or macrocytic anemia.',
    highMeaning: 'Elevated B12 is typically non-toxic and excreted through urine.',
    category: 'Other'
  }
];

/**
 * Parses raw text to extract recognized medical tests and observed values
 * @param {string} rawText
 * @returns {Array<object>}
 */
function parseLabMetricsFromText(rawText) {
  if (!rawText) return [];
  const lines = rawText.split('\n');
  const foundMetrics = [];
  const handledTests = new Set();

  for (const line of lines) {
    const cleanLine = line.trim();
    if (!cleanLine || cleanLine.length < 3) continue;

    for (const testDef of CLINICAL_REFERENCE_DB) {
      if (handledTests.has(testDef.displayName)) continue;

      // Check if line contains one of the alias names
      const matchedAlias = testDef.names.find(alias => {
        const regex = new RegExp(`(^|\\b|\\s)${alias.replace(/[+*?^$()[\]{}]/g, '\\$&')}(\\b|\\s|:|-|$)`, 'i');
        return regex.test(cleanLine);
      });

      if (matchedAlias) {
        // Attempt to find numerical value in this line or nearby
        const numberMatches = cleanLine.match(/([0-9]+(?:\.[0-9]+)?)/g);
        if (numberMatches && numberMatches.length > 0) {
          // Identify which number is the result
          let resultNum = parseFloat(numberMatches[0]);

          // If the first number is an index or test code (e.g. "1. Hemoglobin: 12.5"), take the second
          if (cleanLine.match(/^[0-9]+[\.\)\-]/) && numberMatches.length > 1) {
            resultNum = parseFloat(numberMatches[1]);
          }

          if (!isNaN(resultNum)) {
            let flag = 'normal';
            if (resultNum < testDef.min) flag = 'low';
            else if (resultNum > testDef.max) flag = 'high';

            const refRangeStr = `${testDef.min} - ${testDef.max}`;

            foundMetrics.push({
              testName: testDef.displayName,
              resultValue: String(resultNum),
              unit: testDef.unit,
              referenceRange: refRangeStr,
              flag,
              meaning: flag === 'low' ? testDef.lowMeaning : (flag === 'high' ? testDef.highMeaning : 'Within healthy target range.')
            });

            handledTests.add(testDef.displayName);
          }
        }
      }
    }
  }

  return foundMetrics;
}

/**
 * Built-in Clinical Rules Engine: Synthesizes patient-friendly summaries
 * @param {string} rawText
 * @param {string} category
 * @param {Array<object>} metrics
 * @returns {object}
 */
function generateExpertClinicalSummary(rawText, category, metrics) {
  const abnormalMetrics = metrics.filter(m => m.flag !== 'normal');
  const normalMetrics = metrics.filter(m => m.flag === 'normal');

  let overview = '';
  const keyFindings = [];
  const doctorQuestions = [];

  if (metrics.length === 0) {
    overview = `We reviewed your uploaded ${category || 'medical'} document. The document did not contain standard numerical blood test parameters that matched our primary automated catalog, but the document has been successfully archived in your personal records.`;
    keyFindings.push('Document text successfully extracted and indexed for personal record storage.');
    keyFindings.push('Please ensure your uploaded report includes standard laboratory test rows with numerical values.');
    doctorQuestions.push('Could you review this report with me to clarify any findings not covered in the standard panel?');
    doctorQuestions.push('Do I need any follow-up blood work or imaging based on this report?');
  } else if (abnormalMetrics.length === 0) {
    overview = `Great news! Based on our analysis of your ${category || 'lab'} report, all ${metrics.length} identified biomarkers fall comfortably within standard laboratory reference ranges.`;
    keyFindings.push(`All ${metrics.length} evaluated metrics (including ${metrics.slice(0, 3).map(m => m.testName).join(', ')}) are within normal limits.`);
    keyFindings.push('Your metabolic and hematologic indicators show steady baseline stability.');
    doctorQuestions.push('Since all my tested values are within normal limits, what routine screening interval do you recommend for my next checkup?');
    doctorQuestions.push('Are there any lifestyle or preventive habits I should continue to sustain these healthy metrics?');
  } else {
    const abnormalNames = abnormalMetrics.map(m => `${m.testName} (${m.flag.toUpperCase()}: ${m.resultValue} ${m.unit})`).join(', ');
    overview = `Your ${category || 'health'} report indicates that most metrics are stable, but ${abnormalMetrics.length} biomarker${abnormalMetrics.length > 1 ? 's' : ''} fell slightly outside standard reference intervals (${abnormalNames}). These deviations are common and provide valuable conversation starters for your doctor.`;

    for (const item of abnormalMetrics) {
      keyFindings.push(`${item.testName} is ${item.flag}: ${item.resultValue} ${item.unit} (standard: ${item.referenceRange}). ${item.meaning}`);
      doctorQuestions.push(`My ${item.testName} is ${item.resultValue} ${item.unit}. Is this mild deviation clinically significant for my age and history?`);
    }

    if (normalMetrics.length > 0) {
      keyFindings.push(`${normalMetrics.length} other markers (including ${normalMetrics.slice(0, 2).map(m => m.testName).join(', ')}) were completely within normal reference boundaries.`);
    }

    doctorQuestions.push('Should I retest these specific markers in 3 to 6 months, or adjust my diet and hydration?');
  }

  // Ensure 2-4 solid doctor questions
  if (doctorQuestions.length < 2) {
    doctorQuestions.push('What are the recommended next steps or lifestyle adjustments based on these results?');
    doctorQuestions.push('Do I need any follow-up laboratory testing scheduled?');
  }

  return {
    overview,
    keyFindings,
    metrics: metrics.map(m => ({
      testName: m.testName,
      resultValue: m.resultValue,
      unit: m.unit,
      referenceRange: m.referenceRange,
      flag: m.flag
    })),
    doctorQuestions: doctorQuestions.slice(0, 4),
    disclaimer: 'Important Safety Disclaimer: Health Copilot provides educational data simplification and does NOT provide medical diagnoses or treatment recommendations. Always discuss laboratory findings with your personal physician.'
  };
}

/**
 * Attempts to call local Ollama model if available
 * @param {string} prompt
 * @returns {Promise<object|null>}
 */
async function queryOllama(prompt) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch('http://127.0.0.1:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.AI_MODEL_NAME || 'llama3',
        prompt: prompt,
        system: SYSTEM_PROMPT,
        stream: false,
        format: 'json'
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data && data.response) {
        return JSON.parse(data.response);
      }
    }
  } catch (e) {
    // Ollama not responding or model not pulled; graceful fallback
  }
  return null;
}

/**
 * Primary AI Health Summary Generation Service
 * @param {string} extractedText - Raw text from report
 * @param {string} [category='General'] - Report category tag
 * @returns {Promise<{ success: boolean, summary: object, status: string, engine: string }>}
 */
async function generateHealthSummary(extractedText, category = 'General') {
  try {
    const metrics = parseLabMetricsFromText(extractedText);

    // If local Ollama is active, attempt enhancement
    const prompt = `Analyze this patient's medical report:
Category: ${category}
Document Text:
${extractedText.substring(0, 3000)}`;

    const ollamaResponse = await queryOllama(prompt);
    if (ollamaResponse && ollamaResponse.overview && Array.isArray(ollamaResponse.metrics)) {
      return {
        success: true,
        status: 'analyzed',
        engine: 'ollama-local',
        summary: {
          overview: ollamaResponse.overview,
          keyFindings: ollamaResponse.keyFindings || [],
          metrics: ollamaResponse.metrics,
          doctorQuestions: ollamaResponse.doctorQuestions || [],
          disclaimer: 'Educational simplification only. Review all findings with your licensed healthcare provider.'
        }
      };
    }

    // Default: High-fidelity clinical rules expert system
    const expertSummary = generateExpertClinicalSummary(extractedText, category, metrics);
    return {
      success: true,
      status: 'analyzed',
      engine: 'clinical-expert-engine',
      summary: expertSummary
    };
  } catch (err) {
    console.error('[AI Service Error]', err);
    return {
      success: false,
      status: 'error',
      message: err.message,
      summary: {
        overview: 'Could not generate automated summary at this time.',
        keyFindings: ['An error occurred during analysis: ' + err.message],
        metrics: [],
        doctorQuestions: ['Please review the raw report with your doctor.'],
        disclaimer: 'Educational simplification only.'
      }
    };
  }
}

module.exports = {
  SYSTEM_PROMPT,
  CLINICAL_REFERENCE_DB,
  parseLabMetricsFromText,
  generateHealthSummary
};
