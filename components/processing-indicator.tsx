"use client";

import { Progress } from "./ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Loader2 } from "lucide-react";

interface ProcessingIndicatorProps {
  progress: number;
  message: string;
  stage: string;
}

export function ProcessingIndicator({
  progress,
  message,
  stage,
}: ProcessingIndicatorProps) {
  const stageLabels: Record<string, string> = {
    outline: "Building Outline",
    chunking: "Chunking Document",
    summarizing: "Generating Summary",
    merging: "Merging Sections",
    extras: "Generating Extras",
    finalizing: "Finalizing",
    complete: "Complete",
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Processing Document
        </CardTitle>
        <CardDescription>
          {stageLabels[stage] || "Processing"}: {message}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{Math.round(progress)}%</span>
          <span>Please wait, this may take several minutes...</span>
        </div>
      </CardContent>
    </Card>
  );
}
