"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface SubscriptionData {
  status: string;
  filesRemaining: number;
  currentPeriodEnd: string;
}

// CoinPayments button data - generated from their dashboard
const COINPAYMENTS_BUTTON_DATA = "HcbYZ3LKlb0xpORPk3fEcYzsnf/FlJqJ4zpQMIjv8u7tqm5q08/cpvt7VDIz/p5xPLXXw3dRU82X7xczXXVPkw15D3MiaEQIYSAysiZkdDQoghkLqt3pjnpv3cR4U3QKfRGWf5ULTnDMGScjSU+/LdN/AXNQwawO28WWF/M5QKNbXohu0JjvaRu/mqWSCMyYJhQM9fZL4wGmsncxluERC+WSK/dz0EnRFOaTnDLO/ih8oRIQ2QWbT/v3Zo1EpMxDUH3UmEbzt0+FRZexkJXZkTqseMj3j9VFo3lBVQpOpORYQ0yG/py+QX8efQz12WpqJ9Lrx9VUy4htDAdE++q7mb7IZdZAOeoiOVKaGhBDWZnMxWst9IoBMyVI1HKzmt1Jwza/HoTamykwFjnx4DdL2C9qxaEr8o1yi2MRlaie1Mf9r716bjX3fJaMByi6Emt2RxQq971lH1ue8zOosEIjXdX+psC3CtYNwgOr9hv8cbROEqMbYoBCIsUok0hSDcoPc1PUu/ZV32t4HaplxXY5qqW/1s7u937emzTYJYsERpzfAnJyi++m1EXt7i7EwRYT372tqSrSGHLDV/xBMr3o7eKpq8UMhSsh5WNP1lrnwbBb9qSHkcJOUzJZyfSxTtFoc2i5TMSHDCkgHZ9FQLwUfAD4FxlnV8FPnORJC+b6K1FzNqLMJ6tAbSoY5GNgMn26xT0XZ0HnNmEXtSmfquwt+nFonacTxX57WTa6obmsw0YC0cUUXAUofVryKJMDsPY562yBOUXDAFiUdIHgWeKuMCqCP6UBfAKete9guC5y4cIxvOF2yFgH02hJx7KeAfMHGnJ3AtMjao/GOfMBC+kbQVLODkwaNy12Sqb0F4kRTTJrv7LmrBaaZlcXUP1owyrUWnf5x3mE5vyHlRyeDX3ejFEE32uEe4GdsSQVWz1GAgAhWwjxrtK8sNi8DkErbueNq888Bi8G89oSsYYZg+VHpAIdvmsD55F6Fmn6JlbbGqHRFzTKEKPVTeXr/L7dlXG6kUfcZ1/bqT5rJeDoml2vPVOGonqh/bR+n06ApUuGG/GX+UlR0AJ3sXoBjvwUorL93ht+jm8SdjltlirOEM3LtFtI+wXTlQgmA3ol9nmAmnvmKLvSkIqO88NbV+KELbvbVMz07DKytrfL6zl1jiNUKcPklJuMUgrlco+O5AJHPO/8IJR3s6cfeXaMF0HLC4ngE8AAaPG3vTLWDamfEJxOh5R+jCjMMCPZFxEECkiYMB19CfxrRApomLShqVLCKHU42eCRSDL/wOM/8B2AJhnV0AJm75PH25YXuUkVwvLJ9W3LMTif7X+LCNKzoUjLqGTukc6cGkiZLURTQCBX6QT4idA8KrteJywnbEhkI0/WvRZy2TSMT6/nuJ7S4Du3dwqgpWHCmDzIOKEozHxzJn3b4Ut7pUmz49fXF0N7L5YrNs5ZCWRNyVPQ7vmu4tkc+/7x";

export default function SubscriptionPage() {
  const { ready, authenticated, user, login } = usePrivy();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready && !authenticated) {
      login();
    }
  }, [ready, authenticated, login]);

  useEffect(() => {
    if (ready && authenticated && user) {
      fetchSubscription();
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
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/logo.png" alt="Too Long Bro" width={40} height={40} />
              <h1 className="text-2xl font-bold">Subscription</h1>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {subscription && subscription.status === "active" ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Active Subscription</CardTitle>
                <Badge variant="default" className="bg-green-500">Active</Badge>
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
                  <p className="text-xs text-muted-foreground">Renews monthly at $2.99</p>
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
                  Get access to AI-powered document summarization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-6">
                  <div className="text-5xl font-bold">$2.99</div>
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

                <div className="pt-4 flex flex-col items-center">
                  {/* CoinPayments Button Form */}
                  <form
                    action="https://a-api.coinpayments.net/api/v1/invoices/button"
                    method="post"
                    className="w-full flex justify-center"
                  >
                    <input type="hidden" name="action" value="checkout" />
                    <input type="hidden" name="data" value={COINPAYMENTS_BUTTON_DATA} />
                    <input
                      type="image"
                      src="https://a-api.coinpayments.net/checkout_buttons/pay_black_small.svg"
                      name="submit"
                      style={{ width: "252px", cursor: "pointer" }}
                      alt="Pay with CoinPayments"
                    />
                  </form>
                  <p className="text-xs text-center text-muted-foreground mt-4">
                    Secure payment via CoinPayments • Accepts Bitcoin, Ethereum, USDT, and 100+ cryptocurrencies
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
                    <strong>1. Subscribe:</strong> Click the button above to pay $2.99 with cryptocurrency
                  </li>
                  <li>
                    <strong>2. Get Access:</strong> Once payment confirms, you'll get 10 file summaries
                  </li>
                  <li>
                    <strong>3. Use Service:</strong> Upload and summarize up to 10 documents per month
                  </li>
                  <li>
                    <strong>4. Renew:</strong> Come back to renew your subscription each month
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <footer className="border-t bg-card mt-8">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          <Link href="/" className="text-primary hover:underline">
            ← Back to Home
          </Link>
        </div>
      </footer>
    </div>
  );
}
