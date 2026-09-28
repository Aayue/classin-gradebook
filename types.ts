export interface SourceRow {
  [key: string]: string;
}

export type DateSourceType = 'start_time_row' | 'title_parsed' | 'today_fallback' | 'manual';

export interface ProcessedAssignment {
  name: string;
  totalMarks: string;
  originalIndex: number; // Column index in the source CSV
  rawStartTime?: string; // Raw start time string extracted from Start Time row (Row 3)
  detectedDate?: string; // Formatted DD/MM/YYYY date
  dateSource?: DateSourceType; // Source of the date
}

export interface TargetRow {
  StudentName: string;
  AssignmentName: string;
  AssignmentDate: string;
  Category: string;
  Marks: string;
  TotalMarksPossible: string;
}

export interface ParseResult {
  headers: string[];
  data: string[][]; // 2D array of strings
}

export interface GradeMapping {
  [grade: string]: string; // keeping value as string to allow flexible user input (though usually numeric)
}

export interface TableMappingConfig {
  assignmentNameRowIndex: number; // 0-based: default 1 (Row 2)
  startTimeRowIndex: number;      // 0-based: default 2 (Row 3)
  totalMarksRowIndex: number;     // 0-based: default 4 (Row 5)
  ignoreColIndices: number[];     // default [1, 2] (Columns 2 and 3)
  studentStartRowIndex: number;   // 0-based: default 6 (Row 7)
}


export interface ClassInTableStructure {
  assignmentNameRowIndex: number;
  assignmentNameRow: string[];
  startTimeRowIndex: number;
  startTimeRow: string[];
  totalMarksRowIndex: number;
  totalMarksRow: string[];
  ignoreColIndices: number[];
  studentStartRowIndex: number;
  studentRows: string[][];
  assignments: ProcessedAssignment[];
  hasStartTimeRow: boolean;
}

