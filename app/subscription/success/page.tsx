"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function SubscriptionSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Refresh subscription status
    setTimeout(() => {
      window.location.reload();
    }, 3000);
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <CardTitle>Payment Successful!</CardTitle>
          <CardDescription>
            Thank you for subscribing to ContextSummarizer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-green-900">
              Your subscription is being activated...
            </p>
            <p className="text-xs text-green-700 mt-1">
              This may take a few moments
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <h3 className="font-semibold">What's Next?</h3>
            <ul className="space-y-1 text-muted-foreground">
              <li>✓ You'll get 10 file summaries per month</li>
              <li>✓ Access to all 8 summary styles</li>
              <li>✓ Multi-language support</li>
              <li>✓ Export to Markdown</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => router.push("/subscription")}
              className="flex-1"
            >
              View Subscription
            </Button>
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="flex-1"
            >
              Start Summarizing
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            If your subscription isn't activated within 5 minutes, please contact support
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
