"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface SubscriptionData {
  status: string;
  filesRemaining: number;
  currentPeriodEnd: string;
}

export default function SubscriptionPage() {
  const { ready, authenticated, user, login } = usePrivy();
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentUrl, setPaymentUrl] = useState<string>("");

  useEffect(() => {
    if (ready && !authenticated) {
      login();
    }
  }, [ready, authenticated, login]);

  useEffect(() => {
    if (ready && authenticated && user) {
      fetchSubscription();
      generatePaymentUrl();
    }
  }, [ready, authenticated, user]);

  const fetchSubscription = async () => {
    try {
      const res = await fetch("/api/subscription");
      if (res.ok) {
        const data = await res.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const generatePaymentUrl = async () => {
    try {
      const res = await fetch("/api/payment-url");
      if (res.ok) {
        const data = await res.json();
        setPaymentUrl(data.url);
      }
    } catch (error) {
      console.error("Failed to generate payment URL:", error);
    }
  };

  if (!ready || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Subscription</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {subscription && subscription.status === "active" ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Active Subscription</CardTitle>
                <Badge variant="default">Active</Badge>
              </div>
              <CardDescription>
                You have an active monthly subscription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Files Remaining</p>
                  <p className="text-3xl font-bold">{subscription.filesRemaining}</p>
                  <p className="text-xs text-muted-foreground">out of 10 per month</p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Next Renewal</p>
                  <p className="text-lg font-semibold">
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Renews monthly at $0.99</p>
                </div>
              </div>

              <div className="pt-4">
                <h3 className="font-semibold mb-2">What's Included</h3>
                <ul className="space-y-2 text-sm">
                  <li>✓ 10 document summaries per month</li>
                  <li>✓ All summary styles (8 types)</li>
                  <li>✓ Multi-language support</li>
                  <li>✓ Export to Markdown</li>
                  <li>✓ Unlimited document size (up to 50MB)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Subscription</CardTitle>
                <CardDescription>
                  Get access to unlimited AI-powered document summarization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-6">
                  <div className="text-5xl font-bold">$0.99</div>
                  <div className="text-muted-foreground">per month</div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold">What's Included:</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>10 document summaries per month</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>8 different summary styles</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>English & Persian language support</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Export summaries to Markdown</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>PDF, DOCX, and TXT file support</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Documents up to 50MB and 500 pages</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4">
                  {paymentUrl ? (
                    <a
                      href={paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full"
                    >
                      <Button size="lg" className="w-full">
                        Subscribe with Crypto (CoinPayments)
                      </Button>
                    </a>
                  ) : (
                    <Button size="lg" className="w-full" disabled>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading Payment...
                    </Button>
                  )}
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Secure payment via CoinPayments • Accepts Bitcoin, Ethereum, and 100+ cryptocurrencies
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How it Works</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 text-sm">
                  <li>
                    <strong>1. Subscribe:</strong> Click the button above to pay $0.99 with cryptocurrency
                  </li>
                  <li>
                    <strong>2. Get Access:</strong> Once payment confirms, you'll get 10 file summaries
                  </li>
                  <li>
                    <strong>3. Use Service:</strong> Upload and summarize up to 10 documents per month
                  </li>
                  <li>
                    <strong>4. Auto-Renewal:</strong> Your subscription renews automatically each month
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
