import { db } from "./db";
import { eq, and, desc, asc, gte, lte, or, ilike } from "drizzle-orm";
import {
  users,
  projects,
  chatMessages,
  calendarEvents,
  courses,
  lessons,
  userProgress,
  securityChallenges,
  quizzes,
  quizAttempts,
  subscriptions,
  discussions,
  discussionReplies,
  portfolios,
  mentorships,
  contentAnalytics,
  aiConversations,
  notifications,
  userProfiles,
  privacySettings,
  notificationSettings,
  calendarIntegration,
  contacts,
  musicIntegration,
  playlists,
  entertainmentPreferences,
  type User,
  type InsertUser,
  type Project,
  type InsertProject,
  type ChatMessage,
  type InsertChatMessage,
  type CalendarEvent,
  type InsertCalendarEvent,
  type Course,
  type InsertCourse,
  type Lesson,
  type InsertLesson,
  type UserProgress,
  type InsertUserProgress,
  type SecurityChallenge,
  type InsertSecurityChallenge,
  type Quiz,
  type InsertQuiz,
  type QuizAttempt,
  type InsertQuizAttempt,
  type Subscription,
  type InsertSubscription,
  type Discussion,
  type InsertDiscussion,
  type DiscussionReply,
  type InsertDiscussionReply,
  type Portfolio,
  type InsertPortfolio,
  type Mentorship,
  type UserProfile,
  type InsertUserProfile,
  type PrivacySettings,
  type InsertPrivacySettings,
  type NotificationSettings,
  type InsertNotificationSettings,
  type CalendarIntegration,
  type InsertCalendarIntegration,
  type Contact,
  type InsertContact,
  type MusicIntegration,
  type InsertMusicIntegration,
  type Playlist,
  type InsertPlaylist,
  type EntertainmentPreferences,
  type InsertEntertainmentPreferences,
  type InsertMentorship,
  type ContentAnalytics,
  type InsertContentAnalytics,
  type AIConversation,
  type InsertAIConversation,
  type Notification,
  type InsertNotification,
} from "@shared/schema";

export class DatabaseStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(insertProject).returning();
    return project;
  }

  async getProjectsByUserId(userId: number): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt));
  }

  async getProjectById(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async updateProject(id: number, updates: Partial<InsertProject>): Promise<Project | undefined> {
    const [project] = await db.update(projects).set(updates).where(eq(projects.id, id)).returning();
    return project || undefined;
  }

  async deleteProject(id: number): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id));
    return result.rowCount > 0;
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values(insertMessage).returning();
    return message;
  }

  async getChatMessagesByUserId(userId: number): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages).where(eq(chatMessages.userId, userId)).orderBy(asc(chatMessages.createdAt));
  }

  async clearChatHistory(userId: number): Promise<boolean> {
    const result = await db.delete(chatMessages).where(eq(chatMessages.userId, userId));
    return result.rowCount > 0;
  }

  async createCalendarEvent(insertEvent: InsertCalendarEvent): Promise<CalendarEvent> {
    const [event] = await db.insert(calendarEvents).values(insertEvent).returning();
    return event;
  }

  async getCalendarEventsByUserId(userId: number): Promise<CalendarEvent[]> {
    return await db.select().from(calendarEvents).where(eq(calendarEvents.userId, userId)).orderBy(asc(calendarEvents.date));
  }

  async getUpcomingEvents(userId: number): Promise<CalendarEvent[]> {
    const today = new Date();
    return await db.select().from(calendarEvents)
      .where(and(
        eq(calendarEvents.userId, userId),
        gte(calendarEvents.date, today)
      ))
      .orderBy(asc(calendarEvents.date))
      .limit(5);
  }

  async updateCalendarEvent(id: number, updates: Partial<InsertCalendarEvent>): Promise<CalendarEvent | undefined> {
    const [event] = await db.update(calendarEvents).set(updates).where(eq(calendarEvents.id, id)).returning();
    return event || undefined;
  }

  async deleteCalendarEvent(id: number): Promise<boolean> {
    const result = await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
    return result.rowCount > 0;
  }

  async getStats(userId: number): Promise<{ videosCreated: number; savedIdeas: number; keywordsAnalyzed: number; timeSaved: number; }> {
    // Get real stats from database
    const projectCount = await db.select().from(projects).where(eq(projects.userId, userId));
    const analyticsCount = await db.select().from(contentAnalytics).where(eq(contentAnalytics.userId, userId));
    
    return {
      videosCreated: projectCount.length,
      savedIdeas: projectCount.filter(p => p.type === 'youtube').length,
      keywordsAnalyzed: analyticsCount.length,
      timeSaved: Math.floor(projectCount.length * 2.5) // Estimated time saved in hours
    };
  }

  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses).orderBy(courses.id);
  }

  async getCourseById(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course || undefined;
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const [course] = await db.insert(courses).values(insertCourse).returning();
    return course;
  }

  async getLessonsByCourseId(courseId: number): Promise<Lesson[]> {
    return await db.select().from(lessons).where(eq(lessons.courseId, courseId)).orderBy(asc(lessons.order));
  }

  async getLessonById(id: number): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    return lesson || undefined;
  }

  async createLesson(insertLesson: InsertLesson): Promise<Lesson> {
    const [lesson] = await db.insert(lessons).values(insertLesson).returning();
    return lesson;
  }

  async getUserProgress(userId: number, courseId?: number): Promise<UserProgress[]> {
    if (courseId) {
      return await db.select().from(userProgress)
        .where(and(
          eq(userProgress.userId, userId),
          eq(userProgress.courseId, courseId)
        ));
    }
    return await db.select().from(userProgress).where(eq(userProgress.userId, userId));
  }

  async updateUserProgress(insertProgress: InsertUserProgress): Promise<UserProgress> {
    // Try to update existing progress first
    const existing = await db.select().from(userProgress)
      .where(and(
        eq(userProgress.userId, insertProgress.userId),
        eq(userProgress.lessonId, insertProgress.lessonId)
      ));

    if (existing.length > 0) {
      const [updated] = await db.update(userProgress)
        .set(insertProgress)
        .where(eq(userProgress.id, existing[0].id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(userProgress).values(insertProgress).returning();
      return created;
    }
  }

  async getSecurityChallenges(): Promise<SecurityChallenge[]> {
    return await db.select().from(securityChallenges).orderBy(asc(securityChallenges.difficulty));
  }

  async getSecurityChallengeById(id: number): Promise<SecurityChallenge | undefined> {
    const [challenge] = await db.select().from(securityChallenges).where(eq(securityChallenges.id, id));
    return challenge || undefined;
  }

  async createSecurityChallenge(insertChallenge: InsertSecurityChallenge): Promise<SecurityChallenge> {
    const [challenge] = await db.insert(securityChallenges).values(insertChallenge).returning();
    return challenge;
  }

  async getQuizzesByCourseId(courseId: number): Promise<Quiz[]> {
    return await db.select().from(quizzes).where(eq(quizzes.courseId, courseId));
  }

  async getQuizById(id: number): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz || undefined;
  }

  async createQuiz(insertQuiz: InsertQuiz): Promise<Quiz> {
    const [quiz] = await db.insert(quizzes).values(insertQuiz).returning();
    return quiz;
  }

  async getQuizAttempts(userId: number, quizId?: number): Promise<QuizAttempt[]> {
    if (quizId) {
      return await db.select().from(quizAttempts)
        .where(and(
          eq(quizAttempts.userId, userId),
          eq(quizAttempts.quizId, quizId)
        ))
        .orderBy(desc(quizAttempts.createdAt));
    }
    return await db.select().from(quizAttempts)
      .where(eq(quizAttempts.userId, userId))
      .orderBy(desc(quizAttempts.createdAt));
  }

  async createQuizAttempt(insertAttempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const [attempt] = await db.insert(quizAttempts).values(insertAttempt).returning();
    return attempt;
  }

  async updateQuizAttempt(id: number, updates: Partial<InsertQuizAttempt>): Promise<QuizAttempt | undefined> {
    const [attempt] = await db.update(quizAttempts).set(updates).where(eq(quizAttempts.id, id)).returning();
    return attempt || undefined;
  }

  // Subscription management
  async getUserSubscription(userId: number): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt));
    return subscription || undefined;
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db.insert(subscriptions).values(insertSubscription).returning();
    return subscription;
  }

  async updateSubscription(id: number, updates: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const [subscription] = await db.update(subscriptions).set(updates).where(eq(subscriptions.id, id)).returning();
    return subscription || undefined;
  }

  async cancelSubscription(id: number): Promise<boolean> {
    const result = await db.update(subscriptions)
      .set({ status: 'cancelled', cancelAtPeriodEnd: true })
      .where(eq(subscriptions.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Community features
  async getDiscussions(courseId?: number, lessonId?: number): Promise<Discussion[]> {
    let query = db.select().from(discussions);
    
    if (courseId) {
      query = query.where(eq(discussions.courseId, courseId));
    }
    if (lessonId) {
      query = query.where(eq(discussions.lessonId, lessonId));
    }
    
    return await query.orderBy(desc(discussions.isPinned), desc(discussions.createdAt));
  }

  async getDiscussionById(id: number): Promise<Discussion | undefined> {
    const [discussion] = await db.select().from(discussions).where(eq(discussions.id, id));
    if (discussion) {
      // Increment view count
      await db.update(discussions).set({ views: (discussion.views || 0) + 1 }).where(eq(discussions.id, id));
    }
    return discussion || undefined;
  }

  async createDiscussion(insertDiscussion: InsertDiscussion): Promise<Discussion> {
    const [discussion] = await db.insert(discussions).values(insertDiscussion).returning();
    return discussion;
  }

  async updateDiscussion(id: number, updates: Partial<InsertDiscussion>): Promise<Discussion | undefined> {
    const [discussion] = await db.update(discussions).set(updates).where(eq(discussions.id, id)).returning();
    return discussion || undefined;
  }

  async deleteDiscussion(id: number): Promise<boolean> {
    const result = await db.delete(discussions).where(eq(discussions.id, id));
    return (result.rowCount || 0) > 0;
  }

  async upvoteDiscussion(discussionId: number, userId: number): Promise<boolean> {
    const [discussion] = await db.select().from(discussions).where(eq(discussions.id, discussionId));
    if (discussion) {
      await db.update(discussions)
        .set({ upvotes: (discussion.upvotes || 0) + 1 })
        .where(eq(discussions.id, discussionId));
      return true;
    }
    return false;
  }

  async getDiscussionReplies(discussionId: number): Promise<DiscussionReply[]> {
    return await db.select().from(discussionReplies)
      .where(eq(discussionReplies.discussionId, discussionId))
      .orderBy(desc(discussionReplies.isAccepted), asc(discussionReplies.createdAt));
  }

  async createDiscussionReply(insertReply: InsertDiscussionReply): Promise<DiscussionReply> {
    const [reply] = await db.insert(discussionReplies).values(insertReply).returning();
    return reply;
  }

  async updateDiscussionReply(id: number, updates: Partial<InsertDiscussionReply>): Promise<DiscussionReply | undefined> {
    const [reply] = await db.update(discussionReplies).set(updates).where(eq(discussionReplies.id, id)).returning();
    return reply || undefined;
  }

  async deleteDiscussionReply(id: number): Promise<boolean> {
    const result = await db.delete(discussionReplies).where(eq(discussionReplies.id, id));
    return result.rowCount > 0;
  }

  async upvoteReply(replyId: number, userId: number): Promise<boolean> {
    const [reply] = await db.select().from(discussionReplies).where(eq(discussionReplies.id, replyId));
    if (reply) {
      await db.update(discussionReplies)
        .set({ upvotes: reply.upvotes + 1 })
        .where(eq(discussionReplies.id, replyId));
      return true;
    }
    return false;
  }

  // Portfolio showcase
  async getPortfolios(userId?: number, featured?: boolean): Promise<Portfolio[]> {
    let query = db.select().from(portfolios).where(eq(portfolios.isPublic, true));
    
    if (userId) {
      query = query.where(eq(portfolios.userId, userId));
    }
    if (featured) {
      query = query.where(eq(portfolios.featured, true));
    }
    
    return await query.orderBy(desc(portfolios.featured), desc(portfolios.likes), desc(portfolios.createdAt));
  }

  async getPortfolioById(id: number): Promise<Portfolio | undefined> {
    const [portfolio] = await db.select().from(portfolios).where(eq(portfolios.id, id));
    if (portfolio) {
      // Increment view count
      await db.update(portfolios).set({ views: portfolio.views + 1 }).where(eq(portfolios.id, id));
    }
    return portfolio || undefined;
  }

  async createPortfolio(insertPortfolio: InsertPortfolio): Promise<Portfolio> {
    const [portfolio] = await db.insert(portfolios).values(insertPortfolio).returning();
    return portfolio;
  }

  async updatePortfolio(id: number, updates: Partial<InsertPortfolio>): Promise<Portfolio | undefined> {
    const [portfolio] = await db.update(portfolios).set(updates).where(eq(portfolios.id, id)).returning();
    return portfolio || undefined;
  }

  async deletePortfolio(id: number): Promise<boolean> {
    const result = await db.delete(portfolios).where(eq(portfolios.id, id));
    return result.rowCount > 0;
  }

  async likePortfolio(portfolioId: number, userId: number): Promise<boolean> {
    const [portfolio] = await db.select().from(portfolios).where(eq(portfolios.id, portfolioId));
    if (portfolio) {
      await db.update(portfolios)
        .set({ likes: portfolio.likes + 1 })
        .where(eq(portfolios.id, portfolioId));
      return true;
    }
    return false;
  }

  // Mentorship system
  async getMentorships(userId: number, role: 'mentor' | 'mentee'): Promise<Mentorship[]> {
    const condition = role === 'mentor' 
      ? eq(mentorships.mentorId, userId)
      : eq(mentorships.menteeId, userId);
    
    return await db.select().from(mentorships)
      .where(condition)
      .orderBy(desc(mentorships.createdAt));
  }

  async getMentorshipById(id: number): Promise<Mentorship | undefined> {
    const [mentorship] = await db.select().from(mentorships).where(eq(mentorships.id, id));
    return mentorship || undefined;
  }

  async createMentorship(insertMentorship: InsertMentorship): Promise<Mentorship> {
    const [mentorship] = await db.insert(mentorships).values(insertMentorship).returning();
    return mentorship;
  }

  async updateMentorship(id: number, updates: Partial<InsertMentorship>): Promise<Mentorship | undefined> {
    const [mentorship] = await db.update(mentorships).set(updates).where(eq(mentorships.id, id)).returning();
    return mentorship || undefined;
  }

  async getAvailableMentors(specialties?: string[]): Promise<User[]> {
    // This would require a more complex query joining with mentorship data
    // For now, return a simple user list
    return await db.select().from(users).limit(10);
  }

  // Content analytics
  async getContentAnalytics(userId: number): Promise<ContentAnalytics[]> {
    return await db.select().from(contentAnalytics)
      .where(eq(contentAnalytics.userId, userId))
      .orderBy(desc(contentAnalytics.createdAt));
  }

  async createContentAnalytics(insertAnalytics: InsertContentAnalytics): Promise<ContentAnalytics> {
    const [analytics] = await db.insert(contentAnalytics).values(insertAnalytics).returning();
    return analytics;
  }

  async updateContentAnalytics(id: number, updates: Partial<InsertContentAnalytics>): Promise<ContentAnalytics | undefined> {
    const [analytics] = await db.update(contentAnalytics).set(updates).where(eq(contentAnalytics.id, id)).returning();
    return analytics || undefined;
  }

  // AI conversations
  async getAIConversations(userId: number, sessionId?: string): Promise<AIConversation[]> {
    let query = db.select().from(aiConversations).where(eq(aiConversations.userId, userId));
    
    if (sessionId) {
      query = query.where(eq(aiConversations.sessionId, sessionId));
    }
    
    return await query.orderBy(asc(aiConversations.createdAt));
  }

  async createAIConversation(insertConversation: InsertAIConversation): Promise<AIConversation> {
    const [conversation] = await db.insert(aiConversations).values(insertConversation).returning();
    return conversation;
  }

  // Notifications
  async getNotifications(userId: number, unreadOnly?: boolean): Promise<Notification[]> {
    let query = db.select().from(notifications).where(eq(notifications.userId, userId));
    
    if (unreadOnly) {
      query = query.where(eq(notifications.isRead, false));
    }
    
    return await query.orderBy(desc(notifications.createdAt));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(insertNotification).returning();
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const result = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
    return result.rowCount > 0;
  }

  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    const result = await db.update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result.rowCount > 0;
  }

  // User Profile methods
  async getUserProfile(userId: number): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile || undefined;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [newProfile] = await db.insert(userProfiles).values(profile).returning();
    return newProfile;
  }

  async updateUserProfile(userId: number, updates: Partial<InsertUserProfile>): Promise<UserProfile | undefined> {
    const [updated] = await db.update(userProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return updated || undefined;
  }

  // Privacy Settings methods
  async getPrivacySettings(userId: number): Promise<PrivacySettings | undefined> {
    const [settings] = await db.select().from(privacySettings).where(eq(privacySettings.userId, userId));
    return settings || undefined;
  }

  async createPrivacySettings(settings: InsertPrivacySettings): Promise<PrivacySettings> {
    const [newSettings] = await db.insert(privacySettings).values(settings).returning();
    return newSettings;
  }

  async updatePrivacySettings(userId: number, updates: Partial<InsertPrivacySettings>): Promise<PrivacySettings | undefined> {
    const [updated] = await db.update(privacySettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(privacySettings.userId, userId))
      .returning();
    return updated || undefined;
  }

  // Notification Settings methods
  async getNotificationSettings(userId: number): Promise<NotificationSettings | undefined> {
    const [settings] = await db.select().from(notificationSettings).where(eq(notificationSettings.userId, userId));
    return settings || undefined;
  }

  async createNotificationSettings(settings: InsertNotificationSettings): Promise<NotificationSettings> {
    const [newSettings] = await db.insert(notificationSettings).values(settings).returning();
    return newSettings;
  }

  async updateNotificationSettings(userId: number, updates: Partial<InsertNotificationSettings>): Promise<NotificationSettings | undefined> {
    const [updated] = await db.update(notificationSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(notificationSettings.userId, userId))
      .returning();
    return updated || undefined;
  }

  // Calendar Integration methods
  async getCalendarEvents(userId: number, startDate?: Date, endDate?: Date): Promise<CalendarIntegration[]> {
    let query = db.select().from(calendarIntegration).where(eq(calendarIntegration.userId, userId));
    
    if (startDate && endDate) {
      query = query.where(
        and(
          eq(calendarIntegration.userId, userId),
          and(
            gte(calendarIntegration.startTime, startDate),
            lte(calendarIntegration.endTime, endDate)
          )
        )
      );
    }
    
    return await query.orderBy(asc(calendarIntegration.startTime));
  }

  async getCalendarEventById(id: number): Promise<CalendarIntegration | undefined> {
    const [event] = await db.select().from(calendarIntegration).where(eq(calendarIntegration.id, id));
    return event || undefined;
  }

  async createCalendarEvent(event: InsertCalendarIntegration): Promise<CalendarIntegration> {
    const [newEvent] = await db.insert(calendarIntegration).values(event).returning();
    return newEvent;
  }

  async updateCalendarEvent(id: number, updates: Partial<InsertCalendarIntegration>): Promise<CalendarIntegration | undefined> {
    const [updated] = await db.update(calendarIntegration)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(calendarIntegration.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteCalendarEvent(id: number): Promise<boolean> {
    const result = await db.delete(calendarIntegration).where(eq(calendarIntegration.id, id));
    return result.rowCount > 0;
  }

  // Contacts methods
  async getContacts(userId: number, searchTerm?: string): Promise<Contact[]> {
    let query = db.select().from(contacts).where(eq(contacts.userId, userId));
    
    if (searchTerm) {
      const searchPattern = `%${searchTerm}%`;
      query = query.where(
        and(
          eq(contacts.userId, userId),
          or(
            ilike(contacts.firstName, searchPattern),
            ilike(contacts.lastName, searchPattern),
            ilike(contacts.email, searchPattern),
            ilike(contacts.company, searchPattern)
          )
        )
      );
    }
    
    return await query.orderBy(asc(contacts.firstName));
  }

  async getContactById(id: number): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact || undefined;
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db.insert(contacts).values(contact).returning();
    return newContact;
  }

  async updateContact(id: number, updates: Partial<InsertContact>): Promise<Contact | undefined> {
    const [updated] = await db.update(contacts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contacts.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteContact(id: number): Promise<boolean> {
    const result = await db.delete(contacts).where(eq(contacts.id, id));
    return result.rowCount > 0;
  }

  async getFavoriteContacts(userId: number): Promise<Contact[]> {
    return await db.select().from(contacts)
      .where(and(eq(contacts.userId, userId), eq(contacts.isFavorite, true)))
      .orderBy(asc(contacts.firstName));
  }

  // Music Integration methods
  async getMusicIntegrations(userId: number): Promise<MusicIntegration[]> {
    return await db.select().from(musicIntegration)
      .where(eq(musicIntegration.userId, userId))
      .orderBy(asc(musicIntegration.platform));
  }

  async getMusicIntegrationByPlatform(userId: number, platform: string): Promise<MusicIntegration | undefined> {
    const [integration] = await db.select().from(musicIntegration)
      .where(and(eq(musicIntegration.userId, userId), eq(musicIntegration.platform, platform)));
    return integration || undefined;
  }

  async createMusicIntegration(integration: InsertMusicIntegration): Promise<MusicIntegration> {
    const [newIntegration] = await db.insert(musicIntegration).values(integration).returning();
    return newIntegration;
  }

  async updateMusicIntegration(id: number, updates: Partial<InsertMusicIntegration>): Promise<MusicIntegration | undefined> {
    const [updated] = await db.update(musicIntegration)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(musicIntegration.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteMusicIntegration(id: number): Promise<boolean> {
    const result = await db.delete(musicIntegration).where(eq(musicIntegration.id, id));
    return result.rowCount > 0;
  }

  // Playlists methods
  async getPlaylists(userId: number, platform?: string): Promise<Playlist[]> {
    let query = db.select().from(playlists).where(eq(playlists.userId, userId));
    
    if (platform) {
      query = query.where(and(eq(playlists.userId, userId), eq(playlists.platform, platform)));
    }
    
    return await query.orderBy(desc(playlists.updatedAt));
  }

  async getPlaylistById(id: number): Promise<Playlist | undefined> {
    const [playlist] = await db.select().from(playlists).where(eq(playlists.id, id));
    return playlist || undefined;
  }

  async createPlaylist(playlist: InsertPlaylist): Promise<Playlist> {
    const [newPlaylist] = await db.insert(playlists).values(playlist).returning();
    return newPlaylist;
  }

  async updatePlaylist(id: number, updates: Partial<InsertPlaylist>): Promise<Playlist | undefined> {
    const [updated] = await db.update(playlists)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(playlists.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePlaylist(id: number): Promise<boolean> {
    const result = await db.delete(playlists).where(eq(playlists.id, id));
    return result.rowCount > 0;
  }

  // Entertainment Preferences methods
  async getEntertainmentPreferences(userId: number): Promise<EntertainmentPreferences | undefined> {
    const [preferences] = await db.select().from(entertainmentPreferences)
      .where(eq(entertainmentPreferences.userId, userId));
    return preferences || undefined;
  }

  async createEntertainmentPreferences(preferences: InsertEntertainmentPreferences): Promise<EntertainmentPreferences> {
    const [newPreferences] = await db.insert(entertainmentPreferences).values(preferences).returning();
    return newPreferences;
  }

  async updateEntertainmentPreferences(userId: number, updates: Partial<InsertEntertainmentPreferences>): Promise<EntertainmentPreferences | undefined> {
    const [updated] = await db.update(entertainmentPreferences)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(entertainmentPreferences.userId, userId))
      .returning();
    return updated || undefined;
  }
}