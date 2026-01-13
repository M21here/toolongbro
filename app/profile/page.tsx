"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  User,
  FileText,
  Calendar,
  CreditCard,
  ArrowLeft,
  Clock,
  TrendingUp,
} from "lucide-react";

interface ProfileData {
  user: {
    id: string;
    email: string | null;
    walletAddress: string | null;
    createdAt: string;
  };
  subscription: {
    status: string;
    filesRemaining: number;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    createdAt: string;
  } | null;
  usage: {
    totalSummaries: number;
    filesThisMonth: number;
    filesRemaining: number;
  };
  recentSummaries: {
    id: string;
    fileName: string;
    style: string;
    language: string;
    wordCount: number;
    createdAt: string;
  }[];
}

export default function ProfilePage() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready && !authenticated) {
      login();
    }
  }, [ready, authenticated, login]);

  useEffect(() => {
    if (ready && authenticated && user) {
      fetchProfile();
    }
  }, [ready, authenticated, user]);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!ready || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDaysUntilRenewal = () => {
    if (!profile?.subscription?.currentPeriodEnd) return null;
    const end = new Date(profile.subscription.currentPeriodEnd);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysUntilRenewal = getDaysUntilRenewal();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="Too Long Bro Logo"
                  width={40}
                  height={40}
                />
                <h1 className="text-xl font-bold">Too Long Bro</h1>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" asChild>
                <Link href="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to App
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your account and view usage statistics
          </p>
        </div>

        <div className="grid gap-6">
          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">
                    {profile?.user.email || "Not set"}
                  </p>
                </div>
                {profile?.user.walletAddress && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Wallet Address
                    </p>
                    <p className="font-medium font-mono text-sm">
                      {profile.user.walletAddress.slice(0, 6)}...
                      {profile.user.walletAddress.slice(-4)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="font-medium">
                    {profile?.user.createdAt
                      ? formatDate(profile.user.createdAt)
                      : "N/A"}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <Button variant="outline" onClick={logout}>
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Subscription
                </CardTitle>
                {profile?.subscription?.status === "active" ? (
                  <Badge variant="default" className="bg-green-500">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary">No Subscription</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {profile?.subscription?.status === "active" ? (
                <div className="space-y-6">
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4 text-center">
                      <FileText className="w-6 h-6 mx-auto mb-2 text-primary" />
                      <p className="text-3xl font-bold text-primary">
                        {profile.subscription.filesRemaining}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Files Remaining
                      </p>
                    </div>
                    <div className="border rounded-lg p-4 text-center">
                      <Calendar className="w-6 h-6 mx-auto mb-2 text-primary" />
                      <p className="text-lg font-semibold">
                        {formatDate(profile.subscription.currentPeriodEnd)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Next Payment
                      </p>
                    </div>
                    <div className="border rounded-lg p-4 text-center">
                      <Clock className="w-6 h-6 mx-auto mb-2 text-primary" />
                      <p className="text-3xl font-bold">
                        {daysUntilRenewal !== null ? daysUntilRenewal : "N/A"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Days Until Renewal
                      </p>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Plan Details</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• $0.99/month</li>
                      <li>• 10 document summaries per month</li>
                      <li>• All 8 summary styles included</li>
                      <li>• Multi-language support</li>
                    </ul>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" asChild>
                      <Link href="/subscription">Manage Subscription</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">
                    You don't have an active subscription. Subscribe to start
                    summarizing documents.
                  </p>
                  <Button asChild>
                    <Link href="/subscription">Subscribe Now - $0.99/mo</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Usage Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Usage Statistics
              </CardTitle>
              <CardDescription>Your document summarization history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                <div className="border rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold">
                    {profile?.usage.totalSummaries || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total Summaries
                  </p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold">
                    {profile?.usage.filesThisMonth || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Files This Month
                  </p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold">
                    {profile?.usage.filesRemaining || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Files Remaining
                  </p>
                </div>
              </div>

              {/* Recent Summaries */}
              {profile?.recentSummaries && profile.recentSummaries.length > 0 ? (
                <div>
                  <h4 className="font-semibold mb-3">Recent Summaries</h4>
                  <div className="border rounded-lg divide-y">
                    {profile.recentSummaries.map((summary) => (
                      <div
                        key={summary.id}
                        className="p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">
                              {summary.fileName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {summary.style} • {summary.language} •{" "}
                              {summary.wordCount.toLocaleString()} words
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(summary.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No summaries yet. Start by uploading a document!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-8">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          <p>
            Built by{" "}
            <a
              href="https://x.com/embrron"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              @Embrron
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
