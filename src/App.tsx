import { useState, useEffect, useRef, useMemo } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import './code.css';
import { Topic, TopicGroup, Subtopic, Question, TopicContext } from './topics.ts';
import { UserAnswer } from './questions/types';
import { checkAnswer } from './questions/registry';
import { TOPICS } from './all_topics.ts';
import QuestionScreen from './components/QuestionScreen.tsx';
import TopicCompletionScreen from './components/TopicCompletionScreen.tsx';
import LockedTopicScreen from './components/LockedTopicScreen.tsx';
import { getPythonLoadPromise } from './python.ts';
import ClassSelector from './components/ClassSelector.tsx';
import './App.css';
import LoginScreen from './components/LoginScreen';
import { authService } from './services/auth';
import type { User } from './services/auth';
import type { Class } from './services/classes';
import { classesService } from './services/classes';
import { responsesService } from './services/responses';
import { progressService } from './services/progress';
import InstructorDashboard from './pages/InstructorDashboard';
import StudentDashboard from './pages/StudentDashboard';
import { toggleTheme, getThemePreference } from './utils/theme';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlayCircle, faRightFromBracket, faTachographDigital } from '@fortawesome/free-solid-svg-icons';
import { classTopicSettingsService } from './services/classTopicSettings';
import { buildAvailabilityMap, filterTopicsByAvailability, isTopicEnabled, type TopicAvailabilityMap } from './utils/topicAvailability';
import {
  isUpcomingAssignmentDueSoon,
  resolveEffectiveAssignments,
  type EffectiveTopicAssignment,
} from './utils/topicAssignments';
import type { TopicProgress } from './services/progress';

export const SKIPPED = Symbol('(skipped)');

type AppScreen = 'welcome' | 'question' | 'locked-topic' | 'roster' | 'topics' | 'dashboard';
type DashboardTab = 'analytics' | 'roster' | 'topics';

const getScreenFromPath = (path: string): AppScreen | null => {
  if (
    path === '/dashboard' ||
    path === '/dashboard/analytics' ||
    path === '/dashboard/roster' ||
    path === '/dashboard/topics'
  ) {
    return 'dashboard';
  }
  return null;
};

const getDashboardTabFromPath = (path: string): DashboardTab => {
  if (path === '/dashboard/roster') return 'roster';
  if (path === '/dashboard/topics') return 'topics';
  return 'analytics';
};

const getAllTopics = (): Topic[] => {
  const topics: Topic[] = [];
  const collectTopics = (items: (Topic | TopicGroup)[]) => {
    for (const item of items) {
      if (item instanceof Topic) {
        topics.push(item);
      } else if (item instanceof TopicGroup) {
        collectTopics(item.topics);
      }
    }
  };
  collectTopics(TOPICS);
  return topics;
};


function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(() => {
    const user = authService.getCurrentUser();
    const isStudent = user?.role !== 'instructor';
    const routeScreen = getScreenFromPath(window.location.pathname);
    if (routeScreen) {
      return routeScreen === 'dashboard' && isStudent ? 'welcome' : routeScreen;
    }
    const saved = localStorage.getItem('currentScreen');
    const normalizedSaved = saved === 'students' ? 'roster' : saved;
    const restored = (normalizedSaved as AppScreen) ?? 'welcome';
    return restored === 'dashboard' && isStudent ? 'welcome' : restored;
  });
  const [instructorDashboardTab, setInstructorDashboardTab] = useState<DashboardTab>(() => getDashboardTabFromPath(window.location.pathname));
  useEffect(() => { localStorage.setItem('currentScreen', currentScreen); }, [currentScreen]);
  let [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  let [topicToSelectAfterLoading, setTopicToSelectAfterLoading] = useState<Topic | null>(null);
  const [mode, setMode] = useState<'learning' | 'quiz'>(() => {
    const saved = localStorage.getItem('mode');
    return saved ? saved as 'learning' | 'quiz' : 'learning';
  });
  useEffect(() => { localStorage.setItem('mode', mode); }, [mode]);
  let [currentTopic, setCurrentTopic] = useState<Topic | null>(null);
  const [allTopics] = useState<Topic[]>(getAllTopics());
  let [context, setContext] = useState<TopicContext | null>(null);
  const [currentSubtopic, setCurrentSubtopic] = useState<Subtopic | null>(null);
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(() => {
    let saved = localStorage.getItem('completedTopics');
    saved = saved?.replaceAll('_', '-') || null; // convert old format to new format
    return new Set<string>(saved ? JSON.parse(saved) : []);
  });
  const [undertakenTopics, setUndertakenTopics] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('undertakenTopics');
    return new Set<string>(saved ? JSON.parse(saved) : []);
  });
  const [currentUser, setCurrentUser] = useState<User | null>(() => authService.getCurrentUser());
  useEffect(() => {
    localStorage.setItem('completedTopics', JSON.stringify(Array.from(completedTopics)));
  }, [completedTopics]);
  useEffect(() => {
    localStorage.setItem('undertakenTopics', JSON.stringify(Array.from(undertakenTopics)));
  }, [undertakenTopics]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set<string>());
  const [questionList, setQuestionList] = useState<(Question | null)[]>([]);
  const [questionAnswers, setQuestionAnswers] = useState<(UserAnswer | typeof SKIPPED)[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const contentAreaRef = useRef<HTMLDivElement>(null);
  const selectTopicRef = useRef<(topic: Topic) => void>(() => {});
  const [theme, setThemeState] = useState<'light' | 'dark'>(getThemePreference());
  const isInstructor = currentUser?.role === 'instructor';
  const [instructorPractice, setInstructorPractice] = useState(false);
  const [topicAvailability, setTopicAvailability] = useState<TopicAvailabilityMap>(new Map());
  const [topicAssignments, setTopicAssignments] = useState<Map<string, EffectiveTopicAssignment>>(
    new Map(),
  );
  const [studentTopicProgress, setStudentTopicProgress] = useState<TopicProgress[]>([]);
  const canBypassAvailability = isInstructor && instructorPractice;
  const [studentClasses, setStudentClasses] = useState<Class[]>([]);
  const hasMountedRef = useRef(false);
  const [currentClass, setCurrentClass] = useState<Class | null>(() => {
    const saved = localStorage.getItem('currentClass');
    return saved ? JSON.parse(saved) as Class : null;
  });
  useEffect(() => {
    if (currentClass) {
      localStorage.setItem('currentClass', JSON.stringify(currentClass));
    } else {
      localStorage.removeItem('currentClass');
    }
  }, [currentClass]);

  // For students: detect which class(es) they belong to on login.
  useEffect(() => {
    if (!currentUser || isInstructor) return;
    classesService.getMyClasses().then(classes => {
      setStudentClasses(classes);
      if (classes.length === 1) {
        setCurrentClass(classes[0]);
      }
      // If multiple classes and no class selected yet, leave null — class picker will show.
    });
  }, [currentUser]);

  useEffect(() => {
    if (!currentClass || isInstructor) return;
    const match = studentClasses.find((cls) => cls.id === currentClass.id);
    if (match && match.section !== currentClass.section) {
      setCurrentClass(match);
    }
  }, [studentClasses, currentClass, isInstructor]);

  const clearUrlHash = () => {
    const { pathname, search } = window.location;
    window.history.replaceState(null, '', `${pathname}${search}`);
  };

  const syncPathForScreen = (screen: AppScreen, dashboardTab: DashboardTab, options?: { replace?: boolean }) => {
    const route = screen === 'dashboard'
      ? (dashboardTab === 'analytics' ? '/dashboard' : `/dashboard/${dashboardTab}`)
      : '/';
    const hash = screen === 'dashboard' ? '' : window.location.hash;
    const target = `${route}${hash}`;
    if (`${window.location.pathname}${window.location.hash}` === target) return;
    if (options?.replace) {
      window.history.replaceState(null, '', target);
      return;
    }
    window.history.pushState(null, '', target);
  };

  // Load Python interpreter
  useEffect(() => {
    getPythonLoadPromise()
      .then(() => {
        setIsLoading(false);
        isLoading = false; // since the selectTopic function uses isLoading, we need to update it here
        if (topicToSelectAfterLoading) {
          selectTopicRef.current(topicToSelectAfterLoading);
          setTopicToSelectAfterLoading(null);
        }
      })
      .catch((error) => { setLoadingError(error.message); });
  }, []);

  // Sync topic selection from URL hash (e.g. back/forward, shared links).
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (!hash) return;

      const topic = allTopics.find(t => t.id === hash);
      if (!topic) return;

      for (const item of TOPICS) {
        if (item instanceof TopicGroup && item.topics.includes(topic)) {
          setExpandedGroups(prev => new Set([...prev, item.id]));
          break;
        }
      }

      selectTopicRef.current(topic);
    };

    if (window.location.hash) {
      handleHashChange();
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [allTopics]);

  // Auto-expand the first incomplete group when there is no topic hash.
  useEffect(() => {
    if (window.location.hash) return;

    setExpandedGroups(prev => {
      if (prev.size > 0) return prev;
      for (const item of TOPICS) {
        if (item instanceof TopicGroup) {
          const firstIncomplete = item.getFirstIncompleteTopic(completedTopics);
          if (firstIncomplete) {
            return new Set([item.id]);
          }
        }
      }
      return prev;
    });
  }, [completedTopics]);

  // Syntax highlighting for shared code
  useEffect(() => { Prism.highlightAll(); }, [context]);
  useEffect(()=>{
    // Adjust token types for some keywords
    Prism.hooks.add('after-tokenize', function(env) {
      let sawFor = false;
      for (const token of env.tokens) {
        if (token.type === 'keyword') {
          if (['and', 'or', 'not', 'is', 'in'].includes(token.content)) {
            token.type = 'operator keyword';
          }
          if (token.content === 'print') { token.type = 'builtin'; }
          if (token.content === 'for') { sawFor = true; }
          if (token.content === 'in') {
            if (!sawFor) { token.type = 'operator keyword'; }
            sawFor = false;
          }
        }
      }
    });
    // Add new token types (at the end, but variable is last since it is catch-all)
    Prism.languages.python = Prism.languages.extend('python', {
      'variable': /\b[a-z_]\w*\b/g,
    });
    Prism.languages.python = Prism.languages.insertBefore('python', 'variable', {
      'constant': /\b[A-Z_][A-Z0-9_]*\b/g,
      'builtin': /\b(?:abs|aiter|all|anext|any|ascii|bin|breakpoint|callable|chr|classmethod|compile|delattr|dir|divmod|enumerate|eval|exec|filter|format|getattr|globals|hasattr|hash|help|hex|id|input|int|isinstance|issubclass|iter|len|locals|map|max|min|next|oct|open|ord|pow|print|property|repr|reversed|round|set|setattr|sorted|staticmethod|sum|super|tuple|type|vars|zip|__import__)\b/g,
      'type': /\b(?:int|float|bool|str|list|dict|tuple|set|range|frozenset|bytes|bytearray|memoryview|complex|type)\b/g,
    });
    Prism.languages.python = Prism.languages.insertBefore('python', 'punctuation', {
      'function-call': /\b[a-zA-Z_]\w*(?=\s*\()/g,
    });
  }, []);


  useEffect(() => {
    if (!currentUser || !currentClass) {
      setTopicAvailability(new Map());
      setTopicAssignments(new Map());
      return;
    }

    classTopicSettingsService
      .getSettings(currentClass.id)
      .then((settings) => {
        setTopicAvailability(buildAvailabilityMap(settings.global_settings));
        setTopicAssignments(
          resolveEffectiveAssignments(settings, currentClass.section),
        );
      })
      .catch(() => {
        setTopicAvailability(new Map());
        setTopicAssignments(new Map());
      });
  }, [currentUser, currentClass]);

  // Instructors default to the dashboard.
  useEffect(() => {
    if (isInstructor && currentScreen !== 'dashboard') {
      setCurrentScreen('dashboard');
      setInstructorPractice(false);
      setInstructorDashboardTab('analytics');
      syncPathForScreen('dashboard', 'analytics', { replace: true });
    }
  }, [isInstructor]);

  // Student dashboard lives on the welcome screen (with the topic sidebar).
  useEffect(() => {
    if (!isInstructor && currentScreen === 'dashboard') {
      setCurrentScreen('welcome');
      setCurrentTopic(null);
      setCurrentSubtopic(null);
      clearUrlHash();
      syncPathForScreen('welcome', instructorDashboardTab, { replace: true });
    }
  }, [isInstructor, currentScreen]);

  // Prevent instructors from landing on student-only screens unless they enable practice mode.
  useEffect(() => {
    if (!isInstructor) return;

    const allowedScreens = instructorPractice
      ? new Set(['dashboard', 'welcome', 'question', 'locked-topic'])
      : new Set(['dashboard']);

    if (!allowedScreens.has(currentScreen)) {
      setCurrentScreen('dashboard');
      setInstructorDashboardTab('analytics');
      syncPathForScreen('dashboard', 'analytics', { replace: true });
      clearUrlHash();
    }
  }, [isInstructor, currentScreen, instructorPractice]);

  useEffect(() => {
    const handlePopState = () => {
      const routeScreen = getScreenFromPath(window.location.pathname);
      if (routeScreen) {
        if (routeScreen === 'dashboard' && !isInstructor) {
          setCurrentScreen('welcome');
          return;
        }
        setCurrentScreen(routeScreen);
        if (routeScreen === 'dashboard') {
          setInstructorDashboardTab(getDashboardTabFromPath(window.location.pathname));
        }
        return;
      }
      if (window.location.pathname === '/') {
        setCurrentScreen('welcome');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      syncPathForScreen(currentScreen, instructorDashboardTab, { replace: true });
      return;
    }
    syncPathForScreen(currentScreen, instructorDashboardTab);
  }, [currentScreen, instructorDashboardTab]);

  const resetState = () => {
    setCurrentScreen('welcome');
    setCurrentTopic(null);
    setCurrentSubtopic(null);
    setContext(null);
    setQuestionList([]);
    setQuestionAnswers([]);
    setCompletedTopics(new Set());
    setUndertakenTopics(new Set());
    setExpandedGroups(new Set());
    setMode('learning');
  };

  const handleLogout = async () => {
    await authService.logout();
    localStorage.removeItem('completedTopics');
    localStorage.removeItem('undertakenTopics');
    localStorage.removeItem('currentClass');
    localStorage.removeItem('currentScreen');
    resetState();
    setCurrentUser(null);
    setCurrentClass(null);
    setInstructorPractice(false);
  };

  // Hydrate server-side progress after login so completion follows users across browsers.
  useEffect(() => {
    if (!currentUser) return;

    (async () => {
      try {
        const [progress, responses] = await Promise.all([
          progressService.getUserProgress(currentUser.id, currentClass?.id ?? null),
          responsesService.getStudentResponses(currentUser.id, currentClass?.id ?? null),
        ]);

        const completedFromProgress = progress
          .filter(p => p.total_subtopics > 0 && p.subtopics_completed >= p.total_subtopics)
          .map(p => p.topic);

        const latestBySubtopic = new Map<string, typeof responses[number]>();
        responses.forEach((response) => {
          const key = `${response.topic}::${response.subtopic_type}`;
          const existing = latestBySubtopic.get(key);
          if (!existing || new Date(response.attempted_at) > new Date(existing.attempted_at)) {
            latestBySubtopic.set(key, response);
          }
        });

        // Restore subtopic-level completion based on the latest response per subtopic.
        const responsesBySubtopic = new Map<string, typeof responses>();
        responses.forEach((response) => {
          const key = `${response.topic}::${response.subtopic_type}`;
          const list = responsesBySubtopic.get(key) ?? [];
          list.push(response);
          responsesBySubtopic.set(key, list);
        });

        allTopics.forEach((topic) => {
          topic.subtopics.forEach((subtopic) => {
            const key = `${topic.id}::${subtopic.constructor.name}`;
            const response = latestBySubtopic.get(key);
            const history = responsesBySubtopic.get(key) ?? [];
            subtopic.failedAttempts = history.filter(r => !r.is_correct).length;
            if (response) {
              subtopic.completed = response.is_correct;
              subtopic.incorrectLastTime = !response.is_correct;
            } else {
              subtopic.completed = false;
              subtopic.incorrectLastTime = false;
            }
          });
        });

        const completedFromResponses = allTopics
          .filter(topic => topic.subtopics.every(subtopic => subtopic.completed))
          .map(topic => topic.id);

        const completed = [...completedFromProgress, ...completedFromResponses];
        if (completed.length) {
          setCompletedTopics(prev => new Set([...prev, ...completed]));
        }
        setStudentTopicProgress(progress);
      } catch (error) {
        console.error('Failed to load server progress:', error);
        setStudentTopicProgress([]);
      }
    })();
  }, [currentUser, currentClass, allTopics]);

  const studentProgressByTopic = useMemo(
    () => new Map(studentTopicProgress.map((row) => [row.topic, row])),
    [studentTopicProgress],
  );

  const isSidebarDueUrgent = (topicId: string): boolean => {
    if (isInstructor) return false;
    if (completedTopics.has(topicId)) return false;
    return isUpcomingAssignmentDueSoon(
      topicAssignments.get(topicId),
      studentProgressByTopic.get(topicId),
      4,
    );
  };

  const visibleTopics = useMemo(() => {
    if (canBypassAvailability || topicAvailability.size === 0) {
      return TOPICS;
    }
    return filterTopicsByAvailability(TOPICS, topicAvailability);
  }, [canBypassAvailability, topicAvailability]);

  if (!currentUser) {
    return <LoginScreen onLogin={(user) => setCurrentUser(user)} />;
  }

  function canAccessTopic(topic: Topic): boolean {
    if (isInstructor) return true;
    if (topic.isAccessible(completedTopics)) return true;
    if (completedTopics.has(topic.id)) return true;
    if (undertakenTopics.has(topic.id)) return true;
    return topic.numCompletedSubtopics > 0;
  }

  function navigateToTopic(topic: Topic, options?: { startQuestions?: boolean; forceAccess?: boolean }) {
    const startQuestions = options?.startQuestions ?? true;
    const forceAccess = options?.forceAccess ?? false;

    setCurrentTopic(topic);
    window.location.hash = topic.id;

    if (!canBypassAvailability && currentClass && !isTopicEnabled(topic.id, topicAvailability)) {
      return;
    }

    if (!forceAccess && !canAccessTopic(topic)) {
      setCurrentScreen('locked-topic');
      return;
    }

    setCurrentScreen('question');

    if (startQuestions) {
      currentTopic = topic;
      startTopic();
    }
  }

  function undertakeTopicAnyway(topic: Topic) {
    setUndertakenTopics(prev => new Set([...prev, topic.id]));
    if (currentTopic?.id === topic.id && currentScreen === 'question') {
      return;
    }
    navigateToTopic(topic, { forceAccess: true });
  }

  function selectTopic(topic: Topic) {
    if (isLoading) {
      setTopicToSelectAfterLoading(topic);
      topicToSelectAfterLoading = topic;
      navigateToTopic(topic, { startQuestions: false });
      return;
    }

    if (!canBypassAvailability && currentClass && !isTopicEnabled(topic.id, topicAvailability)) {
      return;
    }

    if (!canAccessTopic(topic)) {
      navigateToTopic(topic, { startQuestions: false });
      return;
    }

    if (currentTopic?.id === topic.id && currentScreen === 'question') {
      return;
    }

    navigateToTopic(topic);
  }

  selectTopicRef.current = selectTopic;

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const handleGroupClick = (group: TopicGroup) => {
    // Always just toggle expansion for groups
    toggleGroup(group.id);
  };

  function startTopic() {
    context = currentTopic?.generateContext() ?? new TopicContext();
    setContext(context);
    setQuestionList([]);
    setQuestionAnswers([]);
    addQuestion();
  }

  function addQuestion() {
    if (currentTopic) {
      const subtopic = currentTopic.getRandomSubtopic();
      setCurrentSubtopic(subtopic);
      if (subtopic === null) {
        // Topic is completed, show completion screen (indicated by a null question)
        // Only add completion screen if it doesn't already exist
        setQuestionList(prev => {
          const hasCompletionScreen = prev.some(q => q === null);
          return hasCompletionScreen ? prev : [...prev, null];
        });
      } else {
        // Topic is not completed, add a new question
        const nextQuestion = subtopic.generateQuestion(context ?? new TopicContext());
        setQuestionList(prev => [...prev, nextQuestion]);
        setQuestionStartTime(Date.now());
      }
      // Scroll to the new question after it's added
      setTimeout(() => {
        if (contentAreaRef.current) {
          contentAreaRef.current.scrollTo({
            top: contentAreaRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }

  const handleAnswerSelect = async (answer: UserAnswer | undefined, question: Question) => {
    if (answer === undefined && !completedTopics.has(currentTopic?.id || '')) { return; }

    const skipped = answer === undefined;
    const isCorrect = skipped || (await Promise.resolve(checkAnswer(question, answer)));

    // Update the answer state for this specific question
    setQuestionAnswers(prev => [...prev, skipped ? SKIPPED : answer]);

    if (currentTopic) {
      // Update subtopic progress
      if (currentSubtopic) {
        currentSubtopic.completed = currentSubtopic.incorrectLastTime ? false : isCorrect;
        currentSubtopic.incorrectLastTime = !isCorrect;
        if (!skipped) {
          if (!isCorrect) {
            currentSubtopic.failedAttempts += 1;
          } else {
            currentSubtopic.failedAttempts = 0;
          }
        }
      }

      // Check if all subtopics in the topic are completed
      if (isCorrect) {
        const allCompleted = currentTopic.subtopics.every(v => v.completed);
        if (allCompleted) {
          completedTopics.add(currentTopic.id);
          setCompletedTopics(new Set(completedTopics));
        }
      }
    }

    // Add a new question to the list after a short delay
    setTimeout(() => { addQuestion(); }, skipped ? 25 : 500);

    if (currentUser && currentTopic && currentSubtopic) {
      try {
        const responseData = responsesService.formatResponseData(
          currentUser.id,
          currentTopic.id,
          currentSubtopic.constructor.name,
          question,
          answer ?? null,
          isCorrect,
          Math.floor((Date.now() - questionStartTime) / 1000),
          currentClass?.id ?? null,
        );

        await responsesService.submitResponse(responseData);

        await progressService.updateProgress(currentUser.id, currentTopic.id, {
          subtopics_completed: currentTopic.numCompletedSubtopics,
          total_subtopics: currentTopic.subtopics.length,
          class_id: currentClass?.id ?? null,
        });
      } catch (error) {
        console.error('Failed to sync to backend:', error);
      }
    }
  };

  const handleRestartTopic = () => {
    if (currentTopic) {
      // Reset all subtopics in the current topic
      // But we don't want to remove it from the completed topics set which is overall progress
      currentTopic.reset();
      
      // Start fresh with the topic
      startTopic();
    }
  };

  const getNextTopic = (): Topic | null => {
    const isReleased = (topic: Topic) =>
      canBypassAvailability || !currentClass || isTopicEnabled(topic.id, topicAvailability);

    const curIdx = allTopics.findIndex(topic => topic.id === currentTopic?.id);
    const beforeCurrent = allTopics.filter((topic, i) => isReleased(topic) && topic.isAccessible(completedTopics) && !completedTopics.has(topic.id) && i < curIdx);
    const afterCurrent = allTopics.filter((topic, i) => isReleased(topic) && topic.isAccessible(completedTopics) && !completedTopics.has(topic.id) && i > curIdx);
    return afterCurrent[0] ?? beforeCurrent[0];
  };

  const handleNextTopic = () => {
    if (currentTopic) {
      const nextTopic = getNextTopic();
      if (nextTopic) {
        selectTopic(nextTopic);
      } else {
        setCurrentScreen('welcome');
        setCurrentTopic(null);
      }
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <table onClick={() => {
          if (isInstructor) {
            setCurrentScreen('dashboard');
          } else {
            setCurrentScreen('welcome');
            setCurrentTopic(null);
            setCurrentSubtopic(null);
          }
          clearUrlHash();
        }} style={{ cursor: 'pointer' }}><tbody>
          <tr>
            <td rowSpan={2}><img src="https://s3.dualstack.us-east-2.amazonaws.com/pythondotorg-assets/media/files/python-logo-only.svg" alt="Python Logo"/></td>
            <td><h1>Bytepath</h1></td>
          </tr>
          <tr><td className="subtitle">Learning with Small Python Snippets</td></tr>
        </tbody></table>
        <div className="header-actions">
          {(!isInstructor || (instructorPractice && currentScreen !== 'dashboard')) && (
            <div className="mode-toggle">
              <button 
                className={`toggle-button ${mode === 'learning' ? 'active' : ''}`}
                onClick={() => {
                  setMode('learning');
                  if (isInstructor && currentScreen === 'dashboard') setCurrentScreen('welcome');
                }}
              >📚<span className="dashboard-button-label"> Learning</span></button>
              <button 
                className={`toggle-button ${mode === 'quiz' ? 'active' : ''}`}
                onClick={() => {
                  setMode('quiz');
                  if (isInstructor && currentScreen === 'dashboard') setCurrentScreen('welcome');
                }}
              >✏️<span className="dashboard-button-label"> Quiz</span></button>
            </div>
          )}
          <div className="header-buttons">
            {isInstructor && (
              <button
                onClick={() => {
                  setInstructorPractice(true);
                  setCurrentScreen('welcome');
                }}
                className={`dashboard-button ${instructorPractice && currentScreen !== 'dashboard' ? 'active' : ''}`}
              >
                <FontAwesomeIcon icon={faPlayCircle} aria-hidden="true" />
                <span className="dashboard-button-label">Practice</span>
              </button>
            )}
            <button
              onClick={() => {
                if (isInstructor) {
                  setCurrentScreen('dashboard');
                  setInstructorPractice(false);
                  setInstructorDashboardTab('analytics');
                  clearUrlHash();
                } else {
                  setCurrentScreen('welcome');
                  setCurrentTopic(null);
                  setCurrentSubtopic(null);
                  clearUrlHash();
                }
              }}
              className={`dashboard-button ${
                (isInstructor ? currentScreen === 'dashboard' : currentScreen === 'welcome')
                  ? 'active'
                  : ''
              }`}
            >
              <FontAwesomeIcon icon={faTachographDigital} aria-hidden="true" />
              <span className="dashboard-button-label">Dashboard</span>
            </button>
            {!isInstructor && studentClasses.length > 1 && (
              <select
                value={currentClass?.id ?? ''}
                onChange={e => {
                  const cls = studentClasses.find(c => c.id === Number(e.target.value)) ?? null;
                  setCurrentClass(cls);
                  setCompletedTopics(new Set());
                }}
                className="dashboard-button"
              >
                <option value="" disabled>Select class</option>
                {studentClasses.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.class_name}</option>
                ))}
              </select>
            )}
            {!isInstructor && studentClasses.length === 1 && currentClass && (
              <div className="dashboard-button dashboard-button-label" style={{ cursor: 'default' }}>
                {currentClass.class_name}
              </div>
            )}
            {isInstructor && (
              <ClassSelector
                currentClassId={currentClass?.id ?? null}
                onClassChange={setCurrentClass}
              />
            )}
            <button
              onClick={() => {
                const newTheme = toggleTheme();
                setThemeState(newTheme);
              }}
              className="theme-toggle"
              aria-label="Toggle dark mode"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span className="icon-sun" style={{ display: theme === 'dark' ? 'none' : 'inline' }}>☀️</span>
              <span className="icon-moon" style={{ display: theme === 'dark' ? 'inline' : 'none' }}>🌙</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="logout-button"
              aria-label="Log out"
              title="Log out"
            >
              <FontAwesomeIcon icon={faRightFromBracket} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main className="App-main">
        {currentScreen === 'dashboard' && isInstructor ? (
          <InstructorDashboard
            classId={currentClass?.id ?? null}
            className={currentClass?.class_name ?? null}
            activeTab={instructorDashboardTab}
            onTabChange={setInstructorDashboardTab}
          />
        ) : isLoading ? (
          <div className="loading-screen">
            <div className="loading-content">
              {loadingError ? (
                <div className="loading-error"><p>{loadingError}</p></div>
              ) : (
                <>
                  <div className="loading-spinner"></div>
                  <h2>Loading Python Interpreter...</h2>
                  <p>Please wait while we initialize the Python environment.</p>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="sidebar">
          <div className="sidebar-content">
            {visibleTopics.map((item) => {
              if (item instanceof TopicGroup) {
                const isExpanded = expandedGroups.has(item.id);
                const groupStatus = item.isCompleted(completedTopics) ? 'completed' : 
                                    item.hasCompletedTopics(completedTopics) ? 'in-progress' : 'available';
                
                return (
                  <div key={item.id} className="sidebar-group">
                    <div 
                      className={`sidebar-group-header ${groupStatus}`}
                      onClick={() => handleGroupClick(item)}
                    >
                      <div className="sidebar-group-title">
                        <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▶</span>
                        <span>{item.name}</span>
                      </div>
                      <span className={`group-status-indicator ${groupStatus}`}>
                        {groupStatus === 'completed' ? '✓' : 
                          groupStatus === 'in-progress' ? '→' : '→'}
                      </span>
                    </div>
                    {isExpanded && (
                      <div className="sidebar-group-content">
                        {item.topics.map((subItem) => {
                          if (subItem instanceof Topic) {
                            const subtopics = subItem.subtopics;
                            const completedSubtopics = subtopics.filter(subtopic => subtopic.completed).length;
                            const percentage = Math.round((completedSubtopics / subtopics.length) * 100);
                            
                            const accessible = canAccessTopic(subItem);
                            const status = completedTopics.has(subItem.id) ? 'completed' : 
                                          completedSubtopics > 0 ? 'in-progress' : 
                                          accessible ? 'available' : 'locked';
                            
                            return (
                              <div 
                                key={subItem.id}
                                className={`sidebar-item ${status} ${currentTopic === subItem ? 'active' : ''} ${isSidebarDueUrgent(subItem.id) ? 'sidebar-item--due-urgent' : ''}`}
                                onClick={() => selectTopic(subItem)}
                              >
                                <div className="sidebar-item-header">
                                  <span className="sidebar-item-title">{subItem.name}</span>
                                  <span className={`status-indicator ${status}`}>
                                    {status === 'completed' ? '✓' : 
                                      status === 'in-progress' ? '→' : 
                                      status === 'available' ? '→' : '🔒'}
                                  </span>
                                </div>
                                {currentTopic === subItem && (
                                  <div className="sidebar-item-progress">
                                    <div className="progress-bar">
                                      <div className="progress-fill" style={{ width: `${percentage}%` }}></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          } else {
                            return null;
                          }
                        })}
                      </div>
                    )}
                  </div>
                );
              } else {
                // Handle individual topics (if any exist outside groups)
                const subtopics = item.subtopics;
                const completedSubtopics = subtopics.filter(subtopic => subtopic.completed).length;
                const percentage = Math.round((completedSubtopics / subtopics.length) * 100);
                
                const accessible = canAccessTopic(item);
                const status = completedTopics.has(item.id) ? 'completed' : 
                              completedSubtopics > 0 ? 'in-progress' : 
                              accessible ? 'available' : 'locked';
                
                return (
                  <div 
                    key={item.id}
                    className={`sidebar-item ${status} ${currentTopic === item ? 'active' : ''} ${isSidebarDueUrgent(item.id) ? 'sidebar-item--due-urgent' : ''}`}
                    onClick={() => selectTopic(item)}
                  >
                    <div className="sidebar-item-header">
                      <span className="sidebar-item-title">{item.name}</span>
                      <span className={`status-indicator ${status}`}>
                        {status === 'completed' ? '✓' : 
                          status === 'in-progress' ? '→' : 
                          status === 'available' ? '→' : '🔒'}
                      </span>
                    </div>
                    {currentTopic === item && (
                      <div className="sidebar-item-progress">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${percentage}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
            })}
          </div>
        </div>

        <div className="content-area" ref={contentAreaRef}>
          {currentScreen === 'welcome' && (
            !isInstructor && studentClasses.length > 1 && !currentClass ? (
              <div className="welcome-screen">
                <h2>Select your class to begin</h2>
                <div className="class-picker">
                  {studentClasses.map(cls => (
                    <button key={cls.id} className="class-picker-button" onClick={() => setCurrentClass(cls)}>
                      {cls.class_name}
                    </button>
                  ))}
                </div>
              </div>
            ) : !isInstructor ? (
              <StudentDashboard
                user={currentUser}
                currentClassId={currentClass?.id ?? null}
                currentClass={currentClass}
              />
            ) : (
              <div className="welcome-screen">
                <h2>Welcome to Bytepath</h2>
                {
                  completedTopics.size === allTopics.length ? (
                    <div>
                      <p>You have completed all topics for now! 🎉</p>
                      <p>You can restart any topic to review.</p>
                      <p>You may also want to try quiz-mode in the top-right corner.</p>
                    </div>
                  ) : (
                    <p>Select an available topic from on the side to start.</p>
                  )
                }
                <div className="stats-overview">
                  <div className="stat-item">
                    <span className="stat-number">{completedTopics.size}</span>
                    <span className="stat-label">Topics Completed</span>
                  </div>
                </div>
              </div>
            )
          )}

              {currentScreen === 'locked-topic' && currentTopic && !isInstructor && (
                <LockedTopicScreen
                  topic={currentTopic}
                  completedTopics={completedTopics}
                  onTopicSelect={selectTopic}
                  onUndertakeAnyway={() => undertakeTopicAnyway(currentTopic!)}
                />
              )}

              {currentScreen === 'question' && (
                <div className="topic-container">
                  {context?.sharedCode && questionList.length > 0 && questionList[0] !== null && (
                    <div className="shared-code">
                  <div className="shared-code-header">Code shared by all questions in this topic:</div>
                  <code className="language-python">
                    {context?.sharedCode}
                  </code>
                </div>
              )}
              <div className="questions-container">
                {questionList.map((question, index) => (
                  question === null ? 
                    <TopicCompletionScreen
                        key={index}
                        topic={currentTopic!}
                        onRestartTopic={handleRestartTopic}
                        onNextTopic={handleNextTopic}
                        nextTopic={getNextTopic()}
                      />
                      : 
                    <QuestionScreen
                      key={index}
                      question={question}
                      userAnswer={questionAnswers[index]}
                      onAnswerSelect={handleAnswerSelect}
                      isQuiz={mode === 'quiz' || (currentTopic?.forceQuiz ?? false) || (currentSubtopic?.forceQuiz ?? false)}
                      canSkip={completedTopics.has(currentTopic?.id || '')}
                      workspaceDefaultOpen={
                        (currentSubtopic?.showWorkspace ?? false) &&
                        questionAnswers[index] === undefined &&
                        index === questionList.length - 1
                      }
                      helpMessage={
                        questionAnswers[index] === undefined &&
                        index === questionList.length - 1 &&
                        currentSubtopic
                          ? currentSubtopic.getActiveHelpMessage()
                          : undefined
                      }
                    />
                  )
                )}
              </div>
            </div>
          )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
