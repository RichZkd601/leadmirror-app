import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FlipHorizontal2, Sparkles, Copy, Clock, TrendingUp, History, Crown, Lightbulb, Target } from "lucide-react";

interface Analysis {
  id: string;
  userId: string;
  inputText: string;
  interestLevel: "hot" | "warm" | "cold";
  interestJustification: string;
  objections: Array<{
    type: string;
    intensity: "high" | "medium" | "low";
    description: string;
  }>;
  strategicAdvice: string;
  followUpSubject: string;
  followUpMessage: string;
  createdAt: string;
}

export default function Dashboard() {
  const { user, isLoading: userLoading } = useAuth();
  const { toast } = useToast();
  const [conversationText, setConversationText] = useState("");
  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showPricing, setShowPricing] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, userLoading, toast]);

  // Analysis mutation
  const analyzeMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await apiRequest("POST", "/api/analyze", { conversationText: text });
      return await response.json();
    },
    onSuccess: (data) => {
      setCurrentAnalysis(data);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Analysis Complete",
        description: "Your conversation has been analyzed successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      const errorMessage = error.message;
      if (errorMessage.includes("limit reached")) {
        setShowPricing(true);
        toast({
          title: "Analysis Limit Reached",
          description: "Upgrade to premium for unlimited analyses.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Analysis Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
  });

  // Analyses history query
  const { data: analyses } = useQuery<Analysis[]>({
    queryKey: ["/api/analyses"],
    enabled: user?.isPremium === true,
  });

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversationText.trim()) {
      toast({
        title: "Missing Input",
        description: "Please enter a conversation to analyze.",
        variant: "destructive",
      });
      return;
    }
    analyzeMutation.mutate(conversationText.trim());
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Text copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy text to clipboard.",
        variant: "destructive",
      });
    }
  };

  const getInterestColor = (level: string) => {
    switch (level) {
      case "hot": return "hot";
      case "warm": return "warm";
      case "cold": return "cold";
      default: return "default";
    }
  };

  const getObjectionColor = (intensity: string) => {
    switch (intensity) {
      case "high": return "bg-red-500";
      case "medium": return "bg-orange-500";
      case "low": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const usagePercentage = user.isPremium ? 100 : ((user.monthlyAnalysesUsed || 0) / 3) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <FlipHorizontal2 className="w-4 h-4 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">LeadMirror</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  Analyses used: <span className="font-medium">{user.monthlyAnalysesUsed || 0}</span>
                  {!user.isPremium && "/3"}
                </span>
                {!user.isPremium && (
                  <Button 
                    size="sm" 
                    className="bg-accent hover:bg-accent/90"
                    onClick={() => setShowPricing(true)}
                  >
                    <Crown className="w-4 h-4 mr-1" />
                    Upgrade
                  </Button>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {(user.firstName?.[0] || user.email?.[0] || "U").toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium">
                  {user.firstName || user.email}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.location.href = "/api/logout"}
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Analyze Your Sales Conversations
          </h2>
          <p className="text-muted-foreground">
            Paste your email or call summary to get AI-powered insights and perfect follow-up messages.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Analysis Input */}
          <div className="lg:col-span-2">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5" />
                  <span>Conversation Analysis</span>
                </CardTitle>
                <CardDescription>
                  Paste your email thread, call notes, or conversation summary below
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAnalyze} className="space-y-4">
                  <Textarea
                    value={conversationText}
                    onChange={(e) => setConversationText(e.target.value)}
                    className="min-h-[192px] resize-none"
                    placeholder="Example:

Hi John,

Thanks for the call yesterday. I understand you're interested in our premium coaching program but mentioned you need to discuss with your business partner first. You also asked about the payment plan options.

Looking forward to hearing from you!

Best,
Sarah"
                  />
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">
                      {conversationText.length} characters
                    </div>
                    <Button 
                      type="submit" 
                      disabled={analyzeMutation.isPending || !conversationText.trim()}
                      className="px-6"
                    >
                      {analyzeMutation.isPending ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Analyze Message
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Loading State */}
            {analyzeMutation.isPending && (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-muted-foreground">Analyzing your conversation...</p>
                  <p className="text-sm text-muted-foreground mt-2">This usually takes 10-15 seconds</p>
                </CardContent>
              </Card>
            )}

            {/* Analysis Results */}
            {currentAnalysis && !analyzeMutation.isPending && (
              <div className="space-y-6">
                {/* Interest Level */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Interest Level</CardTitle>
                      <Badge variant={getInterestColor(currentAnalysis.interestLevel)}>
                        {currentAnalysis.interestLevel.charAt(0).toUpperCase() + currentAnalysis.interestLevel.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {currentAnalysis.interestJustification}
                    </p>
                  </CardContent>
                </Card>

                {/* Objections */}
                <Card>
                  <CardHeader>
                    <CardTitle>Probable Objections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {currentAnalysis.objections.map((objection, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${getObjectionColor(objection.intensity)}`} />
                          <div>
                            <p className="font-medium text-foreground">{objection.type}</p>
                            <p className="text-sm text-muted-foreground">{objection.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Strategic Advice */}
                <Card>
                  <CardHeader>
                    <CardTitle>Strategic Advice</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {currentAnalysis.strategicAdvice}
                    </p>
                  </CardContent>
                </Card>

                {/* Generated Follow-up */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Generated Follow-up</CardTitle>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyToClipboard(`Subject: ${currentAnalysis.followUpSubject}\n\n${currentAnalysis.followUpMessage}`)}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy Message
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted rounded-lg p-4">
                      <div className="mb-3">
                        <p className="text-sm font-medium text-foreground">Subject:</p>
                        <p className="text-sm text-muted-foreground">{currentAnalysis.followUpSubject}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground mb-2">Message:</p>
                        <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {currentAnalysis.followUpMessage}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Usage Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Your Usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Monthly Analyses</span>
                    <span className="font-medium">
                      {user.monthlyAnalysesUsed || 0}{!user.isPremium && "/3"}
                    </span>
                  </div>
                  {!user.isPremium && (
                    <Progress value={usagePercentage} className="h-2" />
                  )}
                </div>
                {!user.isPremium && (
                  <Button 
                    className="w-full bg-accent hover:bg-accent/90"
                    onClick={() => setShowPricing(true)}
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Premium
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">Include context about the prospect's business and pain points</p>
                </div>
                <div className="flex items-start space-x-2">
                  <Target className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">Copy entire email threads for better analysis</p>
                </div>
                <div className="flex items-start space-x-2">
                  <Clock className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">Best results with 100-500 word conversations</p>
                </div>
              </CardContent>
            </Card>

            {/* Recent Analyses */}
            {user.isPremium && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Recent Analyses</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowHistory(true)}
                    >
                      <History className="w-4 h-4 mr-1" />
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {analyses && analyses.length > 0 ? (
                    <div className="space-y-3">
                      {analyses.slice(0, 3).map((analysis: Analysis) => (
                        <div key={analysis.id} className="border border-border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs text-muted-foreground">
                              {new Date(analysis.createdAt).toLocaleDateString()}
                            </span>
                            <Badge variant={getInterestColor(analysis.interestLevel)} className="text-xs">
                              {analysis.interestLevel}
                            </Badge>
                          </div>
                          <p className="text-sm text-foreground font-medium truncate mb-1">
                            {analysis.followUpSubject}
                          </p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                            onClick={() => copyToClipboard(`Subject: ${analysis.followUpSubject}\n\n${analysis.followUpMessage}`)}
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy follow-up
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No analyses yet. Start by analyzing your first conversation!</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Pricing Modal */}
      <Dialog open={showPricing} onOpenChange={setShowPricing}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Choose Your Plan</DialogTitle>
            <DialogDescription>
              Upgrade to unlock unlimited analyses and advanced features
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            {/* Free Plan */}
            <Card>
              <CardHeader className="text-center">
                <CardTitle>Free</CardTitle>
                <div className="text-3xl font-bold">€0</div>
                <CardDescription>per month</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    </div>
                    <span>3 analyses per month</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    </div>
                    <span>Basic AI insights</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    </div>
                    <span>Follow-up generation</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full" disabled>
                  Current Plan
                </Button>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="border-primary">
              <CardHeader className="text-center">
                <Badge className="mb-2">Most Popular</Badge>
                <CardTitle>Premium</CardTitle>
                <div className="text-3xl font-bold text-primary">€12</div>
                <CardDescription>per month</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    </div>
                    <span>Unlimited analyses</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    </div>
                    <span>Advanced AI insights</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    </div>
                    <span>Full analysis history</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    </div>
                    <span>Performance tracking</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    </div>
                    <span>Priority support</span>
                  </li>
                </ul>
                <Button 
                  className="w-full"
                  onClick={() => window.location.href = "/subscribe"}
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Modal */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Analysis History</DialogTitle>
            <DialogDescription>
              Your recent conversation analyses
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-6">
            {analyses && analyses.length > 0 ? (
              analyses.map((analysis: Analysis) => (
                <Card key={analysis.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-sm text-muted-foreground">
                            {new Date(analysis.createdAt).toLocaleString()}
                          </span>
                          <Badge variant={getInterestColor(analysis.interestLevel)}>
                            {analysis.interestLevel}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{analysis.followUpSubject}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyToClipboard(`Subject: ${analysis.followUpSubject}\n\n${analysis.followUpMessage}`)}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground bg-muted rounded p-3">
                      {analysis.inputText.substring(0, 150)}...
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No analyses found.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
