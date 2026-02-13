// src/pages/student/AvailableAssessments.tsx
// ✅ UPDATED: Using fetch-based apiClient

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Search,
  Clock,
  FileText,
  Calendar,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Play,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useToast } from "@/hooks/use-toast";
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/animations";
import { apiClient } from "@/services/apiClient";
import { ApiError } from "@/lib/utils";

// Types
interface Assessment {
  id: number;
  title: string;
  description?: string;
  subject: string;
  total_marks: number;
  duration_minutes: number;
  difficulty: string;
  is_active: boolean;
  created_at?: string;
}

export default function AvailableAssessments() {
  const { toast } = useToast();

  // State
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch assessments
  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        setIsLoading(true);

        // ✅ No .data needed!
        const data = await apiClient.get<Assessment[]>("/student/assessments");

        console.log("✅ Assessments loaded:", data);
        setAssessments(data);
      } catch (error) {
        console.error("❌ Failed to fetch assessments:", error);

        if (error instanceof ApiError) {
          toast({
            title: "Error",
            description: error.data?.detail || "Failed to load assessments",
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssessments();
  }, [toast]);

  // Filter assessments
  const filteredAssessments = assessments.filter((assessment) => {
    const matchesSearch =
      assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assessment.subject.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "available" && assessment.is_active);

    return matchesSearch && matchesStatus;
  });

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout role="student">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading assessments...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student">
      <motion.div {...fadeInUp} className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Available Assessments
          </h1>
          <p className="text-muted-foreground">
            Browse and attempt your assigned assessments (
            {filteredAssessments.length} available)
          </p>
        </div>

        {/* Search & Filters */}
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assessments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </Card>

        {/* Assessments Grid */}
        {filteredAssessments.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">
              No assessments found
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search query"
                : "No assessments available at the moment"}
            </p>
          </Card>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid gap-6 md:grid-cols-2"
          >
            {filteredAssessments.map((assessment, index) => (
              <motion.div key={assessment.id} variants={staggerItem}>
                <Card className="p-6 hover:shadow-lg transition-shadow h-full flex flex-col">
                  {/* Header */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline">{assessment.subject}</Badge>
                      <Badge
                        variant={assessment.is_active ? "success" : "secondary"}
                      >
                        {assessment.is_active ? "Available" : "Closed"}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {assessment.title}
                    </h3>
                    {assessment.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {assessment.description}
                      </p>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-4 flex-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{assessment.duration_minutes} minutes</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>{assessment.total_marks} marks</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge
                        variant={
                          assessment.difficulty === "beginner"
                            ? "success"
                            : assessment.difficulty === "intermediate"
                              ? "accent"
                              : "warning"
                        }
                      >
                        {assessment.difficulty}
                      </Badge>
                    </div>
                  </div>

                  {/* Action */}
                  {assessment.is_active ? (
                    <Button asChild className="w-full">
                      <Link to={`/student/assessments/${assessment.id}/take`}>
                        <Play className="h-4 w-4 mr-2" />
                        Start Assessment
                      </Link>
                    </Button>
                  ) : (
                    <Button disabled className="w-full">
                      Not Available
                    </Button>
                  )}
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
