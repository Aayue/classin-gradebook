import { ParseResult, TargetRow, ProcessedAssignment, GradeMapping, ClassInTableStructure, TableMappingConfig } from '../types';

/**
 * Default table configuration according to requirements:
 * - Row 2 (index 1): Assignment Name
 * - Row 3 (index 2): Start Time -> Assignment Date
 * - Row 5 (index 4): Total Marks
 * - Columns 2 & 3 (index 1 & 2): Ignored
 * - Row 6+ (index 5+): Student Records
 */
export const DEFAULT_TABLE_CONFIG: TableMappingConfig = {
  assignmentNameRowIndex: 1, // Row 2 (0-indexed 1)
  startTimeRowIndex: 2,      // Row 3 (0-indexed 2)
  totalMarksRowIndex: 4,     // Row 5 (0-indexed 4)
  ignoreColIndices: [1, 2],  // Column 2 and Column 3 (0-indexed 1 and 2)
  studentStartRowIndex: 6    // Row 7 (0-indexed 6)
};

/**
 * Robustly parses a CSV line handling quotes and escaped characters
 */
export const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let startValueIndex = 0;
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      let value = line.substring(startValueIndex, i);
      // Remove surrounding quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1).replace(/""/g, '"');
      }
      result.push(value.trim());
      startValueIndex = i + 1;
    }
  }

  // Push the last value
  let lastValue = line.substring(startValueIndex);
  if (lastValue.startsWith('"') && lastValue.endsWith('"')) {
    lastValue = lastValue.slice(1, -1).replace(/""/g, '"');
  }
  result.push(lastValue.trim());

  return result;
};

export const parseCSV = (content: string): ParseResult => {
  const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) return { headers: [], data: [] };

  const data = lines.map(parseCSVLine);
  if (data.length === 0) return { headers: [], data: [] };

  const maxCols = Math.max(...data.map(row => row.length));
  const normalizedData = data.map(row => {
    if (row.length < maxCols) {
      return [...row, ...Array(maxCols - row.length).fill('')];
    }
    return row;
  });

  return {
    headers: normalizedData[0],
    data: normalizedData
  };
};

/**
 * Parses date string in multiple formats (ISO, YYYY-MM-DD, YYYY/MM/DD, DD/MM/YYYY, Chinese, M/D) into DD/MM/YYYY
 */
export const parseDateToUK = (rawDate: string | undefined | null, fallbackYear?: number): string | null => {
  if (!rawDate) return null;
  const trimmed = rawDate.trim();
  if (
    !trimmed ||
    trimmed === '-' ||
    trimmed.toLowerCase() === 'no grading' ||
    trimmed === '免' ||
    trimmed.toLowerCase() === 'start time' ||
    trimmed.includes('开始时间')
  ) {
    return null;
  }

  const currentYear = fallbackYear || new Date().getFullYear();

  // Format 1: YYYY-MM-DD or YYYY/MM/DD (with optional HH:mm[:ss]) e.g. "2023-09-17 18:00:00" or "2023/9/20"
  const ymdMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    const y = parseInt(ymdMatch[1], 10);
    const m = parseInt(ymdMatch[2], 10);
    const d = parseInt(ymdMatch[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
    }
  }

  // Format 2: Chinese date format "2023年9月17日" or "9月17日"
  const cnMatch = trimmed.match(/(?:(\d{4})年)?\s*(\d{1,2})月(\d{1,2})日/);
  if (cnMatch) {
    const y = cnMatch[1] ? parseInt(cnMatch[1], 10) : currentYear;
    const m = parseInt(cnMatch[2], 10);
    const d = parseInt(cnMatch[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
    }
  }

  // Format 3: DD/MM/YYYY or MM/DD/YYYY with 4-digit year (e.g. 17/09/2023 or 9/17/2023)
  const slash4DigitMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (slash4DigitMatch) {
    const p1 = parseInt(slash4DigitMatch[1], 10);
    const p2 = parseInt(slash4DigitMatch[2], 10);
    const y = parseInt(slash4DigitMatch[3], 10);
    if (p1 > 12 && p2 <= 12) {
      return `${String(p1).padStart(2, '0')}/${String(p2).padStart(2, '0')}/${y}`;
    }
    if (p2 > 12 && p1 <= 12) {
      return `${String(p2).padStart(2, '0')}/${String(p1).padStart(2, '0')}/${y}`;
    }
    return `${String(p1).padStart(2, '0')}/${String(p2).padStart(2, '0')}/${y}`;
  }

  // Format 4: M/D or MM/DD (e.g. "9/17 (Thu)" or "09/17" or "9-17")
  const mdMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})(?:\s*\([A-Za-z\u4e00-\u9fa5]+\))?/);
  if (mdMatch) {
    const m = parseInt(mdMatch[1], 10);
    const d = parseInt(mdMatch[2], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${currentYear}`;
    }
  }

  // Format 5: Date embedded inside assignment title or string (e.g. "9/17 (Thu) Binary Tree")
  const embeddedMatch = trimmed.match(/(?:^|[^\d])(\d{1,2})[-/](\d{1,2})(?:\s*\([A-Za-z\u4e00-\u9fa5]+\)|[^\d]|$)/);
  if (embeddedMatch) {
    const m = parseInt(embeddedMatch[1], 10);
    const d = parseInt(embeddedMatch[2], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${currentYear}`;
    }
  }

  return null;
};

/**
 * Returns today's date formatted as DD/MM/YYYY
 */
export const getTodayUK = (): string => {
  const today = new Date();
  const d = String(today.getDate()).padStart(2, '0');
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const y = today.getFullYear();
  return `${d}/${m}/${y}`;
};

/**
 * Analyzes the structure of a ClassIn exported table according to the rules:
 * - Row 2 (index 1): Assignment Name
 * - Row 3 (index 2): Start Time (Assignment Date)
 * - Row 5 (index 4): Total Marks
 * - Columns 2 & 3 (index 1 & 2): Ignored
 * - Row 6+ (index 5+): Student Rows
 *
 * Can also adapt gracefully if a compact or customized table is provided.
 */
export const analyzeClassInTable = (
  data: string[][],
  configOverride?: Partial<TableMappingConfig>
): ClassInTableStructure | null => {
  if (!data || data.length < 2) return null;

  const rowCount = data.length;

  // Determine row indices:
  // Default strictly to user specification if table has enough rows:
  let assignmentNameRowIndex = configOverride?.assignmentNameRowIndex ?? 1; // Row 2
  let startTimeRowIndex = configOverride?.startTimeRowIndex ?? 2;           // Row 3
  let totalMarksRowIndex = configOverride?.totalMarksRowIndex ?? 4;         // Row 5
  let ignoreColIndices = configOverride?.ignoreColIndices ?? [1, 2];        // Columns 2 & 3
  let studentStartRowIndex = configOverride?.studentStartRowIndex ?? 6;     // Row 7 (index 6)

  // Graceful fallback for short tables (e.g., test snippets with fewer than 7 rows)
  if (rowCount < 7) {
    // Check if Row 0 has assignment names (e.g. if user didn't include Row 1 title)
    const row0NonEmpty = data[0].filter(c => c.trim() !== '').length;
    const row1First = (data[1]?.[0] || '').toLowerCase();

    if (row1First.includes('total') || row1First.includes('总分') || row1First.includes('score')) {
      // Snippet format where Row 0 is Assignment Name, Row 1 is Total Score, Row 2 is Category, Row 3+ students
      assignmentNameRowIndex = 0;
      totalMarksRowIndex = 1;
      startTimeRowIndex = -1; // No start time row
      studentStartRowIndex = 3;
    } else if (rowCount >= 6) {
      studentStartRowIndex = 5;
    }
  }

  const assignmentNameRow = data[assignmentNameRowIndex] || [];
  const startTimeRow = startTimeRowIndex >= 0 && startTimeRowIndex < rowCount ? data[startTimeRowIndex] : [];
  const totalMarksRow = totalMarksRowIndex >= 0 && totalMarksRowIndex < rowCount ? data[totalMarksRowIndex] : [];

  // Gather student rows
  const studentRows = data.slice(studentStartRowIndex).filter(row => {
    const studentName = (row[0] || '').trim();
    return (
      studentName !== '' &&
      !studentName.startsWith('---') &&
      !studentName.toLowerCase().includes('average') &&
      !studentName.includes('平均') &&
      !studentName.includes('提交率')
    );
  });

  // Extract assignments:
  // Starts from column 1, skipping ignored columns (Columns 2 & 3, i.e., index 1 & 2)
  const assignments: ProcessedAssignment[] = [];
  const numCols = assignmentNameRow.length;

  for (let c = 1; c < numCols; c++) {
    // Check if column is ignored (Columns 2 and 3)
    if (ignoreColIndices.includes(c)) {
      continue;
    }

    const assignmentName = (assignmentNameRow[c] || '').trim();
    if (!assignmentName) continue;

    // Total Marks from Row 5 (index 4)
    const rawTotalMarks = totalMarksRow[c] || '';
    const cleanTotalMarks = rawTotalMarks.replace(/[^\d.]/g, '');
    const isNumericMarks = cleanTotalMarks !== '' && !isNaN(parseFloat(cleanTotalMarks));
    const totalMarks = isNumericMarks ? cleanTotalMarks : '100';

    // Start Time from Row 3 (index 2)
    const rawStartTime = startTimeRow.length > c ? (startTimeRow[c] || '').trim() : '';
    const startRowDate = parseDateToUK(rawStartTime);
    const titleDate = parseDateToUK(assignmentName);
    const detectedDate = startRowDate || titleDate || undefined;

    let dateSource: ProcessedAssignment['dateSource'] = undefined;
    if (startRowDate) {
      dateSource = 'start_time_row';
    } else if (titleDate) {
      dateSource = 'title_parsed';
    }

    assignments.push({
      name: assignmentName,
      totalMarks,
      originalIndex: c,
      rawStartTime: rawStartTime || undefined,
      detectedDate,
      dateSource
    });
  }

  const hasStartTimeRow = startTimeRowIndex >= 0 && startTimeRowIndex < rowCount && startTimeRow.length > 0;

  return {
    assignmentNameRowIndex,
    assignmentNameRow,
    startTimeRowIndex,
    startTimeRow,
    totalMarksRowIndex,
    totalMarksRow,
    ignoreColIndices,
    studentStartRowIndex,
    studentRows,
    assignments,
    hasStartTimeRow
  };
};

/**
 * Scans the parsed data for any non-numeric marks/statuses in student rows.
 */
export const getUniqueNonNumericMarks = (
  parsedData: ParseResult,
  configOverride?: Partial<TableMappingConfig>
): string[] => {
  const table = analyzeClassInTable(parsedData.data, configOverride);
  if (!table || table.assignments.length === 0 || table.studentRows.length === 0) return [];

  const uniqueSet = new Set<string>();

  table.studentRows.forEach(row => {
    table.assignments.forEach(assignment => {
      const raw = (row[assignment.originalIndex] || '').trim();
      if (!raw) return;

      if (raw === '-' || raw === '成绩类别' || raw === 'Category' || raw === assignment.name.trim()) return;

      if (isNaN(parseFloat(raw))) {
        uniqueSet.add(raw);
      }
    });
  });

  return Array.from(uniqueSet);
};

const STANDARD_GRADES = new Set(['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'U']);

/**
 * Converts ClassIn parsed data into standard Gradebook CSV rows.
 * Core Rules:
 * - Table Row 2 = Assignment Name
 * - Table Row 3 Start Time = Assignment Date (formatted as DD/MM/YYYY)
 * - Table Row 5 = Total Marks
 * - Columns 2 and 3 = Ignored (col index 1 and 2)
 * - Table Row 6+ = Student rows
 * - Individual dates can also be manually overridden in the UI inspector.
 */
export const processClassInToGradebook = (
  parsedData: ParseResult,
  gradeMapping: GradeMapping,
  customAssignmentDates?: Record<string, string>,
  configOverride?: Partial<TableMappingConfig>
): TargetRow[] => {
  const table = analyzeClassInTable(parsedData.data, configOverride);
  if (!table || table.assignments.length === 0 || table.studentRows.length === 0) return [];

  const todayUK = getTodayUK();

  // 1. Resolve final Assignment Date for each assignment:
  // Priority: Custom Manual Override -> Row 3 Start Time -> Assignment Title Date -> Today (DD/MM/YYYY)
  const resolvedAssignmentDates: Record<string, string> = {};

  table.assignments.forEach(assignment => {
    if (customAssignmentDates && customAssignmentDates[assignment.name]) {
      resolvedAssignmentDates[assignment.name] = customAssignmentDates[assignment.name];
      return;
    }

    if (assignment.detectedDate) {
      resolvedAssignmentDates[assignment.name] = assignment.detectedDate;
      return;
    }

    // Fallback if no start time or title date
    resolvedAssignmentDates[assignment.name] = todayUK;
  });

  // 2. Pre-analyze columns to determine if they are "PURE_STATUS" or "MIXED"
  const columnStats: Record<string, { type: 'PURE_STATUS' | 'MIXED'; average?: number }> = {};

  table.assignments.forEach(assignment => {
    let hasNumeric = false;
    let hasGrade = false;
    const valuesForAverage: number[] = [];
    const totalMarksNum = parseFloat(assignment.totalMarks);

    for (const row of table.studentRows) {
      const raw = (row[assignment.originalIndex] || '').trim();
      if (!raw || raw === assignment.name.trim() || raw === '-') continue;

      const numericVal = parseFloat(raw);
      if (!isNaN(numericVal)) {
        hasNumeric = true;
        valuesForAverage.push(numericVal);
      } else if (STANDARD_GRADES.has(raw.toUpperCase())) {
        hasGrade = true;
        const mapped = gradeMapping[raw.toUpperCase()];
        if (mapped && !isNaN(parseFloat(mapped))) {
          const percentage = parseFloat(mapped);
          const calculatedScore = (percentage / 100) * totalMarksNum;
          valuesForAverage.push(calculatedScore);
        }
      } else {
        const mapped = gradeMapping[raw.toUpperCase()];
        if (mapped && !isNaN(parseFloat(mapped))) {
          const percentage = parseFloat(mapped);
          const calculatedScore = (percentage / 100) * totalMarksNum;
          valuesForAverage.push(calculatedScore);
        }
      }
    }

    const type = hasNumeric || hasGrade ? 'MIXED' : 'PURE_STATUS';
    let average = 0;
    if (valuesForAverage.length > 0) {
      average = valuesForAverage.reduce((a, b) => a + b, 0) / valuesForAverage.length;
    }

    columnStats[assignment.name] = { type, average };
  });

  // 3. Process each student row into TargetRow entries
  const results: TargetRow[] = [];

  table.studentRows.forEach(row => {
    const studentName = (row[0] || '').trim();
    if (!studentName || studentName.startsWith('---')) return;

    table.assignments.forEach(assignment => {
      const rawMark = (row[assignment.originalIndex] || '').trim();
      if (rawMark === assignment.name.trim()) return;

      let finalMark = '';
      const numericMark = parseFloat(rawMark);
      const upperRaw = rawMark.toUpperCase();
      const stats = columnStats[assignment.name];
      const totalMarksNum = parseFloat(assignment.totalMarks);

      // Handle '-' as blank
      if (rawMark === '-') {
        finalMark = '';
      } else {
        let ruleApplied = false;
        let ruleValue = '';

        if (stats.type === 'PURE_STATUS') {
          // Pure Status column overrides:
          // 已提交 / Submitted = 100% of Total Marks
          if (rawMark === '已提交' || upperRaw === 'SUBMITTED') {
            ruleValue = totalMarksNum.toFixed(1);
            ruleApplied = true;
          } else if (rawMark === '未提交' || upperRaw === 'UNSUBMITTED') {
            ruleValue = '0';
            ruleApplied = true;
          } else if (rawMark === '已补交' || upperRaw === 'SUBMITTED LATE') {
            ruleValue = ((60 / 100) * totalMarksNum).toFixed(1);
            ruleApplied = true;
          }
        } else {
          // Mixed column overrides:
          if (rawMark === '未提交' || upperRaw === 'UNSUBMITTED') {
            ruleValue = '0';
            ruleApplied = true;
          } else if (rawMark === '已提交' || upperRaw === 'SUBMITTED') {
            ruleValue = stats.average !== undefined ? stats.average.toFixed(1) : '0';
            ruleApplied = true;
          }
        }

        if (ruleApplied) {
          finalMark = ruleValue.replace(/\.0$/, '.0');
        } else if (!isNaN(numericMark)) {
          finalMark = numericMark.toFixed(1).replace(/\.0$/, '.0');
        } else {
          if (gradeMapping.hasOwnProperty(upperRaw)) {
            const mapped = gradeMapping[upperRaw];
            if (mapped && !isNaN(parseFloat(mapped))) {
              const percentage = parseFloat(mapped);
              finalMark = ((percentage / 100) * totalMarksNum).toFixed(1).replace(/\.0$/, '.0');
            } else {
              finalMark = '';
            }
          } else {
            finalMark = '';
          }
        }
      }

      results.push({
        StudentName: studentName,
        AssignmentName: assignment.name,
        AssignmentDate: resolvedAssignmentDates[assignment.name] || todayUK,
        Category: 'Coursework',
        Marks: finalMark,
        TotalMarksPossible: totalMarksNum.toFixed(1)
      });
    });
  });

  return results;
};

/**
 * Injects or updates a 'Start Time' row in Row 3 of raw CSV text
 */
export const insertOrUpdateStartTimeInCSV = (
  csvContent: string,
  assignmentTimes: Record<string, string>,
  configOverride?: Partial<TableMappingConfig>
): string => {
  const parsed = parseCSV(csvContent);
  const table = analyzeClassInTable(parsed.data, configOverride);
  if (!table) return csvContent;

  const maxCols = Math.max(...parsed.data.map(r => r.length));
  const newRow = Array(maxCols).fill('');
  newRow[0] = 'Start Time';

  table.assignments.forEach(assignment => {
    const timeVal = assignmentTimes[assignment.name] || '';
    newRow[assignment.originalIndex] = timeVal;
  });

  const lines = [...parsed.data];
  if (table.startTimeRowIndex >= 0 && table.startTimeRowIndex < lines.length) {
    // Replace existing Start Time row
    lines[table.startTimeRowIndex] = newRow;
  } else {
    // Insert at Row 3 (index 2)
    const insertIndex = Math.min(2, lines.length);
    lines.splice(insertIndex, 0, newRow);
  }

  return lines
    .map(row =>
      row
        .map(val =>
          val.includes(',') || val.includes('"') || val.includes('\n')
            ? `"${val.replace(/"/g, '""')}"`
            : val
        )
        .join(',')
    )
    .join('\n');
};

export const generateCSVContent = (rows: TargetRow[]): string => {
  const headers = [
    'Student Name',
    'Assignment Name',
    'Assignment Date',
    'Category',
    'Marks',
    'Total Marks Possible'
  ];

  const csvRows = rows.map(row => [
    `"${row.StudentName}"`,
    `"${row.AssignmentName.replace(/"/g, '""')}"`,
    // Do NOT quote the date so Excel recognizes it as a date
    row.AssignmentDate,
    `"${row.Category}"`,
    row.Marks ? `${row.Marks}` : '',
    `${row.TotalMarksPossible}`
  ]);

  return [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n');
};
