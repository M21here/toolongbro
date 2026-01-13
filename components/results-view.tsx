"use client";

import { useState, useMemo } from "react";
import { Download, Copy, Search, ChevronRight, FileText } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import type { SummaryResult } from "@/lib/types";
import { formatFileSize, estimateReadingTime } from "@/lib/utils";

interface ResultsViewProps {
  result: SummaryResult;
  onExportMarkdown: () => void;
  onCopyToClipboard: () => void;
  onRegenerate: () => void;
}

export function ResultsView({
  result,
  onExportMarkdown,
  onCopyToClipboard,
  onRegenerate,
}: ResultsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(result.outline.map((n) => n.id))
  );

  const toggleSection = (id: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSections(newExpanded);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(`section-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const filteredSummary = useMemo(() => {
    if (!searchQuery.trim()) return result.summary;

    const query = searchQuery.toLowerCase();
    return result.summary.filter(
      (block) =>
        block.title.toLowerCase().includes(query) ||
        block.content.toLowerCase().includes(query) ||
        block.keyPoints?.some((p) => p.toLowerCase().includes(query))
    );
  }, [result.summary, searchQuery]);

  const readingTime = estimateReadingTime(result.metadata.wordCount);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-80 border-r bg-card overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg mb-2">Outline</h2>
          <p className="text-xs text-muted-foreground">
            {result.outline.length} sections
          </p>
        </div>
        <nav className="p-2">
          {result.outline.map((node) => (
            <button
              key={node.id}
              onClick={() => scrollToSection(node.id)}
              className="w-full text-left px-3 py-2 rounded hover:bg-accent text-sm transition-colors"
              style={{ paddingLeft: `${node.level * 12 + 12}px` }}
            >
              <div className="flex items-center gap-2">
                <ChevronRight className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{node.title}</span>
              </div>
              {node.startPage && (
                <span className="text-xs text-muted-foreground ml-5">
                  p. {node.startPage}
                  {node.endPage && node.endPage !== node.startPage
                    ? `-${node.endPage}`
                    : ""}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold">
                {result.metadata.title || "Summary"}
              </h1>
              {result.metadata.author && (
                <p className="text-sm text-muted-foreground">
                  by {result.metadata.author}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onCopyToClipboard}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onExportMarkdown}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={onRegenerate}>
                Regenerate
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="secondary">{result.metadata.style}</Badge>
            <Badge variant="secondary">{result.metadata.detailLevel}</Badge>
            <Badge variant="secondary">{result.metadata.language}</Badge>
            <Badge variant="outline">
              {result.metadata.wordCount.toLocaleString()} words
            </Badge>
            <Badge variant="outline">{readingTime} min read</Badge>
            <Badge variant="outline">
              {new Date(result.metadata.generatedAt).toLocaleDateString()}
            </Badge>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search in summary..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {filteredSummary.map((block) => (
              <section
                key={block.id}
                id={`section-${block.nodeId}`}
                className="scroll-mt-8"
              >
                <div
                  className={`mb-3 ${
                    block.level === 1
                      ? "text-2xl font-bold"
                      : block.level === 2
                      ? "text-xl font-semibold"
                      : "text-lg font-medium"
                  }`}
                >
                  {block.title}
                  {block.citations && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({block.citations.join(", ")})
                    </span>
                  )}
                </div>

                <div className="prose prose-sm max-w-none space-y-4">
                  <div className="text-foreground whitespace-pre-wrap">
                    {block.content}
                  </div>

                  {block.keyPoints && block.keyPoints.length > 0 && (
                    <div className="bg-accent/50 rounded-lg p-4 my-4">
                      <h4 className="font-semibold text-sm mb-2">Key Points</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {block.keyPoints.map((point, idx) => (
                          <li key={idx}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {block.importantDetails && block.importantDetails.length > 0 && (
                    <div className="border-l-4 border-primary pl-4 my-4">
                      <h4 className="font-semibold text-sm mb-2">
                        Important Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        {block.importantDetails.map((detail, idx) => (
                          <p key={idx}>{detail}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            ))}

            {/* Extras */}
            {result.extras && (
              <div className="space-y-6 mt-12 pt-8 border-t">
                {result.extras.glossary && result.extras.glossary.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">Glossary</h2>
                    <div className="grid gap-3">
                      {result.extras.glossary.map((item, idx) => (
                        <div key={idx} className="bg-accent/30 rounded p-3">
                          <dt className="font-semibold text-sm">{item.term}</dt>
                          <dd className="text-sm text-muted-foreground mt-1">
                            {item.definition}
                          </dd>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.extras.flashcards &&
                  result.extras.flashcards.length > 0 && (
                    <div>
                      <h2 className="text-xl font-bold mb-4">Flashcards</h2>
                      <div className="grid gap-3">
                        {result.extras.flashcards.map((card, idx) => (
                          <div key={idx} className="border rounded p-4">
                            <div className="font-semibold text-sm mb-2">
                              Q: {card.question}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              A: {card.answer}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {result.extras.takeaways &&
                  result.extras.takeaways.length > 0 && (
                    <div>
                      <h2 className="text-xl font-bold mb-4">
                        Actionable Takeaways
                      </h2>
                      <div className="space-y-4">
                        {result.extras.takeaways.map((takeaway, idx) => (
                          <div key={idx}>
                            <h3 className="font-semibold mb-2">
                              {takeaway.category}
                            </h3>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                              {takeaway.items.map((item, itemIdx) => (
                                <li key={itemIdx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
