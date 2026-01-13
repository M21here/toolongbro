"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { UploadForm } from "@/components/upload-form";
import { ResultsView } from "@/components/results-view";
import { ProcessingIndicator } from "@/components/processing-indicator";
import { processSummarization, exportToMarkdown } from "./actions";
import type { SummaryResult, SummaryOptions } from "@/lib/types";
import { LogIn, User, LogOut } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

type AppState =
  | { stage: "upload" }
  | { stage: "processing"; progress: number; message: string; currentStage: string }
  | { stage: "results"; result: SummaryResult; options: SummaryOptions }
  | { stage: "error"; error: string };

export default function Home() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [state, setState] = useState<AppState>({ stage: "upload" });

  const handleSubmit = async (file: File, options: SummaryOptions) => {
    setState({
      stage: "processing",
      progress: 0,
      message: "Starting...",
      currentStage: "init",
    });

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Simulate progress updates (in a real implementation, use WebSockets or polling)
      const progressSteps = [
        { progress: 10, message: "Parsing document...", stage: "outline" },
        { progress: 20, message: "Building structure...", stage: "chunking" },
        { progress: 30, message: "Generating summaries...", stage: "summarizing" },
        { progress: 70, message: "Merging sections...", stage: "merging" },
        { progress: 80, message: "Adding extras...", stage: "extras" },
        { progress: 90, message: "Finalizing...", stage: "finalizing" },
      ];

      let currentStep = 0;
      const progressInterval = setInterval(() => {
        if (currentStep < progressSteps.length) {
          const step = progressSteps[currentStep];
          setState({
            stage: "processing",
            progress: step.progress,
            message: step.message,
            currentStage: step.stage,
          });
          currentStep++;
        }
      }, 3000);

      const response = await processSummarization(formData, options);

      clearInterval(progressInterval);

      if (response.success) {
        setState({ stage: "results", result: response.result, options });
      } else {
        setState({ stage: "error", error: response.error });
      }
    } catch (error) {
      setState({
        stage: "error",
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    }
  };

  const handleExportMarkdown = async () => {
    if (state.stage !== "results") return;

    const markdown = await exportToMarkdown(state.result);
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${state.result.metadata.title || "summary"}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = async () => {
    if (state.stage !== "results") return;

    const markdown = await exportToMarkdown(state.result);
    await navigator.clipboard.writeText(markdown);
    alert("Copied to clipboard!");
  };

  const handleRegenerate = () => {
    setState({ stage: "upload" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Too Long Bro Logo" width={48} height={48} />
              <div>
                <h1 className="text-2xl font-bold">Too Long Bro</h1>
                <p className="text-sm text-muted-foreground">
                  Books are long. We're not
                </p>
              </div>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              {ready && authenticated && user && (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4" />
                    <span>{user.email?.address || user.wallet?.address?.slice(0, 6) + "..."}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={logout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => window.location.href = '/subscription'}
                  >
                    Subscription
                  </Button>
                </>
              )}
              {ready && !authenticated && (
                <Button onClick={login}>
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {state.stage === "upload" && (
          <>
            {ready && authenticated ? (
              <UploadForm onSubmit={handleSubmit} isProcessing={false} />
            ) : (
              <div className="max-w-2xl mx-auto text-center py-12">
                <div className="bg-card border rounded-lg p-8">
                  <Image src="/logo.png" alt="Too Long Bro Logo" width={80} height={80} className="mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Welcome to Too Long Bro</h2>
                  <p className="text-muted-foreground mb-6">
                    Please log in to start summarizing your documents with AI
                  </p>
                  <Button onClick={login} size="lg">
                    <LogIn className="w-4 h-4 mr-2" />
                    Login to Continue
                  </Button>
                  <p className="text-xs text-muted-foreground mt-4">
                    $0.99/month • 10 files per month • 8 summary styles
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {state.stage === "processing" && (
          <ProcessingIndicator
            progress={state.progress}
            message={state.message}
            stage={state.currentStage}
          />
        )}

        {state.stage === "results" && (
          <ResultsView
            result={state.result}
            onExportMarkdown={handleExportMarkdown}
            onCopyToClipboard={handleCopyToClipboard}
            onRegenerate={handleRegenerate}
          />
        )}

        {state.stage === "error" && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-300 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-2 text-red-800">Error</h2>
              <p className="text-red-700">{state.error}</p>
              <button
                onClick={() => setState({ stage: "upload" })}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-auto">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          <p>
            Read more, Spend Less • Supports PDF, DOCX, and TXT files up to 50MB
          </p>
          <p className="mt-1">
            Built by <a href="https://x.com/embrron" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@Embrron</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
