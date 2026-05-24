import { Request, Response, NextFunction } from 'express';
import Case, { ICase } from '../models/Case';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import mongoose from 'mongoose';

const canModerateComments = (userType?: string) => ['admin', 'doctor', 'moderator'].includes(userType ?? '');
const canAddCaseFollowUp = (userType?: string) => ['admin', 'doctor', 'intern', 'hospital_staff'].includes(userType ?? '');

// Reply to a comment
export const replyToComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  const { caseId, commentId } = req.params;
  const { content } = req.body;

  if (!user) {
    throw new AppError('User not authenticated', 401);
  }
  if (!content || content.trim().length === 0) {
    throw new AppError('Reply content is required', 400);
  }

  const caseDoc = await Case.findById(caseId);
  if (!caseDoc) throw new AppError('Case not found', 404);

  const parentComment = caseDoc.comments.find((c: any) => c._id?.toString() === commentId);
  if (!parentComment) throw new AppError('Comment not found', 404);

  // Prevent duplicate replies
  if (caseDoc.comments.some((c: any) => c.author.toString() === user._id.toString() && c.content === content.trim() && c.replyTo?.toString() === (parentComment._id as any).toString())) {
    throw new AppError('Duplicate reply detected', 409);
  }

  // Create reply
  const reply = {
    author: user._id as any,
    content: content.trim(),
    likes: [],
    ratedBy: [],
    replies: [],
    replyTo: parentComment._id,
    createdAt: new Date(),
    updatedAt: new Date(),
    _id: new mongoose.Types.ObjectId()
  };

  caseDoc.comments.push(reply as any);
  parentComment.replies.push(reply._id as any);
  await caseDoc.save();

  // Send notification to comment author if not replying to own comment
  if (parentComment.author.toString() !== user._id.toString()) {
    const Notification = require('../models/Notification').default;
    await Notification.create({
      recipient: parentComment.author,
      message: `Someone replied to your comment: "${parentComment.content}"`,
      type: 'reply',
      link: `/cases/${caseId}`
    });
  }

  res.status(201).json({ success: true, message: 'Reply added successfully', data: { reply } });
});

// Like a comment
export const likeComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  const { caseId, commentId } = req.params;

  if (!user) {
    throw new AppError('User not authenticated', 401);
  }

  const caseDoc = await Case.findById(caseId);
  if (!caseDoc) throw new AppError('Case not found', 404);

  const comment = caseDoc.comments.find((c: any) => c._id?.toString() === commentId);
  if (!comment) throw new AppError('Comment not found', 404);

  // Toggle like
  const userIdObj = user._id;
  const likeIndex = comment.likes.findIndex((uid: any) => uid.toString() === userIdObj.toString());
  
  let liked = false;
  if (likeIndex > -1) {
    // Unlike
    comment.likes.splice(likeIndex, 1);
    liked = false;
  } else {
    // Like
    comment.likes.push(userIdObj as any);
    liked = true;
  }

  await caseDoc.save();
  res.json({ success: true, message: liked ? 'Comment liked' : 'Comment unliked', data: { likes: comment.likes.length, liked } });
});

// Rate a comment
export const rateComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  const { caseId, commentId } = req.params;
  const { rating } = req.body;

  if (!user) {
    throw new AppError('User not authenticated', 401);
  }
  if (!rating || rating < 1 || rating > 5) {
    throw new AppError('Rating must be between 1 and 5', 400);
  }

  const caseDoc = await Case.findById(caseId);
  if (!caseDoc) throw new AppError('Case not found', 404);

  const comment = caseDoc.comments.find((c: any) => c._id?.toString() === commentId);
  if (!comment) throw new AppError('Comment not found', 404);

  // Toggle rating
  const userIdObj = user._id;
  const rateIndex = comment.ratedBy.findIndex((uid: any) => uid.toString() === userIdObj.toString());
  
  let rated = false;
  if (rateIndex > -1) {
    // Unrate
    comment.ratedBy.splice(rateIndex, 1);
    // Recalculate average rating
    if (comment.ratedBy.length === 0) comment.rating = undefined;
    else comment.rating = Math.round((comment.rating ?? 0) * comment.ratedBy.length / (comment.ratedBy.length + 1));
    rated = false;
  } else {
    // Rate
    comment.ratedBy.push(userIdObj as any);
    if (!comment.rating) comment.rating = rating;
    else comment.rating = Math.round(((comment.rating * (comment.ratedBy.length - 1)) + rating) / comment.ratedBy.length);
    rated = true;
  }

  await caseDoc.save();
  res.json({ success: true, message: rated ? 'Comment rated' : 'Comment unrated', data: { rating: comment.rating, ratedBy: comment.ratedBy.length, rated } });
});

// Create a new case (Doctor only)
export const createCase = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user as { _id: string; userType: string; specialization?: string };

  if (!user) {
    throw new AppError('User not authenticated', 401);
  }

  if (user.userType !== 'doctor' && user.userType !== 'patient') {
    throw new AppError('Only doctors and patients can create cases', 403);
  }

  const {
    title,
    description,
    symptoms,
    patientInfo,
    diagnosis,
    treatment,
    images,
    tags,
    difficulty,
    specialization
  } = req.body;

  // Restrict patient case creation
  if (user.userType === 'patient') {
    // Patients can't set diagnosis, treatment, or difficulty
    // These will be limited or undefined
    const newCase = new Case({
      title,
      description,
      symptoms: symptoms || [],
      patientInfo: patientInfo || {},
      images: images || [],
      tags: tags || [],
      difficulty: 'beginner', // Default for patient cases
      specialization: 'General Medicine', // Default for patients
      doctor: user._id as any,
      isPatientCase: true
    });

    await newCase.save();
    await newCase.populate('doctor', 'firstName lastName');

    // Patients get fewer points for posting
    const pointsForCase = 5;
    await User.findByIdAndUpdate(
      user._id,
      { $inc: { points: pointsForCase } }
    );

    return res.status(201).json({
      success: true,
      message: 'Patient case created successfully',
      data: {
        case: newCase,
        pointsAwarded: pointsForCase
      }
    });
  }

  // Doctor case creation (full features)
  const newCase = new Case({
    title,
    description,
    symptoms: symptoms || [],
    patientInfo: patientInfo || {},
    diagnosis,
    treatment,
    images: images || [],
    tags: tags || [],
    difficulty,
    specialization: specialization || user.specialization,
    doctor: user._id as any,
    isPatientCase: false
  });

  await newCase.save();
  await newCase.populate('doctor', 'firstName lastName specialization');

  // Award points to doctor for posting case
  const pointsForCase = 10; // Base points for posting a case
  await User.findByIdAndUpdate(
    user._id,
    { $inc: { points: pointsForCase } }
  );

  await Case.findByIdAndUpdate(
    newCase._id,
    { pointsAwarded: pointsForCase }
  );

  res.status(201).json({
    success: true,
    message: 'Case created successfully',
    data: {
      case: newCase,
      pointsAwarded: pointsForCase
    }
  });
});

// Get all cases with filters
export const getCases = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    specialization,
    difficulty,
    tags,
    doctor,
    page = 1,
    limit = 10,
    search
  } = req.query;

  const filter: any = { isActive: true };

  if (specialization) {
    filter.specialization = { $regex: specialization, $options: 'i' };
  }

  if (difficulty) {
    filter.difficulty = difficulty;
  }

  if (tags) {
    const tagArray = Array.isArray(tags) ? tags : [tags];
    filter.tags = { $in: tagArray };
  }

  if (doctor) {
    filter.doctor = doctor;
  }

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search as string, 'i')] } }
    ];
  }

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const cases = await Case.find(filter)
    .populate('doctor', 'firstName lastName specialization')
    .populate('comments.author', 'firstName lastName userType')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Case.countDocuments(filter);

  res.json({
    success: true,
    data: {
      cases,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }
  });
});

// Get single case by ID
export const getCaseById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const caseData = await Case.findById(id)
    .populate('doctor', 'firstName lastName specialization')
    .populate('comments.author', 'firstName lastName userType')
    .populate('likes', 'firstName lastName');

  if (!caseData) {
    throw new AppError('Case not found', 404);
  }

  if (!caseData.isActive) {
    throw new AppError('Case is no longer available', 404);
  }

  res.json({
    success: true,
    data: {
      case: caseData
    }
  });
});

// Update case (Doctor who created it only)
export const updateCase = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  const { id } = req.params;

  if (!user) {
    throw new AppError('User not authenticated', 401);
  }

  const caseData = await Case.findById(id);

  if (!caseData) {
    throw new AppError('Case not found', 404);
  }

  if (caseData.doctor.toString() !== user._id?.toString()) {
    throw new AppError('You can only update your own cases', 403);
  }

  const updates = req.body;
  delete updates.doctor; // Prevent changing the doctor
  delete updates.comments; // Comments are handled separately
  delete updates.likes; // Likes are handled separately

  const updatedCase = await Case.findByIdAndUpdate(
    id,
    updates,
    { new: true, runValidators: true }
  ).populate('doctor', 'firstName lastName specialization');

  res.json({
    success: true,
    message: 'Case updated successfully',
    data: {
      case: updatedCase
    }
  });
});

// Delete case (Doctor who created it only)
export const deleteCase = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  const { id } = req.params;

  if (!user) {
    throw new AppError('User not authenticated', 401);
  }

  const caseData = await Case.findById(id);

  if (!caseData) {
    throw new AppError('Case not found', 404);
  }

  if (caseData.doctor.toString() !== user._id?.toString()) {
    throw new AppError('You can only delete your own cases', 403);
  }

  // Soft delete
  await Case.findByIdAndUpdate(id, { isActive: false });

  res.json({
    success: true,
    message: 'Case deleted successfully'
  });
});

// Add comment to case
export const addComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user as { _id: string | { toString(): string }; userType?: string };
  const { id } = req.params;
  const { content, replyTo } = req.body;

  if (!user) {
    throw new AppError('User not authenticated', 401);
  }
  if (!content || content.trim().length === 0) {
    throw new AppError('Comment content is required', 400);
  }
  const caseData = await Case.findById(id);
  if (!caseData) {
    throw new AppError('Case not found', 404);
  }
  if (!caseData.isActive) {
    throw new AppError('Case is no longer available', 404);
  }
  // Prevent duplicate comments by same user with same content
  if (caseData.comments.some((c: any) => c.author.toString() === user._id.toString() && c.content === content.trim())) {
    throw new AppError('Duplicate comment detected', 409);
  }
  const newComment: any = {
    author: user._id as any,
    content: content.trim(),
    likes: [],
    ratedBy: [],
    replies: [],
    replyTo: replyTo ? replyTo : undefined
  };
  caseData.comments.push(newComment);
  await caseData.save();
  await caseData.populate('comments.author', 'firstName lastName userType');
  const addedComment = caseData.comments[caseData.comments.length - 1];
  res.status(201).json({ success: true, message: 'Comment added successfully', data: { comment: addedComment } });
});

// Pin a comment (doctor only)
export const pinComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { caseId, commentId } = req.params;
  const user = req.user;
  if (!user) {
    throw new AppError('User not authenticated', 401);
  }
  const caseDoc = await Case.findById(caseId);
  if (!caseDoc) throw new AppError('Case not found', 404);
  const comment = caseDoc.comments.find((c: any) => c._id?.toString() === commentId);
  if (!comment) throw new AppError('Comment not found', 404);
  // Moderation roles can pin any comment; other permitted users can pin their own.
  if (canModerateComments(user.userType) || (comment.author?.toString() === user._id?.toString())) {
    comment.pinned = true;
    await caseDoc.save();
    return res.json({ success: true, comment });
  } else {
    throw new AppError('You can only pin your own comments.', 403);
  }
});

// Unpin a comment (doctor only)
export const unpinComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { caseId, commentId } = req.params;
  const user = req.user;
  if (!user || !canModerateComments(user.userType)) {
    throw new AppError('Only comment moderators can unpin comments', 403);
  }
  const caseDoc = await Case.findById(caseId);
  if (!caseDoc) throw new AppError('Case not found', 404);
  const comment = caseDoc.comments.find((c: any) => c._id?.toString() === commentId);
  if (!comment) throw new AppError('Comment not found', 404);
  comment.pinned = false;
  await caseDoc.save();
  res.json({ success: true, comment });
});

// Get all pinned comments for a case
export const getPinnedComments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { caseId } = req.params;
  const caseDoc = await Case.findById(caseId);
  if (!caseDoc) throw new AppError('Case not found', 404);
  const pinnedComments = caseDoc.comments.filter((c: any) => c.pinned);
  res.json({ success: true, pinnedComments });
});

// Toggle repost permission (case owner only)
export const toggleRepostPermission = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user;
  const caseDoc = await Case.findById(id);
  if (!caseDoc) throw new AppError('Case not found', 404);
  if (!user || (caseDoc.doctor.toString() !== (user._id as string).toString())) {
    throw new AppError('Not authorized', 403);
  }
  caseDoc.canRepost = !caseDoc.canRepost;
  await caseDoc.save();
  res.json({ success: true, canRepost: caseDoc.canRepost });
});

// Repost a case (if allowed)
export const repostCase = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user;
  const caseDoc = await Case.findById(id);
  if (!caseDoc || !caseDoc.canRepost) {
    throw new AppError('Repost not allowed', 403);
  }
  // Duplicate case logic
  const newCase = new Case({
    ...caseDoc.toObject(),
    _id: undefined,
    doctor: user?._id as any,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  await newCase.save();
  res.json({ success: true, case: newCase });
});

// Like/Unlike case
export const toggleLike = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  const { id } = req.params;

  if (!user) {
    throw new AppError('User not authenticated', 401);
  }

  const caseData = await Case.findById(id);

  if (!caseData) {
    throw new AppError('Case not found', 404);
  }

  if (!caseData.isActive) {
    throw new AppError('Case is no longer available', 404);
  }

  const userIdString = user._id?.toString();
  const likeIndex = caseData.likes.findIndex(like => like.toString() === userIdString);

  let isLiked = false;

  if (likeIndex > -1) {
    // Unlike
    caseData.likes.splice(likeIndex, 1);
    isLiked = false;
  } else {
    // Like
    caseData.likes.push(user._id as any);
    isLiked = true;
  }

  await caseData.save();

  res.json({
    success: true,
    message: isLiked ? 'Case liked successfully' : 'Case unliked successfully',
    data: {
      isLiked,
      totalLikes: caseData.likes.length
    }
  });
});

// Get cases by current doctor
export const getMyCases = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;

  if (!user) {
    throw new AppError('User not authenticated', 401);
  }

  if (user.userType !== 'doctor') {
    throw new AppError('Only doctors can view their cases', 403);
  }

  const { page = 1, limit = 10 } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const cases = await Case.find({ doctor: user._id as any, isActive: true })
    .populate('comments.author', 'firstName lastName userType')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Case.countDocuments({ doctor: user._id as any, isActive: true });

  res.json({
    success: true,
    data: {
      cases,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }
  });
});

// Add follow-up to case
export const addFollowUp = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { content, outcome, images } = req.body;
  const user = req.user!;

  const caseData = await Case.findById(id);
  if (!caseData) {
    throw new AppError('Case not found', 404);
  }

  // Original authors and roles with follow-up permission can add follow-ups.
  const userIdString = (user._id as any).toString();
  const canAddFollowUpAction = caseData.doctor.toString() === userIdString || canAddCaseFollowUp(user.userType);

  if (!canAddFollowUpAction) {
    throw new AppError('Only the case author or permitted care team members can add follow-ups', 403);
  }

  const followUp = {
    author: user._id as any,
    content,
    outcome,
    images: images || [],
    createdAt: new Date()
  };

  caseData.followUps.push(followUp);
  await caseData.save();

  await caseData.populate([
    { path: 'doctor', select: 'firstName lastName specialization' },
    { path: 'followUps.author', select: 'firstName lastName userType' }
  ]);

  res.json({
    success: true,
    message: 'Follow-up added successfully',
    data: { case: caseData }
  });
});

// Get case follow-ups
export const getCaseFollowUps = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const caseData = await Case.findById(id)
    .select('followUps')
    .populate('followUps.author', 'firstName lastName userType profilePicture');

  if (!caseData) {
    throw new AppError('Case not found', 404);
  }

  res.json({
    success: true,
    data: {
      followUps: caseData.followUps,
      total: caseData.followUps.length
    }
  });
});

// Generate AI case suggestions (placeholder for AI integration)
export const generateAISuggestions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const caseData = await Case.findById(id);
  if (!caseData) {
    throw new AppError('Case not found', 404);
  }

  // Simple similarity-based suggestion algorithm
  const similarCases = await Case.find({
    _id: { $ne: id },
    $or: [
      { specialization: caseData.specialization },
      { difficulty: caseData.difficulty },
      { tags: { $in: caseData.tags } }
    ],
    isActive: true
  })
    .select('title description specialization difficulty tags')
    .limit(5)
    .sort({ createdAt: -1 });

  // Update case with AI suggestions
  caseData.aiSuggestions = {
    suggestedCases: similarCases.map(c => c._id) as any,
    relevanceScore: 0.8, // Placeholder score
    lastUpdated: new Date()
  };

  await caseData.save();

  res.json({
    success: true,
    message: 'AI suggestions generated successfully',
    data: {
      suggestions: similarCases,
      relevanceScore: caseData.aiSuggestions?.relevanceScore || 0.8
    }
  });
});

// Get AI suggestions for case
export const getCaseAISuggestions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const caseData = await Case.findById(id)
    .populate('aiSuggestions.suggestedCases', 'title description specialization difficulty tags createdAt');

  if (!caseData) {
    throw new AppError('Case not found', 404);
  }

  res.json({
    success: true,
    data: {
      suggestions: caseData.aiSuggestions?.suggestedCases || [],
      relevanceScore: caseData.aiSuggestions?.relevanceScore || 0,
      lastUpdated: caseData.aiSuggestions?.lastUpdated
    }
  });
});
