// src/pages/lecturer/ManageAssessments.tsx
// ✅ COMPLETE FILE - Ready to use!

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Plus, Search, Edit, Trash2, Eye, FileText } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/animations";
import { apiClient } from "@/services/apiClient";
import { ApiError } from "@/lib/utils";

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

export default function ManageAssessments() {
  const { toast } = useToast();

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        setIsLoading(true);

        const data = await apiClient.get<Assessment[]>("/lecturer/assessments");

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

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this assessment?")) return;

    try {
      await apiClient.delete(`/lecturer/assessments/${id}`);

      setAssessments(assessments.filter((a) => a.id !== id));

      toast({
        title: "Success",
        description: "Assessment deleted successfully",
      });
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: "Error",
          description: "Failed to delete assessment",
          variant: "destructive",
        });
      }
    }
  };

  const filteredAssessments = assessments.filter(
    (assessment) =>
      assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assessment.subject.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isLoading) {
    return (
      <DashboardLayout role="lecturer">
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
    <DashboardLayout role="lecturer">
      <motion.div {...fadeInUp} className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Manage Assessments
            </h1>
            <p className="text-muted-foreground">
              Create and manage your assessments ({filteredAssessments.length}{" "}
              total)
            </p>
          </div>
          <Button asChild>
            <Link to="/lecturer/assessments/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Assessment
            </Link>
          </Button>
        </div>

        <Card className="p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assessments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {filteredAssessments.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">
              No assessments found
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery
                ? "Try adjusting your search query"
                : "Get started by creating your first assessment"}
            </p>
            <Button asChild>
              <Link to="/lecturer/assessments/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Assessment
              </Link>
            </Button>
          </Card>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {filteredAssessments.map((assessment, index) => (
              <motion.div key={assessment.id} variants={staggerItem}>
                <Card className="p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{assessment.subject}</Badge>
                        <Badge
                          variant={
                            assessment.is_active ? "success" : "secondary"
                          }
                        >
                          {assessment.is_active ? "Published" : "Draft"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {assessment.total_marks} marks
                        </span>
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">
                        {assessment.title}
                      </h3>
                      {assessment.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {assessment.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{assessment.duration_minutes} minutes</span>
                        <span>•</span>
                        <span className="capitalize">
                          {assessment.difficulty}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/lecturer/assessments/${assessment.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link
                          to={`/lecturer/assessments/${assessment.id}/edit`}
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(assessment.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
