import React, { useState } from 'react';
import { ProcessedAssignment } from '../types';
import { CalendarIcon, ClockIcon, PencilSquareIcon, CheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface AssignmentDateInspectorProps {
  assignments: ProcessedAssignment[];
  resolvedDates: Record<string, string>;
  customOverrides: Record<string, string>;
  onDateOverrideChange: (assignmentName: string, newDateUK: string) => void;
  onResetOverrides: () => void;
}

export const AssignmentDateInspector: React.FC<AssignmentDateInspectorProps> = ({
  assignments,
  resolvedDates,
  customOverrides,
  onDateOverrideChange,
  onResetOverrides
}) => {
  const [editingAssignment, setEditingAssignment] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const startEdit = (name: string, currentDate: string) => {
    setEditingAssignment(name);
    const parts = currentDate.split('/');
    if (parts.length === 3) {
      setEditValue(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
    } else {
      setEditValue('');
    }
  };

  const saveEdit = (name: string) => {
    if (editValue) {
      const parts = editValue.split('-');
      if (parts.length === 3) {
        const ukDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
        onDateOverrideChange(name, ukDate);
      }
    }
    setEditingAssignment(null);
  };

  const hasOverrides = Object.keys(customOverrides).length > 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900 flex items-center">
              <CalendarIcon className="h-5 w-5 text-indigo-600 mr-2" />
              作业日期确认 (Assignment Date from Row 3 Start Time)
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
              <ClockIcon className="h-3.5 w-3.5 mr-1" />
              已提取第3行 Start Time
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            所有作业的 Assignment Date 均直接读取表格第3行开始时间，并统一转为标准 UK 日期格式（DD/MM/YYYY）。支持单项快速微调。
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasOverrides && (
            <button
              onClick={onResetOverrides}
              className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              title="Reset all manual date edits"
            >
              <ArrowPathIcon className="h-3.5 w-3.5 mr-1" />
              恢复默认 ({Object.keys(customOverrides).length})
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            {isExpanded ? '收起作业列表' : `查看全部作业 (${assignments.length}项)`}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="overflow-x-auto max-h-80">
          <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-semibold text-gray-600">
                  #
                </th>
                <th scope="col" className="px-4 py-2.5 font-semibold text-gray-600">
                  作业名称 (Row 2)
                </th>
                <th scope="col" className="px-4 py-2.5 font-semibold text-gray-600">
                  满分 (Row 5)
                </th>
                <th scope="col" className="px-4 py-2.5 font-semibold text-gray-600">
                  源表格第3行 Start Time
                </th>
                <th scope="col" className="px-4 py-2.5 font-semibold text-gray-600">
                  导出日期 (DD/MM/YYYY)
                </th>
                <th scope="col" className="px-4 py-2.5 font-semibold text-gray-600">
                  状态
                </th>
                <th scope="col" className="px-4 py-2.5 font-semibold text-gray-600">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {assignments.map((assignment, idx) => {
                const currentDate = resolvedDates[assignment.name] || 'N/A';
                const isOverridden = Boolean(customOverrides[assignment.name]);
                const isEditing = editingAssignment === assignment.name;

                let sourceBadge = (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                    Row 3 Start Time
                  </span>
                );

                if (isOverridden) {
                  sourceBadge = (
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 text-purple-800">
                      已手动调整
                    </span>
                  );
                } else if (assignment.dateSource === 'title_parsed') {
                  sourceBadge = (
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-800">
                      标题解析
                    </span>
                  );
                }

                return (
                  <tr key={idx} className="hover:bg-indigo-50/40 transition-colors">
                    <td className="px-4 py-2 text-gray-400 font-mono">{idx + 1}</td>
                    <td className="px-4 py-2 font-medium text-gray-900 max-w-xs truncate" title={assignment.name}>
                      {assignment.name}
                    </td>
                    <td className="px-4 py-2 text-gray-600 font-mono">{assignment.totalMarks}</td>
                    <td className="px-4 py-2 font-mono text-gray-700">
                      {assignment.rawStartTime ? (
                        <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                          {assignment.rawStartTime}
                        </span>
                      ) : (
                        <span className="text-gray-300 italic">None</span>
                      )}
                    </td>
                    <td className="px-4 py-2 font-mono font-semibold text-indigo-700">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="date"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="border border-indigo-400 rounded px-1.5 py-0.5 text-xs text-gray-900 focus:ring-1 focus:ring-indigo-500"
                          />
                          <button
                            onClick={() => saveEdit(assignment.name)}
                            className="p-1 text-emerald-600 hover:text-emerald-800"
                            title="保存"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        currentDate
                      )}
                    </td>
                    <td className="px-4 py-2">{sourceBadge}</td>
                    <td className="px-4 py-2">
                      {!isEditing && (
                        <button
                          onClick={() => startEdit(assignment.name, currentDate)}
                          className="inline-flex items-center text-xs text-gray-500 hover:text-indigo-600"
                          title="修改日期"
                        >
                          <PencilSquareIcon className="h-3.5 w-3.5 mr-0.5" />
                          修改
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AssignmentDateInspector;
