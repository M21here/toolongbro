"use client";

import { useState, useCallback } from "react";
import { Upload, FileText } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Select } from "./ui/select";
import type { SummaryStyle, OutputLanguage, DetailLevel } from "@/lib/types";
import { formatFileSize } from "@/lib/utils";

interface UploadFormProps {
  onSubmit: (file: File, options: {
    style: SummaryStyle;
    language: OutputLanguage;
    detailLevel: DetailLevel;
    preserveStructure: boolean;
  }) => void;
  isProcessing: boolean;
}

const STYLE_OPTIONS: Array<{ value: SummaryStyle; label: string; description: string }> = [
  { value: "one-page", label: "One-Page Summary", description: "Concise overview (500-1000 words)" },
  { value: "full-context", label: "Full Context Summary", description: "High-fidelity, no information loss" },
  { value: "eli5", label: "Explain Like I'm 5", description: "Simplified with analogies" },
  { value: "study-notes", label: "Study Notes", description: "Bullet points + glossary" },
  { value: "actionable-takeaways", label: "Actionable Takeaways", description: "Decisions and frameworks" },
  { value: "flashcards", label: "Flashcards", description: "Q&A pairs for memorization" },
  { value: "executive-brief", label: "Executive Brief", description: "3-5 minute read for busy professionals" },
  { value: "lecture-mode", label: "Lecture Mode", description: "Step-by-step teaching" },
];

export function UploadForm({ onSubmit, isProcessing }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [style, setStyle] = useState<SummaryStyle>("full-context");
  const [language, setLanguage] = useState<OutputLanguage>("english");
  const [detailLevel, setDetailLevel] = useState<DetailLevel>("medium");
  const [preserveStructure, setPreserveStructure] = useState(true);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (isValidFile(file)) {
        setFile(file);
      } else {
        alert("Please upload a PDF, DOCX, or TXT file (max 50MB)");
      }
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (isValidFile(file)) {
        setFile(file);
      } else {
        alert("Please upload a PDF, DOCX, or TXT file (max 50MB)");
      }
    }
  };

  const isValidFile = (file: File): boolean => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    return file.size <= maxSize && validTypes.includes(file.type);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    onSubmit(file, {
      style,
      language,
      detailLevel,
      preserveStructure,
    });
  };

  const selectedStyleInfo = STYLE_OPTIONS.find((opt) => opt.value === style);

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Document</CardTitle>
          <CardDescription>
            Upload a PDF, DOCX, or TXT file to generate a summary
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileInput}
              className="hidden"
              disabled={isProcessing}
            />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-8 h-8 text-primary" />
                <div className="text-left">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drag and drop a file here, or click to select
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, DOCX, or TXT (max 50MB)
                </p>
              </div>
            )}
          </div>

          {/* Summary Style */}
          <div className="space-y-2">
            <label htmlFor="style" className="text-sm font-medium">
              Summary Style
            </label>
            <Select
              id="style"
              value={style}
              onChange={(e) => setStyle(e.target.value as SummaryStyle)}
              disabled={isProcessing}
            >
              {STYLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            {selectedStyleInfo && (
              <p className="text-xs text-muted-foreground">
                {selectedStyleInfo.description}
              </p>
            )}
          </div>

          {/* Output Language */}
          <div className="space-y-2">
            <label htmlFor="language" className="text-sm font-medium">
              Output Language
            </label>
            <Select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as OutputLanguage)}
              disabled={isProcessing}
            >
              <option value="english">English</option>
              <option value="persian">Persian (فارسی)</option>
            </Select>
          </div>

          {/* Detail Level */}
          <div className="space-y-2">
            <label htmlFor="detail" className="text-sm font-medium">
              Detail Level
            </label>
            <div className="flex gap-2">
              <input
                type="range"
                id="detail"
                min="0"
                max="2"
                step="1"
                value={detailLevel === "short" ? 0 : detailLevel === "medium" ? 1 : 2}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setDetailLevel(val === 0 ? "short" : val === 1 ? "medium" : "high");
                }}
                className="flex-1"
                disabled={isProcessing}
              />
              <span className="text-sm font-medium min-w-[60px]">
                {detailLevel === "short"
                  ? "Short"
                  : detailLevel === "medium"
                  ? "Medium"
                  : "High"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {detailLevel === "short" && "~30% of original length"}
              {detailLevel === "medium" && "~50% of original length"}
              {detailLevel === "high" && "~70% of original length"}
            </p>
          </div>

          {/* Preserve Structure */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="preserve"
              checked={preserveStructure}
              onChange={(e) => setPreserveStructure(e.target.checked)}
              className="w-4 h-4"
              disabled={isProcessing}
            />
            <label htmlFor="preserve" className="text-sm font-medium cursor-pointer">
              Preserve chapter structure
            </label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={!file || isProcessing}
          >
            {isProcessing ? "Processing..." : "Generate Summary"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
