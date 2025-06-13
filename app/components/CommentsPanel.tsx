"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  MapPin,
  Plus,
  Filter,
  Reply,
  MoreVertical,
} from "lucide-react";
import * as THREE from "three";

// Define the interfaces we need locally to avoid import issues
interface BIMModel {
  id: number;
  name: string;
  description?: string;
}

interface BIMElement {
  id: number;
  elementType?: string;
  elementName?: string;
}

interface ModelComment {
  id: number;
  modelId: number;
  elementId?: number;
  title?: string;
  content: string;
  commentType?: string;
  position?: { x: number; y: number; z: number };
  status: string;
  priority?: string;
  assignedTo?: number;
  reportedBy?: number;
  dueDate?: Date;
  resolvedAt?: Date;
  resolvedBy?: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface CommentsPanelProps {
  model: BIMModel;
  selectedElement?: BIMElement;
  selectedPosition?: THREE.Vector3;
  onCommentAdded?: (comment: ModelComment) => void;
  onCommentStatusChanged?: (commentId: number, status: string) => void;
}

interface NewComment {
  title: string;
  content: string;
  commentType: "general" | "issue" | "question" | "approval";
  priority: "low" | "medium" | "high" | "critical";
  assignedTo?: number;
  dueDate?: string;
  tags: string[];
}

const MOCK_USERS = [
  { id: 1, name: "John Smith", role: "Project Manager", initials: "JS" },
  { id: 2, name: "Sarah Johnson", role: "Architect", initials: "SJ" },
  { id: 3, name: "Mike Chen", role: "Engineer", initials: "MC" },
  { id: 4, name: "Lisa Davis", role: "Contractor", initials: "LD" },
];

export default function CommentsPanel({
  model,
  selectedElement,
  selectedPosition,
  onCommentAdded,
  onCommentStatusChanged,
}: CommentsPanelProps) {
  const [comments, setComments] = useState<ModelComment[]>([]);
  const [filteredComments, setFilteredComments] = useState<ModelComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewCommentDialog, setShowNewCommentDialog] = useState(false);
  const [filter, setFilter] = useState({
    status: "all",
    priority: "all",
    type: "all",
    assignee: "all",
  });

  const [newComment, setNewComment] = useState<NewComment>({
    title: "",
    content: "",
    commentType: "general",
    priority: "medium",
    tags: [],
  });

  // Load comments for the model
  useEffect(() => {
    loadComments();
  }, [model.id]);

  // Filter comments when filter changes
  useEffect(() => {
    applyFilters();
  }, [comments, filter]);

  // Auto-open dialog when position is selected
  useEffect(() => {
    if (selectedPosition) {
      setShowNewCommentDialog(true);
    }
  }, [selectedPosition]);

  const loadComments = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/bim/comments?modelId=${model.id}`);
      if (response.ok) {
        const result = await response.json();
        setComments(result.data || []);
      } else {
        // Mock data for development
        const mockComments = generateMockComments();
        setComments(mockComments);
      }
    } catch (error) {
      console.error("Error loading comments:", error);
      // Use mock data if API fails
      const mockComments = generateMockComments();
      setComments(mockComments);
    } finally {
      setLoading(false);
    }
  };

  const generateMockComments = (): ModelComment[] => {
    return [
      {
        id: 1,
        modelId: model.id,
        elementId: undefined,
        title: "Glazing specification review needed",
        content:
          "The low-E coating specifications need to be verified with the manufacturer. Current U-value may not meet energy code requirements.",
        commentType: "issue",
        position: { x: 2, y: 1.5, z: 0 },
        status: "open",
        priority: "high",
        assignedTo: 2,
        reportedBy: 1,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        tags: ["glazing", "energy-code", "specifications"],
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: 2,
        modelId: model.id,
        elementId: undefined,
        title: "Mullion thermal break confirmation",
        content:
          "Please confirm that all vertical mullions include thermal breaks as specified. This is critical for condensation control.",
        commentType: "question",
        position: { x: -2, y: 2, z: 0 },
        status: "resolved",
        priority: "medium",
        assignedTo: 3,
        reportedBy: 4,
        resolvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        resolvedBy: 3,
        tags: ["thermal-bridge", "mullions"],
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        id: 3,
        modelId: model.id,
        elementId: undefined,
        title: "Structural glazing seal inspection",
        content:
          "All structural glazing seals look good. Installation quality is excellent. Ready for weather testing.",
        commentType: "approval",
        position: { x: 0, y: 1, z: 0 },
        status: "closed",
        priority: "low",
        assignedTo: 1,
        reportedBy: 2,
        resolvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        resolvedBy: 1,
        tags: ["sealing", "quality-control", "approved"],
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    ];
  };

  const applyFilters = () => {
    let filtered = [...comments];

    if (filter.status !== "all") {
      filtered = filtered.filter((comment) => comment.status === filter.status);
    }

    if (filter.priority !== "all") {
      filtered = filtered.filter(
        (comment) => comment.priority === filter.priority
      );
    }

    if (filter.type !== "all") {
      filtered = filtered.filter(
        (comment) => comment.commentType === filter.type
      );
    }

    if (filter.assignee !== "all") {
      filtered = filtered.filter(
        (comment) => comment.assignedTo === parseInt(filter.assignee)
      );
    }

    setFilteredComments(filtered);
  };

  const createComment = async () => {
    if (!newComment.title.trim() || !newComment.content.trim()) return;

    const commentData = {
      modelId: model.id,
      elementId: selectedElement?.id,
      title: newComment.title,
      content: newComment.content,
      commentType: newComment.commentType,
      position: selectedPosition
        ? {
            x: selectedPosition.x,
            y: selectedPosition.y,
            z: selectedPosition.z,
          }
        : undefined,
      priority: newComment.priority,
      assignedTo: newComment.assignedTo,
      dueDate: newComment.dueDate ? new Date(newComment.dueDate) : undefined,
      tags: newComment.tags,
    };

    try {
      const response = await fetch("/api/bim/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(commentData),
      });

      if (response.ok) {
        const result = await response.json();
        const createdComment = result.data;
        setComments((prev) => [createdComment, ...prev]);
        onCommentAdded?.(createdComment);
      } else {
        // Mock for development
        const mockComment: ModelComment = {
          id: Date.now(),
          ...commentData,
          status: "open",
          reportedBy: 1, // Current user
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setComments((prev) => [mockComment, ...prev]);
        onCommentAdded?.(mockComment);
      }

      setShowNewCommentDialog(false);
      resetNewCommentForm();
    } catch (error) {
      console.error("Error creating comment:", error);
    }
  };

  const updateCommentStatus = async (commentId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/bim/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  status: newStatus,
                  resolvedAt: newStatus === "resolved" ? new Date() : undefined,
                  resolvedBy: newStatus === "resolved" ? 1 : undefined, // Current user
                }
              : comment
          )
        );
        onCommentStatusChanged?.(commentId, newStatus);
      }
    } catch (error) {
      console.error("Error updating comment status:", error);
    }
  };

  const resetNewCommentForm = () => {
    setNewComment({
      title: "",
      content: "",
      commentType: "general",
      priority: "medium",
      tags: [],
    });
  };

  const getUserById = (userId?: number) => {
    return MOCK_USERS.find((user) => user.id === userId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case "resolved":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "closed":
        return <CheckCircle2 className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const getTypeColor = (
    type?: string
  ): "default" | "destructive" | "outline" | "secondary" => {
    switch (type) {
      case "issue":
        return "destructive";
      case "question":
        return "secondary";
      case "approval":
        return "default";
      default:
        return "outline";
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "critical":
        return "text-red-600 bg-red-50 border-red-200";
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "medium":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "low":
        return "text-gray-600 bg-gray-50 border-gray-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diffTime = now.getTime() - dateObj.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return dateObj.toLocaleDateString();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-xl font-bold">Comments & Issues</h2>
          <p className="text-sm text-muted-foreground">{model.name}</p>
        </div>
        <Button onClick={() => setShowNewCommentDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Comment
        </Button>
      </div>

      {/* Filters */}
      <div className="p-4 border-b bg-muted/30">
        <div className="grid grid-cols-4 gap-3">
          <Select
            value={filter.status}
            onValueChange={(value) =>
              setFilter((prev) => ({ ...prev, status: value }))
            }
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filter.priority}
            onValueChange={(value) =>
              setFilter((prev) => ({ ...prev, priority: value }))
            }
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filter.type}
            onValueChange={(value) =>
              setFilter((prev) => ({ ...prev, type: value }))
            }
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="issue">Issues</SelectItem>
              <SelectItem value="question">Questions</SelectItem>
              <SelectItem value="approval">Approvals</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filter.assignee}
            onValueChange={(value) =>
              setFilter((prev) => ({ ...prev, assignee: value }))
            }
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              {MOCK_USERS.map((user) => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-4">
          {filteredComments.map((comment) => {
            const assignee = getUserById(comment.assignedTo);
            const reporter = getUserById(comment.reportedBy);

            return (
              <Card key={comment.id} className="transition-all hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(comment.status)}
                        <Badge variant={getTypeColor(comment.commentType)}>
                          {comment.commentType || "general"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={getPriorityColor(comment.priority)}
                        >
                          {comment.priority || "medium"}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-base">
                        {comment.title || "Untitled Comment"}
                      </h3>
                    </div>
                    <Button size="sm" variant="ghost">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm">{comment.content}</p>

                  {/* Comment metadata */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      {reporter && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>By {reporter.name}</span>
                        </div>
                      )}

                      {comment.position && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>3D Position</span>
                        </div>
                      )}

                      <span>{formatDate(comment.createdAt)}</span>
                    </div>

                    {comment.dueDate && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Due {formatDate(comment.dueDate)}</span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {comment.tags && comment.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {comment.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Assignee */}
                  {assignee && (
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                          {assignee.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{assignee.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {assignee.role}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    {comment.status === "open" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateCommentStatus(comment.id, "resolved")
                        }
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Resolve
                      </Button>
                    )}

                    {comment.status === "resolved" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateCommentStatus(comment.id, "closed")
                          }
                        >
                          Close
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateCommentStatus(comment.id, "open")
                          }
                        >
                          Reopen
                        </Button>
                      </>
                    )}

                    <Button size="sm" variant="ghost">
                      <Reply className="w-3 h-3 mr-1" />
                      Reply
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {filteredComments.length === 0 && !loading && (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg">No comments found</p>
              <p className="text-sm">
                {comments.length === 0
                  ? "Click elements in the 3D viewer to add comments"
                  : "Try adjusting your filters"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Comment Dialog */}
      <Dialog
        open={showNewCommentDialog}
        onOpenChange={setShowNewCommentDialog}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Comment</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Context info */}
            {(selectedElement || selectedPosition) && (
              <div className="bg-muted p-3 rounded-lg text-sm">
                {selectedElement && (
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">
                      {selectedElement.elementType}
                    </Badge>
                    <span>{selectedElement.elementName}</span>
                  </div>
                )}
                {selectedPosition && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span>
                      Position: ({selectedPosition.x.toFixed(1)},{" "}
                      {selectedPosition.y.toFixed(1)},{" "}
                      {selectedPosition.z.toFixed(1)})
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="commentType">Type</Label>
                <Select
                  value={newComment.commentType}
                  onValueChange={(value: any) =>
                    setNewComment((prev) => ({ ...prev, commentType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="issue">Issue</SelectItem>
                    <SelectItem value="question">Question</SelectItem>
                    <SelectItem value="approval">Approval</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newComment.priority}
                  onValueChange={(value: any) =>
                    setNewComment((prev) => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newComment.title}
                onChange={(e) =>
                  setNewComment((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Brief description of the comment"
              />
            </div>

            <div>
              <Label htmlFor="content">Description</Label>
              <Textarea
                id="content"
                value={newComment.content}
                onChange={(e) =>
                  setNewComment((prev) => ({
                    ...prev,
                    content: e.target.value,
                  }))
                }
                placeholder="Detailed description of the issue, question, or note..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assignedTo">Assign To</Label>
                <Select
                  value={newComment.assignedTo?.toString() || ""}
                  onValueChange={(value) =>
                    setNewComment((prev) => ({
                      ...prev,
                      assignedTo: value ? parseInt(value) : undefined,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_USERS.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} - {user.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dueDate">Due Date (Optional)</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newComment.dueDate || ""}
                  onChange={(e) =>
                    setNewComment((prev) => ({
                      ...prev,
                      dueDate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={createComment} className="flex-1">
                Add Comment
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewCommentDialog(false);
                  resetNewCommentForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
