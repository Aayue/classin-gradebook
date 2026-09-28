import React, { useState } from 'react';
import { ClassInTableStructure } from '../types';
import { TableCellsIcon, ClockIcon, EyeSlashIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';

interface ClassInTableViewerProps {
  tableStructure: ClassInTableStructure;
}

export const ClassInTableViewer: React.FC<ClassInTableViewerProps> = ({ tableStructure }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const previewStudentRows = tableStructure.studentRows.slice(0, 5);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center">
            <TableCellsIcon className="h-5 w-5 text-indigo-600 mr-2" />
            ClassIn 源表格解析预览 (ClassIn Table Structure)
          </h3>
          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-gray-600">
            <span className="inline-flex items-center px-2 py-0.5 rounded font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
              第2行: 作业名称
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              第3行: Start Time 作为日期
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded font-medium bg-blue-50 text-blue-700 border border-blue-200">
              第5行: 满分 (Total Marks)
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded font-medium bg-amber-50 text-amber-700 border border-amber-200">
              <EyeSlashIcon className="h-3 w-3 mr-1 inline" />
              第2列 & 第3列已忽略
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded font-medium bg-purple-50 text-purple-700 border border-purple-200">
              第7行起: 学生成绩数据
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
        >
          {isExpanded ? '收起表格预览' : `查看源表格结构 (${tableStructure.assignments.length} 个有效作业)`}
        </button>
      </div>

      {isExpanded && (
        <div className="overflow-x-auto max-h-[420px]">
          <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
            <tbody className="divide-y divide-gray-100 bg-white">
              {/* Row 2: Assignment Name */}
              <tr className="bg-indigo-50/70 font-semibold border-b border-indigo-100">
                <td className="px-4 py-2.5 text-indigo-900 bg-indigo-100/70 sticky left-0 z-10 whitespace-nowrap">
                  <span className="flex items-center">
                    <CheckBadgeIcon className="h-4 w-4 mr-1 text-indigo-600" />
                    第2行: 作业名称 (Assignment Name)
                  </span>
                </td>
                {tableStructure.assignments.map((assignment, idx) => (
                  <td key={idx} className="px-4 py-2.5 text-indigo-950 font-bold whitespace-nowrap">
                    {assignment.name}
                  </td>
                ))}
              </tr>

              {/* Row 3: Start Time */}
              <tr className="bg-emerald-50/70 font-medium border-b border-emerald-100">
                <td className="px-4 py-2.5 text-emerald-900 bg-emerald-100/70 sticky left-0 z-10 whitespace-nowrap">
                  <span className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1 text-emerald-600" />
                    第3行: Start Time (Assignment Date)
                  </span>
                </td>
                {tableStructure.assignments.map((assignment, idx) => (
                  <td key={idx} className="px-4 py-2.5 text-emerald-800 font-mono whitespace-nowrap">
                    {assignment.rawStartTime ? (
                      <div>
                        <span>{assignment.rawStartTime}</span>
                        {assignment.detectedDate && (
                          <span className="ml-2 font-bold text-emerald-900 bg-emerald-200/60 px-1 py-0.5 rounded text-[10px]">
                            → {assignment.detectedDate}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">No start time</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Row 5: Total Score / Marks */}
              <tr className="bg-blue-50/50 font-medium border-b border-blue-100">
                <td className="px-4 py-2 text-blue-900 bg-blue-100/60 sticky left-0 z-10 whitespace-nowrap">
                  第5行: 满分 (Total Marks)
                </td>
                {tableStructure.assignments.map((assignment, idx) => (
                  <td key={idx} className="px-4 py-2 text-blue-800 font-mono whitespace-nowrap">
                    {assignment.totalMarks}
                  </td>
                ))}
              </tr>

              {/* Student Rows Preview (Row 7+) */}
              {previewStudentRows.map((studentRow, sIdx) => (
                <tr key={sIdx} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-4 py-2 font-medium text-gray-900 bg-gray-50 sticky left-0 z-10 whitespace-nowrap border-r border-gray-200">
                    <span className="text-[10px] text-gray-400 font-mono mr-1">R{sIdx + 7}</span>
                    {studentRow[0]}
                  </td>
                  {tableStructure.assignments.map((assignment, aIdx) => (
                    <td key={aIdx} className="px-4 py-2 text-gray-700 font-mono whitespace-nowrap">
                      {studentRow[assignment.originalIndex] || <span className="text-gray-300 italic">-</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {tableStructure.studentRows.length > 5 && (
            <div className="bg-gray-50 px-4 py-2 text-center text-xs text-gray-500 border-t border-gray-200">
              ...共检测到 {tableStructure.studentRows.length} 名学生（自表格第7行起），{tableStructure.assignments.length} 项作业（第2列与第3列已自动忽略）
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClassInTableViewer;
