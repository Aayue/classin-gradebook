import React, { useRef, useState } from 'react';
import { DocumentArrowUpIcon, ClipboardDocumentIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface FileUploaderProps {
  onFileSelect: (content: string, fileName: string) => void;
}

/**
 * Standard ClassIn Export Table conforming to:
 * - Row 1: Course / Title info
 * - Row 2: Assignment Name
 * - Row 3: Start Time (Assignment Date)
 * - Row 4: Deadline / Category
 * - Row 5: Total Score / Marks
 * - Row 6: Grades Category
 * - Col 2 & Col 3: Ignored
 * - Col 4+: Assignments
 * - Row 7+: Student records
 */
const SAMPLE_CLASSIN_STANDARD = `Course: Computer Science 2023-2024,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
Assignment Name,algorithm PPT,Big O Notation,Linear Search (search a word),Binary Search * (challenge),Bubble Sort,Insertion Sort,Generate time taken graphics using matplotlib,Other sorting algorithm and its time complexity graphics,Stack,Stack Classical Problems,Queue,Queue - Past paper practice,Stack Quiz,Create and add items in linked list(using class),Linked List,LinkedList (class&array method),Linked List Past Paper Practice,Linked List (2D array),Linked List Challenge 1 - Print in reverse,Linked List Challenge 2 - Merge two lists,Linked List Challenge 3 - Remove all occurrences,9/17 (Thu) Binary Tree(1D array+Class),9/20 (Sun) Binary Tree - Past paper practice,9/22 (Tue) Graph&hashtable&dictionary,Recursion PPT,Recursive factorial function,Recursive formula,Recursive binary search,Recursion Questions Practice,9/23 (Wed) Recursion 中秋作业
Start Time,2023-09-01 09:00,2023-09-02 09:00,2023-09-03 10:00,2023-09-04 10:00,2023-09-05 10:00,2023-09-06 10:00,2023-09-07 10:00,2023-09-08 10:00,2023-09-09 10:00,2023-09-10 10:00,2023-09-11 10:00,2023-09-12 10:00,2023-09-13 10:00,2023-09-14 10:00,2023-09-15 10:00,2023-09-16 10:00,2023-09-17 10:00,2023-09-18 10:00,2023-09-19 10:00,2023-09-20 10:00,2023-09-21 10:00,2023-09-22 10:00,2023-09-23 10:00,2023-09-24 10:00,2023-09-25 10:00,2023-09-26 10:00,2023-09-27 10:00,2023-09-28 10:00,2023-09-29 10:00,2023-09-30 10:00
Deadline,2023-09-05 23:59,2023-09-05 23:59,2023-09-10 23:59,2023-09-10 23:59,2023-09-15 23:59,2023-09-15 23:59,2023-09-20 23:59,2023-09-20 23:59,2023-09-25 23:59,2023-09-25 23:59,2023-09-30 23:59,2023-09-30 23:59,2023-10-05 23:59,2023-10-05 23:59,2023-10-10 23:59,2023-10-10 23:59,2023-10-15 23:59,2023-10-15 23:59,2023-10-20 23:59,2023-10-20 23:59,2023-10-25 23:59,2023-10-25 23:59,2023-10-30 23:59,2023-10-30 23:59,2023-11-05 23:59,2023-11-05 23:59,2023-11-10 23:59,2023-11-10 23:59,2023-11-15 23:59,2023-11-15 23:59
Total Score,No Grading,No Grading,100,100,100,100,100,100,100,100,100,100,25,100,100,100,24,100,100,100,100,100,21,40,No Grading,100,100,100,100,100
Grades Category,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-
Sherry Li (李小蕾),Checked,Checked,100,70,80,Revision Required,Revision Required,Submitted,85,Revision Required,100,Unsubmitted,7,100,Revision Required,100,16,Revision Required,100,Submitted,Submitted,Revision Required,18,Submitted,Checked,Revision Required,A*,A*,B,Submitted
Jax Gao (高易),Checked,Checked,100,70,56,67,100,100,89,Revision Required,100,90,14,87,Revision Required,Unsubmitted,Unsubmitted,Unsubmitted,Unsubmitted,Unsubmitted,Unsubmitted,Revision Required,15,Unsubmitted,Not Checked,B,Revision Required,A*,A*,Submitted
King Jin (金元泽),Checked,Checked,100,71,80,90,10,75,100,100,100,88,19,90,80,89,21,100,100,Submitted,Submitted,100,20,Unsubmitted,Checked,Revision Required,A*,A*,A*,Unsubmitted
Andrew Chen (陈省昕),Checked,Checked,100,90,70,85,Unsubmitted,100,89,Unsubmitted,100,Revision Required,17,Revision Required,Unsubmitted,Revision Required,19,Revision Required,100,Submitted,Submitted,Revision Required,Submitted Late,Unsubmitted,Not Checked,Unsubmitted,Unsubmitted,Unsubmitted,Unsubmitted,Unsubmitted
Dino Yang (杨远清),Checked,Checked,100,99,90,100,100,100,100,95,100,100,19,100,100,100,21,100,100,Submitted,Submitted,100,19,27,Checked,A,A*,A*,A*,Submitted
Jasper Liu (刘品醇),Checked,Not Checked,Unsubmitted,Unsubmitted,Unsubmitted,Unsubmitted,Unsubmitted,Unsubmitted,70,Unsubmitted,100,68,17,Unsubmitted,Revision Required,Revision Required,14,Revised,Revision Required,Submitted,Submitted,Revision Required,18,Submitted Late,Not Checked,A,A*,A*,B,Submitted
Tony Liu (刘昊森),Checked,Checked,100,100,95,100,100,100,89,100,100,75,22,100,100,100,17,100,100,Submitted,Submitted,100,20,12,Checked,B,Revision Required,A*,A,Submitted
Apollo Wang (王与珩),Not Checked,Checked,100,100,100,100,85,100,90,100,100,91,21,100,Unsubmitted,100,19,79,100,Submitted Late,Submitted Late,88,Submitted Late,35,Not Checked,B,A*,Unsubmitted,Unsubmitted,Unsubmitted
Nora Wang (王一雅),Checked,Checked,100,85,80,100,77,Submitted,100,Revision Required,100,99,11,Revision Required,Revision Required,Revision Required,21,Revised,93,Submitted,Submitted,88,Submitted Late,Submitted,Not Checked,Revision Required,A*,A*,A,Submitted
Oliver Liu (刘鹏淼),Checked,Checked,100,99,85,95,100,100,100,94,100,100,21,100,100,100,22,100,100,Submitted,Submitted,100,21,Submitted,Checked,A,A*,A*,B,Submitted`;

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readFile(file);
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      onFileSelect(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) return;
    onFileSelect(pastedText, 'pasted_classin_table.csv');
  };

  const loadSampleTable = () => {
    onFileSelect(SAMPLE_CLASSIN_STANDARD, 'classin_standard_sample.csv');
  };

  return (
    <div className="space-y-4">
      {/* Tab Switcher & Quick Demo */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'upload'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <DocumentArrowUpIcon className="h-4 w-4 inline mr-1" />
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'paste'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ClipboardDocumentIcon className="h-4 w-4 inline mr-1" />
            Paste CSV Table
          </button>
        </div>

        {/* Quick Demo Data Button */}
        <button
          type="button"
          onClick={loadSampleTable}
          className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-colors"
          title="Load standard ClassIn sample with Row 2 names, Row 3 start times, Row 5 marks, and skipped cols 2 & 3"
        >
          <SparklesIcon className="h-4 w-4 mr-1.5 text-emerald-600" />
          Load Standard ClassIn Sample Table
        </button>
      </div>

      {activeTab === 'upload' ? (
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200 cursor-pointer group ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
        >
          <input
            type="file"
            ref={inputRef}
            onChange={handleFileChange}
            accept=".csv,.txt"
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="p-3 bg-white rounded-full shadow-sm ring-1 ring-gray-200 group-hover:ring-indigo-200 transition-all">
              <DocumentArrowUpIcon className="h-7 w-7 text-indigo-600" />
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900">
                Click to upload or drag and drop ClassIn CSV
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Converts Row 2 to Assignment Name, Row 3 to Assignment Date, Row 5 to Total Marks, and ignores Columns 2 & 3.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Paste your ClassIn CSV table text here (Row 2 = Assignment Name, Row 3 = Start Time, Row 5 = Total Marks)..."
            rows={7}
            className="block w-full rounded-lg border border-gray-300 shadow-sm p-3 text-xs font-mono focus:border-indigo-500 focus:ring-indigo-500"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handlePasteSubmit}
              disabled={!pastedText.trim()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-xs font-semibold rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Parse and Process Pasted Table
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
