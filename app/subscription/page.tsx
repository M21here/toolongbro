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
const COINPAYMENTS_BUTTON_DATA = "HcbYZ3LKlb0xpORPk3fEcYzsnf/FlJqJ4zpQMIjv8u7tqm5q08/cpvt7VDIz/p5xPLXXw3dRU82X7xczXXVPkw15D3MiaEQIYSAysiZkdDQoghkLqt3pjnpv3cR4U3QKmWu8PK3CMrsTXPrNnS4YYvbWlb4PbDc3bTRtsGcXrnHkrF+VmZyDYWyKPxmvE9m5kTSnfoQoHwPFZDQmhADgfQ+mX01pgTE1apjLidmMLOjRg+VJE/V6G8xfETs3VcvN8iZhrQzmay4BAME0Rt9IIyRUCUQRNqepJN5OQQbYccO/zV2kfgT6H30TWGJedV0S1pGj8Xj0YGFE1BUILR2qnRjM6ZcOW8XYMbI7+liAClcMttwLXRZp1AojUVRK0M/ptlvpg0+qjtLDV+7/T5WLnNHusLD2pcSBSmVVML0KvnURtr/8T1NfrkyP6i+/fY7T2VyxqhMbv08SFIOXT9ObzuXWS/9irhKDki9oFmJhnsq4s0V6nrex2Ubv2tq6/7ugJd7oNnPsM8n3/66WRVlkQbf9oWV3vc+Xz22Gq6Kv43qcRJJ090sw8PEgsKsirvqdr6EW+pVWkhQxw9k//imF/2DdpsJSMHSF/JvsyHV7y5U5V3SdvRm/bDChUsqW8kpZGo6Z3Teii8irwGw+1hmlDJTsLLY4C/cXw8GDQtq1Antlt2xOpIdNJ35tYn6ra/mK2qnRUSm75pJK4O8/Yp9oI2kOYSgczJ/m2jAHPTBaJdxTfd8HM+UlPF8CswCrHaCW2LylYIggUrzqCbPpT8E923Z75jFdJyCNWtsBE5X+wH1CnXY4uZxEtK8FfTCzG5/+9AkmCqgZFg29TZxs7gBzO5RsUo+p9vptjSeRZndlLIcUeZSQZTx+/Ulk5rtAzFQbQmpBm2YTeqZLdfkXTx3hOhAu0MX+ABj8XpfrsrBJP88OyjzEFZZsmDBQDoPZUf3R8WZ4kLQtF9ZHr67Z4ja1rJwF5xhwAS5uYiGW2ZhExdUDfaaERG2D8UyeLe8ibp0WcGPB7Yn1NaIS/bMxkS2H7ONFzCNvHw5oFXlhrTcD57/yDBiTcwXGzy8fdbKTiVswxKIIDZ/rJC3QeSD22UgD2oFVNIEund6dwGtITLj8V+NUm/XUc02MBHXbCoNZ90Ndlo8bcTf/tWb69Y/k9HhR17EWRnfiD9dewJWut2dXQXNc4Ev9Ew60JnyV2VaJLjqShbrQ8ie20r41xhOeEJdz0yuDK89coe/SPXadvtIlM2u+vIiHCm/QsGjyKbo+I857PsDeuQxmb+E9gG3X4s8kCEvfo09ceMHqOFJSg338RQrobsVjm64cjZ+w6i3eBmcOgsi1F31uqkEy2B9Tjcq91mTe3PAKoQ1xQ+xxijbzAJELS5TXz1FLECdeqhESC9oDrmnI39BJRvJKd0ovNC49isQorSlatyBsSE1zk4iB5bqJ6FhCOUAvGkdCqPmCwGMj+WM5fdbomPYQkVILr0XLlDUsxKVRrbDB5HvGZ+I4G5nNJoVWabHXXOrmwJwSRpjYysqSU9ZaIWfVVAsBtSKKrFyQvIlu8wYDrpNCuro5MN0=";

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
                      src="https://a-api.coinpayments.net/checkout_buttons/pay_white_small.svg"
                      name="submit"
                      style={{ width: "210px", cursor: "pointer" }}
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
