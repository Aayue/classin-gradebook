import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import FileUploader from './components/FileUploader';
import GradeMapper from './components/GradeMapper';
import AssignmentDateInspector from './components/AssignmentDateInspector';
import ClassInTableViewer from './components/ClassInTableViewer';
import {
  parseCSV,
  analyzeClassInTable,
  processClassInToGradebook,
  generateCSVContent,
  getUniqueNonNumericMarks
} from './utils/csvHelper';
import { TargetRow, GradeMapping, ClassInTableStructure } from './types';
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  TableCellsIcon,
  EyeSlashIcon,
  DocumentCheckIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const App: React.FC = () => {
  const [rawContent, setRawContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  // Per-assignment custom date overrides (assignmentName -> DD/MM/YYYY)
  const [customAssignmentDates, setCustomAssignmentDates] = useState<Record<string, string>>({});

  const [processedData, setProcessedData] = useState<TargetRow[]>([]);
  const [tableStructure, setTableStructure] = useState<ClassInTableStructure | null>(null);

  // Default mapping based on rules (supporting both Chinese and English statuses)
  const [gradeMapping, setGradeMapping] = useState<GradeMapping>({
    'A*': '100',
    'A': '90',
    'B': '80',
    'C': '70',
    'D': '60',
    'E': '50',
    'U': '0',
    '需订正': '50',
    '已补交': '60',
    '已订正': '80',
    'REVISION REQUIRED': '50',
    'SUBMITTED LATE': '60',
    'REVISED': '80'
  });

  const handleFileSelect = (content: string, name: string) => {
    setRawContent(content);
    setFileName(name);
    setCustomAssignmentDates({});

    // Analyze file for new non-numeric statuses
    const parsed = parseCSV(content);
    const foundStatuses = getUniqueNonNumericMarks(parsed);

    setGradeMapping((prev) => {
      const next = { ...prev };
      let hasChanges = false;

      foundStatuses.forEach((status) => {
        const key = status.toUpperCase();
        if (!next.hasOwnProperty(key)) {
          next[key] = '0';
          hasChanges = true;
        }
      });

      return hasChanges ? next : prev;
    });
  };

  // Re-process when content, mapping, or date overrides change
  useEffect(() => {
    if (!rawContent) {
      setProcessedData([]);
      setTableStructure(null);
      return;
    }

    const parsed = parseCSV(rawContent);
    const structure = analyzeClassInTable(parsed.data);
    setTableStructure(structure);

    const processed = processClassInToGradebook(
      parsed,
      gradeMapping,
      customAssignmentDates
    );
    setProcessedData(processed);
  }, [rawContent, gradeMapping, customAssignmentDates]);

  const handleDateOverrideChange = (assignmentName: string, newDateUK: string) => {
    setCustomAssignmentDates((prev) => ({
      ...prev,
      [assignmentName]: newDateUK
    }));
  };

  const handleResetDateOverrides = () => {
    setCustomAssignmentDates({});
  };

  const handleDownload = () => {
    if (processedData.length === 0) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const csvContent = generateCSVContent(processedData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `gradebook_export_${todayStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Resolved assignment date map for quick lookup
  const resolvedAssignmentDates = useMemo(() => {
    const map: Record<string, string> = {};
    processedData.forEach((row) => {
      if (!map[row.AssignmentName]) {
        map[row.AssignmentName] = row.AssignmentDate;
      }
    });
    return map;
  }, [processedData]);

  // Preview a slice of data to avoid rendering massive tables
  const previewData = useMemo(() => processedData.slice(0, 12), [processedData]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
      <Header />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Step 1: Upload Source File & Core Conversion Rules */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <span className="bg-indigo-100 text-indigo-800 text-xs font-bold mr-2.5 px-3 py-1 rounded-full uppercase tracking-wide">
                  Step 1
                </span>
                上传 ClassIn 源表格 (Upload Source File)
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                上传由 ClassIn 导出的原始成绩表格（CSV/TXT），系统将自动按指定规则完成清洗与转换。
              </p>
            </div>

            {/* Rule Indicator Badges */}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                <DocumentCheckIcon className="h-3.5 w-3.5 mr-1" />
                第2行 → Assignment Name
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <SparklesIcon className="h-3.5 w-3.5 mr-1" />
                第3行 Start Time → Assignment Date
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md font-medium bg-blue-50 text-blue-700 border border-blue-200">
                第5行 → Total Marks
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <EyeSlashIcon className="h-3.5 w-3.5 mr-1" />
                第2列 & 第3列忽略
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md font-medium bg-purple-50 text-purple-700 border border-purple-200">
                第7行起 → Student Name
              </span>
            </div>
          </div>

          <FileUploader onFileSelect={handleFileSelect} />

          {fileName && tableStructure && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 text-xs rounded-xl flex flex-wrap items-center justify-between gap-3 text-emerald-900">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 mr-2 text-emerald-600 flex-shrink-0" />
                <div>
                  <span className="font-bold text-emerald-950">已加载文件：</span>
                  <span className="font-mono">{fileName}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 font-medium">
                <span className="bg-white/80 px-2 py-1 rounded border border-emerald-200 text-emerald-800">
                  有效作业：{tableStructure.assignments.length} 个
                </span>
                <span className="bg-white/80 px-2 py-1 rounded border border-emerald-200 text-emerald-800">
                  学生记录：{tableStructure.studentRows.length} 名
                </span>
                <span className="bg-white/80 px-2 py-1 rounded border border-emerald-200 text-emerald-800">
                  第2列 & 第3列已过滤
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Source Table Structure Inspector */}
        {tableStructure && (
          <ClassInTableViewer tableStructure={tableStructure} />
        )}

        {/* Assignment Date Inspector */}
        {tableStructure && tableStructure.assignments.length > 0 && (
          <AssignmentDateInspector
            assignments={tableStructure.assignments}
            resolvedDates={resolvedAssignmentDates}
            customOverrides={customAssignmentDates}
            onDateOverrideChange={handleDateOverrideChange}
            onResetOverrides={handleResetDateOverrides}
          />
        )}

        {/* Step 2: Grade Mapping */}
        <div>
          <div className="mb-2">
            <h2 className="text-base font-bold text-gray-900 flex items-center">
              <span className="bg-indigo-100 text-indigo-800 text-xs font-bold mr-2 px-2.5 py-0.5 rounded-full">
                Step 2
              </span>
              成绩状态与等级映射 (Score & Status Mapping)
            </h2>
          </div>
          <GradeMapper mapping={gradeMapping} onChange={setGradeMapping} />
        </div>

        {/* Step 3: Preview & Download */}
        {processedData.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                  <span className="bg-indigo-100 text-indigo-800 text-xs font-bold mr-2 px-2.5 py-0.5 rounded-full">
                    Step 3
                  </span>
                  预览与下载 Gradebook CSV
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  共生成 <span className="font-bold text-indigo-600">{processedData.length}</span> 条标准化作业成绩记录，日期已同步自表格第3行开始时间。
                </p>
              </div>
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                下载 Gradebook CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Student Name', 'Assignment Name', 'Assignment Date (DD/MM/YYYY)', 'Category', 'Marks', 'Total Marks Possible'].map(
                      (h) => (
                        <th
                          key={h}
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3.5 whitespace-nowrap text-sm font-medium text-gray-900">
                        {row.StudentName}
                      </td>
                      <td
                        className="px-6 py-3.5 whitespace-nowrap text-sm text-gray-700 truncate max-w-xs font-medium"
                        title={row.AssignmentName}
                      >
                        {row.AssignmentName}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-sm font-mono font-semibold text-emerald-700 bg-emerald-50/40">
                        {row.AssignmentDate}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-sm text-gray-500">{row.Category}</td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-sm text-gray-900 font-mono font-bold">
                        {row.Marks || <span className="text-gray-300 italic font-sans font-normal">留空</span>}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {row.TotalMarksPossible}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {processedData.length > 12 && (
              <div className="bg-gray-50 px-6 py-3 text-center text-xs text-gray-500 border-t border-gray-200">
                ...已展示前 12 条记录，共 {processedData.length} 条记录待导出
              </div>
            )}
          </div>
        )}

        {processedData.length === 0 && rawContent && (
          <div className="rounded-xl bg-yellow-50 p-5 border border-yellow-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <TableCellsIcon className="h-6 w-6 text-yellow-500" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-bold text-yellow-800">未检测到有效作业数据</h3>
                <div className="mt-1 text-xs text-yellow-700 space-y-1">
                  <p>
                    请确保源表格第2行为作业名称、第5行为满分，且包含学生成绩记录。
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
