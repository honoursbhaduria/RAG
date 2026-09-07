import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Loader from './Loader';
import {
  Plus,
  MessageSquare,
  Code2,
  FolderTree,
  FileText,
  Sliders,
  PanelLeftClose,
  PanelLeft,
  Trash2,
  Play,
  Copy,
  Check,
  Send,
  ChevronRight,
  ExternalLink,
  Terminal,
  ArrowDownToLine,
  Database,
  Cpu,
  Layers,
  CheckCircle2,
  ShieldCheck,
  Search,
  BookOpen,
  Bookmark,
  Folder,
  X
} from 'lucide-react';

export interface LearningEntry {
  id: string;
  title: string;
  language: string;
  conceptSummary: string;
  code: string;
  timestamp: number;
}

export interface CodingProject {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  learnings: LearningEntry[];
}

export const POPULAR_LANGUAGES = [
  'python',
  'javascript',
  'typescript',
  'go',
  'rust',
  'cpp',
  'java',
  'csharp',
  'sql',
  'bash',
  'ruby',
  'kotlin',
  'swift',
  'php'
];

export const LANGUAGE_TEMPLATES: Record<string, string> = {
  python: `# Python Sandbox (Powered by Pyodide WebAssembly)
def calculate_primes(limit):
    primes = []
    for num in range(2, limit + 1):
        if all(num % p != 0 for p in primes if p * p <= num):
            primes.append(num)
    return primes

result = calculate_primes(50)
print(f"Computed {len(result)} primes up to 50:")
print(result)
`,
  javascript: `// JavaScript Sandbox Runtime
function quickSort(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[arr.length - 1];
  const left = arr.filter((x, i) => x < pivot && i < arr.length - 1);
  const right = arr.filter((x, i) => x >= pivot && i < arr.length - 1);
  return [...quickSort(left), pivot, ...quickSort(right)];
}

const numbers = [64, 34, 25, 12, 22, 11, 90];
console.log("Original Array:", numbers);
console.log("Sorted Array:  ", quickSort(numbers));
`,
  typescript: `// TypeScript Core Types & Generics
interface ServiceResponse<T> {
  code: number;
  data: T;
  timestamp: number;
}

function createResponse<T>(data: T): ServiceResponse<T> {
  return {
    code: 200,
    data,
    timestamp: Date.now()
  };
}

const payload = createResponse({ service: "Enterprise RAG", status: "Healthy" });
console.log(payload);
`,
  go: `// Go Concurrency & Channel Worker Pool
package main

import (
	"fmt"
	"sync"
)

func worker(id int, jobs <-chan int, wg *sync.WaitGroup) {
	defer wg.Done()
	for j := range jobs {
		fmt.Printf("Worker %d executed job %d\\n", id, j)
	}
}

func main() {
	jobs := make(chan int, 10)
	var wg sync.WaitGroup

	for w := 1; w <= 3; w++ {
		wg.Add(1)
		go worker(w, jobs, &wg)
	}

	for j := 1; j <= 6; j++ {
		jobs <- j
	}
	close(jobs)
	wg.Wait()
}
`,
  rust: `// Rust Ownership & Pattern Matching
enum JobStatus {
    Queued(u32),
    Running(String),
    Completed,
}

fn inspect_job(status: JobStatus) {
    match status {
        JobStatus::Queued(id) => println!("Job {} queued in memory pool", id),
        JobStatus::Running(worker) => println!("Job executed by worker {}", worker),
        JobStatus::Completed => println!("Job successfully processed"),
    }
}

fn main() {
    inspect_job(JobStatus::Queued(42));
    inspect_job(JobStatus::Running(String::from("worker-01")));
}
`,
  cpp: `// Modern C++ Algorithms & Lambdas
#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> numbers = {42, 17, 89, 3, 26};
    std::sort(numbers.begin(), numbers.end(), [](int a, int b) {
        return a < b;
    });

    std::cout << "Sorted array: ";
    for (int n : numbers) std::cout << n << " ";
    std::cout << std::endl;
    return 0;
}
`,
  java: `// Java Streams & Lambdas
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class Main {
    public static void main(String[] args) {
        List<String> services = Arrays.asList("Kubernetes", "Qdrant", "FlashRank", "Groq");
        List<String> filtered = services.stream()
            .filter(s -> s.length() > 4)
            .map(String::toUpperCase)
            .collect(Collectors.toList());
        System.out.println("Filtered services: " + filtered);
    }
}
`,
  sql: `-- SQL Window Functions & Analytics
WITH RankedQueries AS (
    SELECT 
        user_id,
        query_text,
        execution_ms,
        DENSE_RANK() OVER (PARTITION BY user_id ORDER BY execution_ms ASC) as rank
    FROM query_logs
)
SELECT user_id, query_text, execution_ms
FROM RankedQueries
WHERE rank <= 3;
`,
  bash: `#!/usr/bin/env bash
set -euo pipefail

echo "Initializing health check..."
if curl -s http://localhost:8000/health | grep -q "healthy"; then
    echo "Backend service is operational."
fi
`
};

export const LANGUAGE_TOPICS: Record<string, string[]> = {
  python: ['AsyncIO Event Loop', 'Decorators & Closures', 'Dataclasses & Pydantic', 'Generator Pipelines', 'Type Hints & Mypy'],
  javascript: ['Event Loop & Microtasks', 'Async/Await & Promises', 'Closures & Scope', 'Prototypes & Classes', 'Proxy & Reflect'],
  typescript: ['Generics & Constraints', 'Discriminated Unions', 'Utility Types', 'Type Narrowing', 'Mapped Types'],
  go: ['Goroutines & Channels', 'Worker Pool Pattern', 'Interfaces & Structs', 'Context & Timeouts', 'Error Handling Idioms'],
  rust: ['Ownership & Borrowing', 'Traits & Generics', 'Pattern Matching & Enums', 'Lifetimes & References', 'Result & Option Handling'],
  cpp: ['Smart Pointers & RAII', 'Move Semantics & Rvalues', 'Templates & Metaprogramming', 'STL Algorithms & Lambdas', 'Concurrency & Threads'],
  java: ['Stream API & Lambdas', 'CompletableFuture & Async', 'Spring Dependency Injection', 'Generics & Wildcards', 'JVM Memory Model'],
  sql: ['Window Functions', 'Common Table Expressions (CTE)', 'Indexing & Explain Plans', 'ACID Transactions', 'Partitioning Strategies'],
  bash: ['Safe Scripting (set -euo)', 'Subshells & Redirections', 'Arrays & Parameter Expansion', 'Traps & Signal Handling', 'Process Substitution']
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
  thoughtProcess?: string[];
  sources?: string[];
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
}

export function App() {
  const [sessionId, setSessionId] = useState(() => {
    return localStorage.getItem('claude_rag_current_session') || Math.random().toString(36).substring(2, 10);
  });
  
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('claude_rag_sessions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<'chat' | 'projects' | 'artifacts' | 'code' | 'customize'>('chat');
  const [selectedArtifactIndex, setSelectedArtifactIndex] = useState(0);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const [copiedArtifact, setCopiedArtifact] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  // User Customization Settings
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('claude_rag_custom_settings');
      return saved ? JSON.parse(saved) : {
        persona: 'Enterprise Architect',
        temperature: 0.1,
        topK: 5,
        systemPrompt: 'You are an Enterprise AI Architect specializing in distributed systems, Kubernetes, and networking.'
      };
    } catch {
      return {
        persona: 'Enterprise Architect',
        temperature: 0.1,
        topK: 5,
        systemPrompt: 'You are an Enterprise AI Architect specializing in distributed systems, Kubernetes, and networking.'
      };
    }
  });

  // Interactive Code Studio State
  const [studioTab, setStudioTab] = useState<'studio' | 'api'>('studio');
  const [codeLanguage, setCodeLanguage] = useState<string>('python');
  const [codeContent, setCodeContent] = useState<string>(LANGUAGE_TEMPLATES.python);
  const [terminalOutput, setTerminalOutput] = useState<string>('Ready. Click Run Code to execute in your browser runtime.');
  const [terminalStatus, setTerminalStatus] = useState<string>('Ready');
  const [isExecuting, setIsExecuting] = useState(false);
  const [copilotEngine, setCopilotEngine] = useState<'groq' | 'gemini'>('groq');
  const [copilotPrompt, setCopilotPrompt] = useState('');
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState<Array<{ role: 'user' | 'assistant', text: string, code?: string }>>([
    {
      role: 'assistant',
      text: 'AI Coding Copilot initialized with Groq and Gemini engines. Select a project and language, choose a concept to learn, or ask custom questions. You can save your learning directly into the active project!'
    }
  ]);

  // User Coding Projects State
  const [projects, setProjects] = useState<CodingProject[]>(() => {
    try {
      const saved = localStorage.getItem('claude_rag_user_projects');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load user projects', e);
    }
    return [
      {
        id: 'proj_algo',
        name: 'Algorithms & Concurrency',
        description: 'Core computer science algorithms, async patterns, and runtime complexity analysis.',
        createdAt: Date.now() - 86400000 * 2,
        learnings: [
          {
            id: 'learn_1',
            title: 'QuickSort In-Place Partitioning',
            language: 'python',
            conceptSummary: 'Divide-and-conquer sorting algorithm using Hoare partitioning with average O(n log n) runtime.',
            code: `def quicksort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quicksort(left) + middle + quicksort(right)\n\nprint("Sorted:", quicksort([23, 1, 10, 5, 2]))`,
            timestamp: Date.now() - 86400000 * 2
          },
          {
            id: 'learn_2',
            title: 'Async Event Loop & Microtasks',
            language: 'javascript',
            conceptSummary: 'Non-blocking I/O event loop execution model with microtasks and macrotasks queues.',
            code: `async function fetchMockData() {\n  return new Promise((resolve) => {\n    setTimeout(() => resolve({ status: 200, data: "Resolved async payload" }), 200);\n  });\n}\n\nfetchMockData().then(console.log);`,
            timestamp: Date.now() - 86400000
          }
        ]
      },
      {
        id: 'proj_sys',
        name: 'Systems & Cloud Infrastructure',
        description: 'Distributed systems, concurrency primitives, and container networking.',
        createdAt: Date.now() - 86400000,
        learnings: [
          {
            id: 'learn_3',
            title: 'Go Channels Worker Pool',
            language: 'go',
            conceptSummary: 'Worker pool in Go using buffered channels and sync.WaitGroup for safe concurrent execution.',
            code: `package main\n\nimport (\n\t"fmt"\n\t"sync"\n)\n\nfunc worker(id int, jobs <-chan int, wg *sync.WaitGroup) {\n\tdefer wg.Done()\n\tfor j := range jobs {\n\t\tfmt.Printf("worker %d finished job %d\\n", id, j)\n\t}\n}`,
            timestamp: Date.now() - 86400000
          }
        ]
      }
    ];
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    return localStorage.getItem('claude_rag_active_project_id') || 'proj_algo';
  });

  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [languageSearchQuery, setLanguageSearchQuery] = useState('');
  const [savedLearningAlert, setSavedLearningAlert] = useState<string | null>(null);

  // Sync current session messages on mount or session switch
  useEffect(() => {
    const existing = sessions.find((s) => s.id === sessionId);
    if (existing) {
      setMessages(existing.messages);
    }
    localStorage.setItem('claude_rag_current_session', sessionId);
  }, [sessionId]);

  // Persist sessions to localStorage
  const saveSessionsToStorage = (updatedSessions: ChatSession[]) => {
    setSessions(updatedSessions);
    try {
      localStorage.setItem('claude_rag_sessions', JSON.stringify(updatedSessions));
    } catch (e) {
      console.error('Failed to save sessions to localStorage', e);
    }
  };

  const handleNewChat = () => {
    const newId = Math.random().toString(36).substring(2, 10);
    setSessionId(newId);
    setMessages([]);
    setInputPrompt('');
    setActiveView('chat');
  };

  const switchSession = (targetSession: ChatSession) => {
    setSessionId(targetSession.id);
    setMessages(targetSession.messages);
    setActiveView('chat');
  };

  const deleteSession = (e: React.MouseEvent, idToDelete: string) => {
    e.stopPropagation();
    const updated = sessions.filter((s) => s.id !== idToDelete);
    saveSessionsToStorage(updated);
    if (sessionId === idToDelete) {
      handleNewChat();
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const copyToClipboard = (text: string, index?: number) => {
    navigator.clipboard.writeText(text);
    if (index !== undefined) {
      setCopiedMessageIndex(index);
      setTimeout(() => setCopiedMessageIndex(null), 2000);
    } else {
      setCopiedArtifact(true);
      setTimeout(() => setCopiedArtifact(false), 2000);
    }
  };

  const sendQuery = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    setActiveView('chat');
    const userMessage: Message = { role: 'user', content: queryText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          q: queryText, 
          thread_id: sessionId,
          persona: settings.persona,
          system_prompt: settings.systemPrompt,
          temperature: settings.temperature,
          top_k: settings.topK
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer || 'No response received from agent.',
        thoughtProcess: data.thought_process || [],
        sources: data.sources || []
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);

      // Update or create session entry
      const existingIdx = sessions.findIndex((s) => s.id === sessionId);
      const title = queryText.length > 34 ? queryText.slice(0, 34) + '...' : queryText;
      
      let updatedSessions: ChatSession[];
      if (existingIdx >= 0) {
        updatedSessions = [...sessions];
        updatedSessions[existingIdx] = {
          ...updatedSessions[existingIdx],
          messages: finalMessages,
          timestamp: Date.now()
        };
      } else {
        updatedSessions = [
          { id: sessionId, title, messages: finalMessages, timestamp: Date.now() },
          ...sessions
        ];
      }
      saveSessionsToStorage(updatedSessions);

    } catch (err: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Unable to connect to backend server (${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}). Error: ${err.message || err}`
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendQuery(inputPrompt);
  };

  const saveCustomSettings = (newSettings: typeof settings) => {
    setSettings(newSettings);
    localStorage.setItem('claude_rag_custom_settings', JSON.stringify(newSettings));
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const saveProjectsToStorage = (updated: CodingProject[]) => {
    setProjects(updated);
    try {
      localStorage.setItem('claude_rag_user_projects', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save projects to localStorage', e);
    }
  };

  const createProject = (name: string, description: string) => {
    if (!name.trim()) return;
    const newProj: CodingProject = {
      id: 'proj_' + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      description: description.trim() || 'Custom learning track',
      createdAt: Date.now(),
      learnings: []
    };
    const updated = [newProj, ...projects];
    saveProjectsToStorage(updated);
    setActiveProjectId(newProj.id);
    localStorage.setItem('claude_rag_active_project_id', newProj.id);
    setIsCreatingProject(false);
    setNewProjectName('');
    setNewProjectDesc('');
    setSavedLearningAlert(`Created project "${newProj.name}"`);
    setTimeout(() => setSavedLearningAlert(null), 3000);
  };

  const deleteProject = (projectId: string) => {
    const updated = projects.filter(p => p.id !== projectId);
    saveProjectsToStorage(updated);
    if (activeProjectId === projectId && updated.length > 0) {
      setActiveProjectId(updated[0].id);
      localStorage.setItem('claude_rag_active_project_id', updated[0].id);
    }
  };

  const saveLearningToProject = (title: string, lang: string, explanation: string, codeToSave: string) => {
    const currentProj = projects.find(p => p.id === activeProjectId) || projects[0];
    if (!currentProj) return;

    const newEntry: LearningEntry = {
      id: 'learn_' + Date.now(),
      title: title.trim() || `${lang.toUpperCase()} Concept Note`,
      language: lang,
      conceptSummary: explanation.slice(0, 240),
      code: codeToSave,
      timestamp: Date.now()
    };

    const updated = projects.map(p => {
      if (p.id === currentProj.id) {
        return {
          ...p,
          learnings: [newEntry, ...p.learnings]
        };
      }
      return p;
    });

    saveProjectsToStorage(updated);
    setSavedLearningAlert(`Saved learning to "${currentProj.name}"`);
    setTimeout(() => setSavedLearningAlert(null), 3000);
  };

  const deleteLearningFromProject = (projectId: string, learningId: string) => {
    const updated = projects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          learnings: p.learnings.filter(l => l.id !== learningId)
        };
      }
      return p;
    });
    saveProjectsToStorage(updated);
  };

  const loadLearningIntoStudio = (entry: LearningEntry, projId: string) => {
    setActiveProjectId(projId);
    localStorage.setItem('claude_rag_active_project_id', projId);
    handleLanguageChange(entry.language, entry.code);
    setActiveView('code');
  };

  const handleLanguageChange = (newLang: string, customCode?: string) => {
    const lang = newLang.toLowerCase();
    setCodeLanguage(lang);
    if (customCode !== undefined) {
      setCodeContent(customCode);
    } else {
      setCodeContent(LANGUAGE_TEMPLATES[lang] || `// ${lang.toUpperCase()} Code Sandbox\n// Write or test ${lang} code here\n`);
    }
  };

  const runCode = async () => {
    setIsExecuting(true);
    setTerminalStatus('Running...');
    const startTime = performance.now();

    try {
      if (codeLanguage === 'javascript') {
        const logs: string[] = [];
        const customConsole = {
          log: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
          error: (...args: any[]) => logs.push('[ERROR] ' + args.join(' ')),
          warn: (...args: any[]) => logs.push('[WARN] ' + args.join(' ')),
          info: (...args: any[]) => logs.push('[INFO] ' + args.join(' ')),
        };
        const runFn = new Function('console', codeContent);
        const ret = runFn(customConsole);
        if (ret !== undefined) {
          logs.push(`=> ${typeof ret === 'object' ? JSON.stringify(ret, null, 2) : ret}`);
        }
        const duration = ((performance.now() - startTime) / 1000).toFixed(3);
        setTerminalOutput(logs.length ? logs.join('\n') : '(Code executed successfully with no print output)');
        setTerminalStatus(`Success (${duration}s)`);
      } else if (codeLanguage === 'python') {
        // Python execution in-browser via Pyodide WebAssembly
        setTerminalOutput('Initializing Pyodide WebAssembly runtime...');

        if (!(window as any).loadPyodide) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Pyodide WebAssembly engine.'));
            document.head.appendChild(script);
          });
        }

        let pyodide = (window as any).__pyodideInstance;
        if (!pyodide) {
          pyodide = await (window as any).loadPyodide();
          (window as any).__pyodideInstance = pyodide;
        }

        let pyStdout = '';
        pyodide.setStdout({ batched: (str: string) => { pyStdout += str + '\n'; } });
        pyodide.setStderr({ batched: (str: string) => { pyStdout += '[stderr] ' + str + '\n'; } });

        await pyodide.runPythonAsync(codeContent);
        const duration = ((performance.now() - startTime) / 1000).toFixed(3);
        setTerminalOutput(pyStdout.trim() || '(Python executed with no print output)');
        setTerminalStatus(`Success (${duration}s)`);
      } else {
        const duration = ((performance.now() - startTime) / 1000).toFixed(3);
        setTerminalOutput(`Local browser sandbox directly executes Python (Pyodide WASM) and JavaScript.\nFor ${codeLanguage.toUpperCase()}, the AI Copilot provides live syntax explanation, code refactoring, and test cases.\nYou can click "Save Learning" to persist this ${codeLanguage.toUpperCase()} code into your active project.`);
        setTerminalStatus(`Saved (${duration}s)`);
      }
    } catch (err: any) {
      const duration = ((performance.now() - startTime) / 1000).toFixed(3);
      setTerminalOutput(`[Execution Error]:\n${err.message || err}`);
      setTerminalStatus(`Error (${duration}s)`);
    } finally {
      setIsExecuting(false);
    }
  };

  const askCopilot = async (promptText: string) => {
    if (!promptText.trim() || isCopilotLoading) return;

    const userEntry = { role: 'user' as const, text: promptText };
    setCopilotMessages(prev => [...prev, userEntry]);
    setCopilotPrompt('');
    setIsCopilotLoading(true);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const res = await fetch(`${backendUrl}/code/assist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          code: codeContent,
          language: codeLanguage,
          engine: copilotEngine
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      setCopilotMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: data.answer,
          code: data.code || undefined
        }
      ]);
    } catch (err: any) {
      setCopilotMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `Error connecting to Coding Copilot: ${err.message || err}`
        }
      ]);
    } finally {
      setIsCopilotLoading(false);
    }
  };

  // Static enterprise architecture specifications
  const artifactsList = [
    {
      title: "Kubernetes Microservices Architecture",
      type: "Architecture Specification",
      content: `+-----------------------------------------------------------+
|                     Kubernetes Control Plane              |
|  API Server | Scheduler | Controller Manager | etcd       |
+---------------------------+-------------------------------+
                            |
+---------------------------v-------------------------------+
|                     Worker Nodes (Cluster)                |
|  kubelet | kube-proxy | CNI (Calico)                      |
|  RAG Service Set | Qdrant Vector Store | Ingress Gateway  |
+-----------------------------------------------------------+`
    },
    {
      title: "FastAPI Query Endpoint Schema",
      type: "API Specification",
      content: `class QueryRequest(BaseModel):
    q: str = Field(..., description="Query for knowledge base")
    thread_id: Optional[str] = Field("default_user", description="Memory session ID")
    persona: Optional[str] = Field("Enterprise Architect", description="Persona profile")
    system_prompt: Optional[str] = Field(None, description="Custom instructions")
    temperature: Optional[float] = Field(0.1, description="LLM sampling temperature")
    top_k: Optional[int] = Field(5, description="Number of reranked chunks")

class QueryResponse(BaseModel):
    question: str
    answer: Optional[str]
    thought_process: List[str]
    status: Optional[str]
    sources: List[str]`
    },
    {
      title: "Dual Named Vectors Collection Configuration",
      type: "Qdrant Vector Configuration",
      content: `qdrant_client.create_collection(
    collection_name="enterprise_rag",
    vectors_config={
        "gemini": VectorParams(size=3072, distance=Distance.COSINE),
        "local": VectorParams(size=768, distance=Distance.COSINE)
    }
)`
    }
  ];

  const getViewTitle = () => {
    switch (activeView) {
      case 'chat': return 'Knowledge Assistant';
      case 'projects': return 'Enterprise Projects';
      case 'artifacts': return 'Architecture Artifacts';
      case 'code': return 'AI Code Studio';
      case 'customize': return 'Agent Configuration';
      default: return 'Enterprise Assistant';
    }
  };

  return (
    <div className="app-layout">
      {/* ── Togglable Sidebar ── */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <Cpu size={16} />
            <span>Enterprise RAG</span>
          </div>
          <button className="btn-toggle-sidebar" onClick={toggleSidebar} title="Collapse Sidebar">
            <PanelLeftClose size={16} />
          </button>
        </div>

        <button className="btn-new-chat" onClick={handleNewChat}>
          <Plus size={15} />
          <span>New chat</span>
        </button>

        {/* Navigation Section */}
        <div className="nav-section">
          <div 
            className={`nav-item ${activeView === 'chat' ? 'active' : ''}`} 
            onClick={() => setActiveView('chat')}
          >
            <MessageSquare size={15} />
            <span>Chat</span>
          </div>
          <div 
            className={`nav-item ${activeView === 'code' ? 'active' : ''}`} 
            onClick={() => setActiveView('code')}
          >
            <Code2 size={15} />
            <span>Code Studio</span>
          </div>
          <div 
            className={`nav-item ${activeView === 'projects' ? 'active' : ''}`} 
            onClick={() => setActiveView('projects')}
          >
            <FolderTree size={15} />
            <span>Projects</span>
          </div>
          <div 
            className={`nav-item ${activeView === 'artifacts' ? 'active' : ''}`} 
            onClick={() => setActiveView('artifacts')}
          >
            <FileText size={15} />
            <span>Artifacts</span>
          </div>
          <div 
            className={`nav-item ${activeView === 'customize' ? 'active' : ''}`} 
            onClick={() => setActiveView('customize')}
          >
            <Sliders size={15} />
            <span>Customize</span>
          </div>
        </div>

        <div className="nav-section-title">Saved Conversations</div>
        <div className="history-list">
          <div className={`chat-history-row ${messages.length > 0 && !sessions.some(s => s.id === sessionId) ? 'active' : ''}`}>
            <button className="chat-title-btn" onClick={() => setActiveView('chat')}>
              <MessageSquare size={13} />
              <span>{messages.length > 0 ? "Current Conversation" : "Active Session"}</span>
            </button>
          </div>

          {sessions.map((sess) => (
            <div key={sess.id} className={`chat-history-row ${sess.id === sessionId && activeView === 'chat' ? 'active' : ''}`}>
              <button className="chat-title-btn" onClick={() => switchSession(sess)}>
                <MessageSquare size={13} />
                <span>{sess.title}</span>
              </button>
              <button 
                type="button"
                className="btn-delete-session" 
                onClick={(e) => deleteSession(e, sess.id)}
                title="Delete session"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div>Persona: <code>{settings.persona}</code></div>
          <div>Session: <code>{sessionId}</code></div>
          <div>Engine: <code>Qdrant • Groq</code></div>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="main-content">
        <header className="top-navbar">
          <div className="navbar-left">
            {!isSidebarOpen && (
              <button className="btn-toggle-sidebar" onClick={toggleSidebar} title="Open Sidebar">
                <PanelLeft size={16} />
              </button>
            )}
            <div className="nav-breadcrumb">
              <span className={activeView === 'chat' ? 'active-label' : ''}>Workspace</span>
              {activeView !== 'chat' && (
                <>
                  <span>/</span>
                  <span className="active-label">{getViewTitle()}</span>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ── VIEW 1: CHAT ── */}
        {activeView === 'chat' && (
          <>
            <div className="chat-container">
              {messages.length === 0 ? (
                <div className="hero-container">
                  <h1 className="hero-title">Enterprise Knowledge Workspace</h1>
                  <p className="hero-subtitle">
                    Agentic Retrieval-Augmented Generation • LangGraph Pipeline • Dual Embeddings
                  </p>

                  <div className="suggestions-grid">
                    <button
                      className="suggestion-card"
                      onClick={() => sendQuery("Explain the technical architecture and pipeline of this Enterprise RAG system.")}
                    >
                      <Layers size={16} />
                      <span>Technical Architecture & Pipeline</span>
                    </button>
                    <button
                      className="suggestion-card"
                      onClick={() => sendQuery("What input and output guardrails are configured via NeMo Guardrails?")}
                    >
                      <ShieldCheck size={16} />
                      <span>NeMo Guardrails & Safety Checks</span>
                    </button>
                    <button
                      className="suggestion-card"
                      onClick={() => sendQuery("How does vector search with Qdrant and FlashRank reranking work in this project?")}
                    >
                      <Database size={16} />
                      <span>Qdrant Vector Search & Reranking</span>
                    </button>
                    <button
                      className="suggestion-card"
                      onClick={() => sendQuery("Summarize the RAGAS evaluation pipeline and available evaluation metrics.")}
                    >
                      <FileText size={16} />
                      <span>Evaluation Metrics & Suite</span>
                    </button>
                  </div>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div key={index} className={`message-bubble ${msg.role}`}>
                    <div className="message-header">
                      <span className="message-role">{msg.role === 'user' ? 'You' : 'Assistant'}</span>
                      {msg.role === 'assistant' && (
                        <button 
                          type="button"
                          className="btn-copy" 
                          onClick={() => copyToClipboard(msg.content, index)}
                          title="Copy response"
                        >
                          {copiedMessageIndex === index ? (
                            <>
                              <Check size={12} />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    
                    {msg.thoughtProcess && msg.thoughtProcess.length > 0 && (
                      <details className="thought-accordion">
                        <summary className="thought-summary">
                          <ChevronRight size={14} />
                          <span>Reasoning Steps ({msg.thoughtProcess.length})</span>
                        </summary>
                        <div className="thought-content">
                          <ul>
                            {msg.thoughtProcess.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      </details>
                    )}

                    <div className="message-text markdown-body">
                      {msg.role === 'user' ? (
                        <p>{msg.content}</p>
                      ) : (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      )}
                    </div>

                    {msg.sources && msg.sources.length > 0 && (
                      <details className="sources-accordion">
                        <summary className="sources-summary">
                          <ChevronRight size={14} />
                          <span>Retrieved Context Sources ({msg.sources.length} chunks)</span>
                        </summary>
                        <div className="sources-content">
                          {msg.sources.map((src, i) => (
                            <div key={i} className="source-item">
                              <span className="source-badge">Chunk {i + 1}</span>
                              <div className="source-text">{src.replace(/^CONTENT:\s*/, '')}</div>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                ))
              )}

              {isLoading && (
                <div style={{ marginTop: 16 }}>
                  <Loader />
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            <form className="input-container" onSubmit={handleSubmit}>
              <div className="input-wrapper">
                <input
                  type="text"
                  className="input-box"
                  placeholder="Ask a question about your enterprise documentation..."
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className="input-btn-send"
                  disabled={isLoading || !inputPrompt.trim()}
                  title="Send query"
                >
                  <Send size={15} />
                </button>
              </div>
            </form>
          </>
        )}

        {/* ── VIEW 2: CODE STUDIO ── */}
        {activeView === 'code' && (
          <div className="workspace-view">
            <div className="view-header">
              <div className="view-title-group">
                <h2>AI Code Studio & Learning Lab</h2>
                <p>Search any programming language, learn core concepts, execute sandbox code, and persist your progress project-wise.</p>
              </div>
            </div>

            {/* Project Selection & Inline Creator Bar */}
            <div className="code-project-bar">
              <div className="code-project-left">
                <Folder size={14} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Active Project:</span>
                <select 
                  className="code-project-select"
                  value={activeProjectId}
                  onChange={(e) => {
                    setActiveProjectId(e.target.value);
                    localStorage.setItem('claude_rag_active_project_id', e.target.value);
                  }}
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.learnings.length} learnings)
                    </option>
                  ))}
                </select>

                <button 
                  type="button" 
                  className="btn-secondary" 
                  style={{ padding: '4px 8px', fontSize: '0.76rem' }}
                  onClick={() => setIsCreatingProject(prev => !prev)}
                >
                  <Plus size={12} />
                  <span>{isCreatingProject ? 'Cancel' : 'New Project'}</span>
                </button>
              </div>

              {/* Language Search & Picker */}
              <div className="language-search-bar">
                <Search size={13} style={{ color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Search language..."
                  value={languageSearchQuery}
                  onChange={(e) => setLanguageSearchQuery(e.target.value)}
                />
                {languageSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setLanguageSearchQuery('')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Inline Project Creator (Zero Popups) */}
            {isCreatingProject && (
              <div className="inline-creator">
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Create New Learning Project
                </div>
                <div className="inline-creator-row">
                  <input 
                    type="text" 
                    placeholder="Project Name (e.g., Concurrency & Systems, Fullstack Rust)"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                  />
                  <input 
                    type="text" 
                    placeholder="Description (Optional)"
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                  />
                  <button 
                    type="button" 
                    className="btn-primary" 
                    style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                    onClick={() => createProject(newProjectName, newProjectDesc)}
                    disabled={!newProjectName.trim()}
                  >
                    Save Project
                  </button>
                </div>
              </div>
            )}

            {/* Language Selection Filter / Suggestions */}
            {languageSearchQuery.trim() && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10, alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Matching Languages:</span>
                {POPULAR_LANGUAGES
                  .filter(l => l.toLowerCase().includes(languageSearchQuery.toLowerCase()))
                  .map(lang => (
                    <button
                      key={lang}
                      type="button"
                      className="badge-tag"
                      style={{ 
                        cursor: 'pointer',
                        borderColor: codeLanguage === lang ? 'var(--border-focus)' : 'var(--border)',
                        color: codeLanguage === lang ? 'var(--text-primary)' : 'var(--text-secondary)'
                      }}
                      onClick={() => {
                        handleLanguageChange(lang);
                        setLanguageSearchQuery('');
                      }}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                {!POPULAR_LANGUAGES.includes(languageSearchQuery.toLowerCase()) && (
                  <button
                    type="button"
                    className="badge-tag"
                    style={{ cursor: 'pointer', borderColor: 'var(--border-focus)' }}
                    onClick={() => {
                      handleLanguageChange(languageSearchQuery.trim().toLowerCase());
                      setLanguageSearchQuery('');
                    }}
                  >
                    Use "{languageSearchQuery}"
                  </button>
                )}
              </div>
            )}

            {/* Concept Quick-Learn Chips Bar */}
            <div className="quick-learn-bar">
              <span className="quick-learn-label">
                Learn {codeLanguage.toUpperCase()}:
              </span>
              {(LANGUAGE_TOPICS[codeLanguage] || ['Syntax Fundamentals', 'Data Structures', 'Functions & Scope', 'Error Handling', 'Best Practices']).map((topic) => (
                <button
                  key={topic}
                  type="button"
                  className="concept-chip"
                  onClick={() => {
                    const prompt = `Explain the concept of '${topic}' in ${codeLanguage.toUpperCase()} with a complete, clean, runnable code example. Detail how it works, typical idioms, and key performance takeaways.`;
                    askCopilot(prompt);
                  }}
                >
                  <BookOpen size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  {topic}
                </button>
              ))}
            </div>

            {/* Notification alert banner */}
            {savedLearningAlert && (
              <div style={{ marginBottom: 12 }}>
                <span className="alert-toast">
                  <Check size={13} style={{ color: '#34d399' }} />
                  <span>{savedLearningAlert}</span>
                </span>
              </div>
            )}

            {/* Studio Navigation Tabs - State Machine Graph REMOVED */}
            <div className="studio-tabs">
              <button 
                className={`studio-tab-btn ${studioTab === 'studio' ? 'active' : ''}`}
                onClick={() => setStudioTab('studio')}
              >
                <Terminal size={14} />
                <span>Interactive Studio</span>
              </button>
              <button 
                className={`studio-tab-btn ${studioTab === 'api' ? 'active' : ''}`}
                onClick={() => setStudioTab('api')}
              >
                <ExternalLink size={14} />
                <span>API Reference</span>
              </button>
            </div>

            {/* Tab 1: Code Studio & Runner */}
            {studioTab === 'studio' && (
              <div className="code-studio-layout">
                {/* Left: AI Coding Copilot */}
                <div className="code-copilot-pane">
                  <div className="copilot-header">
                    <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Coding Copilot
                    </span>
                    <select 
                      className="copilot-model-select"
                      value={copilotEngine}
                      onChange={(e) => setCopilotEngine(e.target.value as 'groq' | 'gemini')}
                    >
                      <option value="groq">Groq (Fast)</option>
                      <option value="gemini">Gemini 2.5 (Flash)</option>
                    </select>
                  </div>

                  <div className="copilot-chat-history">
                    {copilotMessages.map((msg, idx) => (
                      <div key={idx} className={`copilot-msg ${msg.role}`}>
                        <div style={{ fontWeight: 600, fontSize: '0.74rem', marginBottom: 4, color: msg.role === 'user' ? '#93c5fd' : '#34d399' }}>
                          {msg.role === 'user' ? 'You' : `Copilot (${copilotEngine.toUpperCase()})`}
                        </div>
                        <div className="markdown-body" style={{ fontSize: '0.82rem' }}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.text}
                          </ReactMarkdown>
                        </div>
                        {msg.code && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                            <button 
                              type="button"
                              className="btn-send-to-editor"
                              onClick={() => setCodeContent(msg.code || '')}
                            >
                              <ArrowDownToLine size={12} />
                              <span>Insert into Editor</span>
                            </button>
                            <button 
                              type="button"
                              className="btn-send-to-editor"
                              style={{ borderColor: 'var(--border-focus)' }}
                              onClick={() => {
                                const title = `${codeLanguage.toUpperCase()} Snippet: ${msg.text.slice(0, 35).replace(/[^a-zA-Z0-9 ]/g, '').trim() || 'Concept'}`;
                                saveLearningToProject(title, codeLanguage, msg.text, msg.code || '');
                              }}
                            >
                              <Bookmark size={12} />
                              <span>Save to {projects.find(p => p.id === activeProjectId)?.name || 'Project'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {isCopilotLoading && (
                      <div className="copilot-msg assistant" style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Copilot is generating explanation and code...
                      </div>
                    )}
                  </div>

                  <form 
                    className="copilot-input-row"
                    onSubmit={(e) => {
                      e.preventDefault();
                      askCopilot(copilotPrompt);
                    }}
                  >
                    <input 
                      type="text" 
                      className="copilot-input"
                      placeholder="Ask to write, debug, explain or optimize code..."
                      value={copilotPrompt}
                      onChange={(e) => setCopilotPrompt(e.target.value)}
                      disabled={isCopilotLoading}
                    />
                    <button 
                      type="submit" 
                      className="copilot-btn-submit"
                      disabled={isCopilotLoading || !copilotPrompt.trim()}
                    >
                      <Send size={13} />
                    </button>
                  </form>
                </div>

                {/* Right: Code Editor & In-Browser Runner */}
                <div className="code-runner-pane">
                  <div className="runner-toolbar">
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <select 
                        className="copilot-model-select"
                        value={codeLanguage}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                      >
                        {POPULAR_LANGUAGES.map(lang => (
                          <option key={lang} value={lang}>
                            {lang.toUpperCase()} {lang === 'python' ? '(Pyodide WASM)' : lang === 'javascript' ? '(V8 Engine)' : '(Copilot Sandbox)'}
                          </option>
                        ))}
                        {!POPULAR_LANGUAGES.includes(codeLanguage) && (
                          <option value={codeLanguage}>{codeLanguage.toUpperCase()}</option>
                        )}
                      </select>

                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                        onClick={() => {
                          const title = `${codeLanguage.toUpperCase()} Implementation`;
                          saveLearningToProject(title, codeLanguage, `Saved from interactive editor for ${codeLanguage}`, codeContent);
                        }}
                        title="Save this code snippet to your active project"
                      >
                        <Bookmark size={12} />
                        <span>Save to Project</span>
                      </button>
                    </div>

                    <button 
                      type="button"
                      className="btn-run-code"
                      onClick={runCode}
                      disabled={isExecuting}
                    >
                      <Play size={13} />
                      <span>{isExecuting ? 'Running...' : 'Run Code'}</span>
                    </button>
                  </div>

                  <textarea 
                    className="code-editor-box"
                    value={codeContent}
                    onChange={(e) => setCodeContent(e.target.value)}
                    spellCheck={false}
                    placeholder="// Type code here..."
                  />

                  <div className="terminal-box">
                    <div className="terminal-header">
                      <span>Console Output</span>
                      <span>Status: <strong style={{ color: terminalStatus.includes('Error') ? '#f87171' : '#34d399' }}>{terminalStatus}</strong></span>
                    </div>
                    <div className={`terminal-screen ${terminalStatus.includes('Error') ? 'error' : ''}`}>
                      {terminalOutput}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: API Reference */}
            {studioTab === 'api' && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <h3 style={{ color: 'var(--text-primary)', marginBottom: 10, fontSize: '1.1rem' }}>
                  FastAPI OpenAPI Documentation
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginBottom: 20 }}>
                  Interactive Swagger UI for querying endpoints, inspecting schemas, and generating cURL commands.
                </p>
                <a 
                  href="http://localhost:8000/api/docs" 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn-primary"
                  style={{ textDecoration: 'none' }}
                >
                  <ExternalLink size={14} />
                  <span>Open /api/docs in New Tab</span>
                </a>
              </div>
            )}
          </div>
        )}

        {/* ── VIEW 3: PROJECTS ── */}
        {activeView === 'projects' && (
          <div className="workspace-view">
            <div className="view-header">
              <div className="view-title-group">
                <h2>Projects & Saved Learnings</h2>
                <p>Project-wise programming languages, mastered concepts, and runnable code archives.</p>
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setIsCreatingProject(prev => !prev)}
              >
                <Plus size={14} />
                <span>New Project</span>
              </button>
            </div>

            {/* Inline Project Creator (Zero Popups) */}
            {isCreatingProject && (
              <div className="inline-creator" style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Create New Learning Project
                </div>
                <div className="inline-creator-row">
                  <input 
                    type="text" 
                    placeholder="Project Name (e.g., Distributed Systems, Rust Microservices)"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                  />
                  <input 
                    type="text" 
                    placeholder="Description / Learning Objective"
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                  />
                  <button 
                    type="button" 
                    className="btn-primary" 
                    style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                    onClick={() => createProject(newProjectName, newProjectDesc)}
                    disabled={!newProjectName.trim()}
                  >
                    Save Project
                  </button>
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                    onClick={() => setIsCreatingProject(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Saved Notification Banner */}
            {savedLearningAlert && (
              <div style={{ marginBottom: 16 }}>
                <span className="alert-toast">
                  <Check size={13} style={{ color: '#34d399' }} />
                  <span>{savedLearningAlert}</span>
                </span>
              </div>
            )}

            {/* Project-Wise Cards Hierarchy */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {projects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <FolderTree size={32} style={{ margin: '0 auto 12px auto', display: 'block', opacity: 0.5 }} />
                  <p>No projects created yet. Click "New Project" to start tracking your learning!</p>
                </div>
              ) : (
                projects.map((project) => {
                  const uniqueLanguages = Array.from(new Set(project.learnings.map(l => l.language.toLowerCase())));
                  return (
                    <div key={project.id} className="project-wise-card">
                      <div className="project-card-top">
                        <div>
                          <div className="project-card-heading">
                            <Folder size={16} />
                            <span>{project.name}</span>
                            <span className="badge-tag" style={{ fontSize: '0.7rem' }}>
                              {project.learnings.length} {project.learnings.length === 1 ? 'learning' : 'learnings'}
                            </span>
                          </div>
                          <div className="project-card-desc">
                            {project.description}
                          </div>
                          {uniqueLanguages.length > 0 && (
                            <div className="project-languages-list">
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                                Languages:
                              </span>
                              {uniqueLanguages.map(lang => (
                                <span key={lang} className="badge-tag">
                                  {lang.toUpperCase()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                            onClick={() => {
                              setActiveProjectId(project.id);
                              localStorage.setItem('claude_rag_active_project_id', project.id);
                              setActiveView('code');
                            }}
                            title="Open in Code Studio"
                          >
                            <Terminal size={12} />
                            <span>Studio</span>
                          </button>
                          {projects.length > 1 && (
                            <button
                              type="button"
                              className="chat-action-btn"
                              onClick={() => deleteProject(project.id)}
                              title="Delete project"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Saved Learnings for this Project */}
                      <div className="learnings-accordion">
                        {project.learnings.length === 0 ? (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 0' }}>
                            No learnings saved in this project yet. Open Code Studio, search any language or concept, and click "Save to Project".
                          </div>
                        ) : (
                          project.learnings.map((entry) => {
                            return (
                              <div key={entry.id} className="learning-item">
                                <div className="learning-item-header">
                                  <div className="learning-item-title">
                                    <BookOpen size={13} style={{ color: 'var(--text-muted)' }} />
                                    <span>{entry.title}</span>
                                    <span className="badge-tag" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                                      {entry.language.toUpperCase()}
                                    </span>
                                  </div>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    {new Date(entry.timestamp).toLocaleDateString()}
                                  </span>
                                </div>

                                {entry.conceptSummary && (
                                  <div className="learning-item-summary">
                                    {entry.conceptSummary}
                                  </div>
                                )}

                                {entry.code && (
                                  <div>
                                    <pre className="learning-item-code">
                                      <code>{entry.code}</code>
                                    </pre>
                                  </div>
                                )}

                                <div className="learning-item-actions">
                                  <button
                                    type="button"
                                    className="btn-secondary"
                                    style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                                    onClick={() => copyToClipboard(entry.code)}
                                  >
                                    <Copy size={11} />
                                    <span>Copy Code</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-secondary"
                                    style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                                    onClick={() => loadLearningIntoStudio(entry, project.id)}
                                  >
                                    <Play size={11} />
                                    <span>Run in Studio</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="chat-action-btn"
                                    style={{ padding: '3px 6px' }}
                                    onClick={() => deleteLearningFromProject(project.id, entry.id)}
                                    title="Delete learning entry"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Enterprise Knowledge Repositories */}
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Enterprise RAG Vector Repositories
                </span>
                <span className="badge-tag">Qdrant Cloud Synced</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <span className="badge-tag"><FileText size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Kubernetes Overview v1.8</span>
                <span className="badge-tag"><FileText size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Intel DPDK Dataplane Guide</span>
                <span className="badge-tag"><FileText size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />SR-IOV High Perf Networking</span>
                <span className="badge-tag"><FileText size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />5-Level Paging Intel Spec</span>
                <span className="badge-tag"><FileText size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Parallel Page Cache Systems</span>
                <span className="badge-tag"><FileText size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Memory Consistency Models</span>
                <span className="badge-tag"><FileText size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Lock-Free Hash Tables</span>
              </div>
            </div>
          </div>
        )}

        {/* ── VIEW 4: ARTIFACTS ── */}
        {activeView === 'artifacts' && (
          <div className="workspace-view">
            <div className="view-header">
              <div className="view-title-group">
                <h2>Architecture Artifacts & Specifications</h2>
                <p>System diagrams, endpoint schemas, and infrastructure configurations.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 20, flex: 1 }}>
              <div style={{ width: 260, borderRight: '1px solid var(--border)', paddingRight: 16 }}>
                {artifactsList.map((art, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedArtifactIndex(idx)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 6,
                      marginBottom: 6,
                      cursor: 'pointer',
                      backgroundColor: selectedArtifactIndex === idx ? 'var(--bg-surface)' : 'transparent',
                      border: selectedArtifactIndex === idx ? '1px solid var(--border)' : '1px solid transparent',
                      color: selectedArtifactIndex === idx ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontSize: '0.84rem'
                    }}
                  >
                    <strong style={{ display: 'block', fontSize: '0.82rem' }}>{art.title}</strong>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{art.type}</div>
                  </div>
                ))}
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                    {artifactsList[selectedArtifactIndex].title}
                  </h3>
                  <button 
                    type="button"
                    className="btn-copy" 
                    onClick={() => copyToClipboard(artifactsList[selectedArtifactIndex].content)}
                  >
                    {copiedArtifact ? (
                      <>
                        <Check size={12} />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy Spec</span>
                      </>
                    )}
                  </button>
                </div>
                <pre style={{
                  backgroundColor: '#0d0d10',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: 14,
                  fontSize: '0.82rem',
                  lineHeight: 1.45,
                  overflowY: 'auto',
                  flex: 1,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
                }}>
                  <code>{artifactsList[selectedArtifactIndex].content}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* ── VIEW 5: CUSTOMIZE ── */}
        {activeView === 'customize' && (
          <div className="workspace-view">
            <div className="view-header">
              <div className="view-title-group">
                <h2>Agent Configuration</h2>
                <p>Customize system persona instructions, LLM sampling temperature, and reranking thresholds.</p>
              </div>
              {savedNotice && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#34d399', fontSize: '0.82rem' }}>
                  <CheckCircle2 size={15} />
                  <span>Configuration saved</span>
                </div>
              )}
            </div>

            <div style={{ maxWidth: 640 }}>
              <div className="form-group">
                <label className="form-label">Persona Mode</label>
                <select 
                  className="form-select"
                  value={settings.persona}
                  onChange={(e) => setSettings({ ...settings, persona: e.target.value })}
                >
                  <option value="Enterprise Architect">Enterprise Architect (Comprehensive & In-Depth)</option>
                  <option value="DevOps Engineer">DevOps Engineer (Practical & Infrastructure-Oriented)</option>
                  <option value="Security Auditor">Security Auditor (Policy & Compliance Focused)</option>
                  <option value="Concise Explainer">Concise Explainer (Short & Direct)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">System Instruction Addendum</label>
                <textarea 
                  className="form-textarea"
                  rows={4}
                  value={settings.systemPrompt}
                  onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
                />
              </div>

              <div className="workspace-grid-2">
                <div className="form-group">
                  <label className="form-label">LLM Temperature: {settings.temperature}</label>
                  <input 
                    type="range" 
                    min="0.0" 
                    max="1.0" 
                    step="0.05"
                    value={settings.temperature}
                    className="form-range"
                    onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Qdrant Rerank Top-K: {settings.topK}</label>
                  <input 
                    type="range" 
                    min="3" 
                    max="15" 
                    step="1"
                    value={settings.topK}
                    className="form-range"
                    onChange={(e) => setSettings({ ...settings, topK: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <button 
                  type="button"
                  className="btn-primary" 
                  onClick={() => saveCustomSettings(settings)}
                >
                  <Check size={14} />
                  <span>Save Configuration</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;


