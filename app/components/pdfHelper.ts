/**
 * PDF Form Field Manager - Handles multi-line field distribution
 */

// Type definitions
type FieldGroup = {
  fieldIds: string[];
  charLimits: number[];
  fieldLabel: string;
};

type FormFieldGroups = {
  [key: string]: FieldGroup;
};

type FieldMapping = {
  [key: string]: string;
};

type FillResult = {
  success: number;
  failures: string[];
};

// Configuration for form field groups and their character limits
const FORM_FIELD_GROUPS: FormFieldGroups = {
  // Each key represents a logical field group in your form
  description1: {
    fieldIds: [
      "Text26",
      "Text27",
      "Text28",
      "Text29",
      "Text30",
      "Text31",
      "Text32",
      "Text33",
      "Text34",
      "Text35",
      "Text36",
      "Text37",
      "Text38",
      "Text39",
    ],
    charLimits: [
      100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
    ],
    fieldLabel: "Describe the accident in detail",
  },
  description2: {
    fieldIds: ["Text40", "Text41", "Text42"],
    charLimits: [100, 100, 100],
    fieldLabel: "What construction equipment was involved?",
  },
  description3: {
    fieldIds: ["Text43", "Text44", "Text45"],
    charLimits: [72, 100, 100],
    fieldLabel: "What type of PPE was being used",
  },
  description4: {
    fieldIds: ["Text46", "Text47", "Text48"],
    charLimits: [67, 100, 100],
    fieldLabel: "What was the direct cause of the accident?",
  },
  description5: {
    fieldIds: ["Text49", "Text50"],
    charLimits: [100, 100],
    fieldLabel: "What was the indirect cause of the accident?",
  },
  description6: {
    fieldIds: ["Text51", "Text52"],
    charLimits: [100, 100],
    fieldLabel: "Action taken to prevent re-occurrence",
  },
  description7: {
    fieldIds: [
      "Text55",
      "Text56",
      "Text57",
      "Text58",
      "Text59",
      "Text60",
      "Text61",
      "Text62",
      "Text63",
    ],
    charLimits: [93, 100, 100, 100, 100, 100, 100, 100, 100],
    fieldLabel: "Why did the unsafe condition exist?",
  },
  description8: {
    fieldIds: [
      "Text64",
      "Text65",
      "Text66",
      "Text67",
      "Text68",
      "Text69",
      "Text70",
    ],
    charLimits: [100, 100, 100, 100, 100, 100, 80],
    fieldLabel: "Why did the unsafe act occur?",
  },
  description9: {
    fieldIds: ["Text71", "Text72", "Text73", "Text74", "Text75"],
    charLimits: [100, 100, 100, 100, 100],
    fieldLabel:
      "Is there a reward(such as 'the job can be done more quickly' or 'the product is less likely to be damaged') that may have encouraged the unsafe act?",
  },
  description10: {
    fieldIds: ["Text76", "Text77", "Text78"],
    charLimits: [100, 100, 100],
    fieldLabel:
      "Were the usafe acts or conditions reported prior to the accident?",
  },
  description11: {
    fieldIds: ["Text79", "Text80", "Text81"],
    charLimits: [100, 100, 100],
    fieldLabel:
      "Have there been similar accidents or near misses prior to the accident?",
  },
  witnessStatement: {
    fieldIds: [
      "Text14",
      "Text15",
      "Text16",
      "Text17",
      "Text18",
      "Text19",
      "Text20",
      "Text21",
      "Text22",
      "Text23",
      "Text24",
      "Text25",
      "Text26",
      "Text27",
      "Text28",
      "Text29",
    ],
    charLimits: [
      100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
      100,
    ],
    fieldLabel: "Witness Statement",
  },
  incidentDescription: {
    fieldIds: [
      "Text10",
      "Text11",
      "Text12",
      "Text13",
      "Text14",
      "Text15",
      "Text16",
      "Text17",
    ],
    charLimits: [100, 100, 100, 100, 100, 100, 100, 100],
    fieldLabel: "Incident Description",
  },
  preventionSuggestion: {
    fieldIds: [
      "Text18",
      "Text19",
      "Text20",
      "Text21",
      "Text22",
      "Text23",
      "Text24",
      "Text25",
    ],
    charLimits: [100, 100, 100, 100, 100, 100, 100, 100],
    fieldLabel: "Prevention Suggestion",
  },
  correctiveActions: {
    fieldIds: [
      "Text26",
      "Text27",
      "Text28",
      "Text29",
      "Text30",
      "Text31",
      "Text32",
    ],
    charLimits: [100, 100, 100, 100, 100, 100, 100],
    fieldLabel: "Corrective Actions",
  },
  safetyMeetingTopic: {
    fieldIds: ["Text6", "Text7", "Text8", "Text9", "Text10", "Text11"],
    charLimits: [80, 100, 100, 100, 100, 100],
    fieldLabel: "Safety Meeting Topic",
  },
  violationDescription: {
    fieldIds: ["Text5", "Text6", "Text7", "Text8", "Text9", "Text10"],
    charLimits: [100, 100, 100, 100, 100, 100],
    fieldLabel: "Violation Description",
  },
  employeeExplanation: {
    fieldIds: [
      "Text11",
      "Text12",
      "Text13",
      "Text14",
      "Text15",
      "Text16",
      "Text17",
    ],
    charLimits: [80, 100, 100, 100, 100, 100, 100],
    fieldLabel: "Employee Explanation",
  },
};

/**
 * Distributes text across multiple PDF form fields with configurable character limits
 *
 * @param text - The full text to distribute across fields
 * @param charLimits - Array of character limits for each field
 * @param respectWords - Whether to avoid breaking words (default: true)
 * @param trimSpaces - Whether to trim leading/trailing spaces in each field (default: true)
 * @returns Array of text chunks for each field
 */
function distributeTextAcrossFields(
  text: string,
  charLimits: number[],
  respectWords: boolean = true,
  trimSpaces: boolean = true
): string[] {
  // Input validation
  if (!text || !charLimits || !charLimits.length) {
    return [];
  }

  const result: string[] = [];
  let remainingText = text.trim();

  // Process each field
  for (let i = 0; i < charLimits.length; i++) {
    const limit = charLimits[i];

    // If we've processed all text, add empty strings for remaining fields
    if (remainingText.length === 0) {
      result.push("");
      continue;
    }

    // If remaining text fits within current field
    if (remainingText.length <= limit) {
      result.push(remainingText);
      remainingText = "";
      // Add empty strings for any remaining fields
      for (let j = i + 1; j < charLimits.length; j++) {
        result.push("");
      }
      break;
    }

    // Need to split text for this field
    let breakPoint = limit;

    // If respecting word boundaries, find appropriate break point
    if (respectWords) {
      // Look for last space before limit
      const lastSpace = remainingText.lastIndexOf(" ", limit);

      // If found within reasonable range (not cutting off too much)
      if (lastSpace !== -1 && lastSpace > limit * 0.7) {
        breakPoint = lastSpace;
      } else {
        // Look for a hyphen or other natural break point
        const lastHyphen = remainingText.lastIndexOf("-", limit);
        if (lastHyphen !== -1 && lastHyphen > limit * 0.8) {
          breakPoint = lastHyphen + 1; // Include the hyphen
        }
      }
    }

    // Extract text for this field
    let fieldText = remainingText.substring(0, breakPoint);

    // Trim spaces if requested
    if (trimSpaces) {
      fieldText = fieldText.trim();
    }

    result.push(fieldText);

    // Update remaining text, accounting for space consumed
    remainingText = remainingText.substring(breakPoint).trim();
  }

  // If there's still text remaining, append it to the last field
  if (remainingText.length > 0 && result.length > 0) {
    const lastIndex = result.length - 1;
    const availableSpace = charLimits[lastIndex] - result[lastIndex].length;

    if (availableSpace > 0) {
      const additionalText = remainingText.substring(0, availableSpace);
      result[lastIndex] += " " + additionalText;
    }
  }

  return result;
}

/**
 * Fill a multi-line text field group with content
 *
 * @param pdfForm - PDF form instance from pdf-lib
 * @param groupKey - Key of the field group in FORM_FIELD_GROUPS
 * @param text - Text content to distribute across fields
 * @returns Success status
 */
function fillMultiLineField(
  pdfForm: any,
  groupKey: string,
  text: string
): boolean {
  if (!FORM_FIELD_GROUPS[groupKey]) {
    console.error(`Field group "${groupKey}" not found in configuration`);
    return false;
  }

  const group = FORM_FIELD_GROUPS[groupKey];
  const textChunks = distributeTextAcrossFields(text, group.charLimits);

  // Fill each field with its corresponding text chunk
  group.fieldIds.forEach((fieldId, index) => {
    try {
      const field = pdfForm.getTextField(fieldId);
      if (field && index < textChunks.length) {
        field.setText(textChunks[index] || "");
      }
    } catch (error) {
      console.error(`Error setting text for field ${fieldId}:`, error);
    }
  });

  return true;
}

/**
 * Fills all multi-line fields from a data object
 *
 * @param pdfForm - PDF form instance from pdf-lib
 * @param formData - Object containing form data with keys matching the field group keys
 * @param fieldMapping - Optional mapping between formData keys and FORM_FIELD_GROUPS keys
 * @returns Result with success count and failures
 */
function fillAllMultiLineFields(
  pdfForm: any,
  formData: Record<string, any>,
  fieldMapping: FieldMapping = {}
): FillResult {
  const results: FillResult = {
    success: 0,
    failures: [],
  };

  // Process each field in the form data
  Object.entries(formData).forEach(([dataKey, value]) => {
    // Get the corresponding field group key (use mapping or direct key)
    const groupKey = fieldMapping[dataKey] || dataKey;

    // Only process if we have text and a matching field group
    if (value && FORM_FIELD_GROUPS[groupKey]) {
      const success = fillMultiLineField(pdfForm, groupKey, value.toString());

      if (success) {
        results.success++;
      } else {
        results.failures.push(dataKey);
      }
    }
  });

  return results;
}

// Export the utility functions
export {
  FORM_FIELD_GROUPS,
  distributeTextAcrossFields,
  fillMultiLineField,
  fillAllMultiLineFields,
  // Type exports
  type FieldGroup,
  type FormFieldGroups,
  type FieldMapping,
  type FillResult,
};
