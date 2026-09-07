import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Loader from './Loader';
import {
  Plus,
  MessageSquare,
  Code2,
  FolderTree,
  FileText,
  PanelLeftClose,
  PanelLeft,
  Trash2,
  Play,
  Copy,
  Check,
  Send,
  ChevronRight,
  Terminal,
  ArrowDownToLine,
  Database,
  Cpu,
  Layers,
  ShieldCheck,
  Search,
  BookOpen,
  Bookmark,
  Folder,
  X,
  Paperclip,
  Eye
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
  'html',
  'css',
  'javascript',
  'typescript',
  'python',
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
`,
  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      padding: 24px;
      margin: 0;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 20px;
      max-width: 440px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
    }
    h2 { margin-top: 0; color: #38bdf8; font-size: 1.25rem; }
    p { color: #94a3b8; font-size: 0.92rem; line-height: 1.5; margin-bottom: 16px; }
    .btn {
      background: #0284c7;
      color: #ffffff;
      border: none;
      border-radius: 6px;
      padding: 8px 16px;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .btn:hover { background: #0369a1; }
  </style>
</head>
<body>
  <div class="card">
    <h2>HTML5 & CSS3 Live Preview</h2>
    <p>HTML and CSS are interpreted markup & styling languages. They render live in the browser engine without needing compilation.</p>
    <button class="btn" onclick="alert('Interactive DOM event fired!')">Test DOM Event</button>
  </div>
</body>
</html>
`,
  css: `/* CSS3 Stylesheet Live Preview */
:root {
  --primary-accent: #38bdf8;
  --bg-card: #1e293b;
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
}

body {
  margin: 0;
  padding: 30px;
  background-color: #0f172a;
  color: var(--text-main);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  display: flex;
  justify-content: center;
}

.preview-container {
  background: var(--bg-card);
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 24px;
  width: 360px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
}

.preview-badge {
  display: inline-block;
  background: rgba(56, 189, 248, 0.15);
  color: var(--primary-accent);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 9999px;
  margin-bottom: 12px;
}

.preview-btn {
  background: var(--primary-accent);
  color: #0f172a;
  font-weight: 600;
  border: none;
  padding: 9px 18px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.preview-btn:hover {
  transform: translateY(-2px);
}
`
};

export function createCssPreview(css: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
${css}
  </style>
</head>
<body>
  <div class="preview-container">
    <span class="preview-badge">CSS3 Live Preview</span>
    <h3 style="margin: 0 0 8px 0; font-size: 1.15rem;">Live Styled Component</h3>
    <p style="color: var(--text-muted, #94a3b8); font-size: 0.9rem; line-height: 1.45; margin-bottom: 16px;">
      HTML and CSS are interpreted markup & style rules rendered in real-time by the browser layout engine.
    </p>
    <button class="preview-btn">Interactive Button</button>
  </div>
</body>
</html>`;
}


interface Message {
  role: 'user' | 'assistant';
  content: string;
  code?: string;
  thoughtProcess?: string[];
  sources?: string[];
  skill?: string;
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
  const [activeView, setActiveView] = useState<'chat' | 'projects' | 'code'>('chat');
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);

  // User Customization Settings
  const [settings] = useState(() => {
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
  const [codeLanguage, setCodeLanguage] = useState<string>('python');
  const [codeContent, setCodeContent] = useState<string>(LANGUAGE_TEMPLATES.python);
  const [terminalOutput, setTerminalOutput] = useState<string>('Ready. Click Run Code to execute in your browser runtime.');
  const [terminalStatus, setTerminalStatus] = useState<string>('Ready');
  const [outputTab, setOutputTab] = useState<'terminal' | 'preview'>('terminal');
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('claude_rag_copilot_visible');
    return saved !== null ? saved === 'true' : true;
  });
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
  const [activeSkill, setActiveSkill] = useState<'rag' | 'code' | 'guardrails'>('rag');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadStatusMessage, setUploadStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
    }
  };

  const updateSessions = (targetSessionId: string, finalMessages: Message[], titleSeed?: string) => {
    const existingIdx = sessions.findIndex((s) => s.id === targetSessionId);
    let updatedSessions: ChatSession[];
    if (existingIdx >= 0) {
      updatedSessions = [...sessions];
      updatedSessions[existingIdx] = {
        ...updatedSessions[existingIdx],
        messages: finalMessages,
        timestamp: Date.now()
      };
    } else {
      const seed = titleSeed || (finalMessages.find(m => m.role === 'user')?.content || 'New Chat');
      const title = seed.length > 34 ? seed.slice(0, 34) + '...' : seed;
      updatedSessions = [
        { id: targetSessionId, title, messages: finalMessages, timestamp: Date.now() },
        ...sessions
      ];
    }
    saveSessionsToStorage(updatedSessions);
  };

  const sendQuery = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    setActiveView('chat');
    const userMessage: Message = { role: 'user', content: queryText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputPrompt('');
    setIsLoading(true);

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

    try {
      // Skill Route 1: Code & Language Tutor Skill
      if (activeSkill === 'code') {
        const response = await fetch(`${backendUrl}/code/assist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: queryText,
            code: codeContent,
            language: codeLanguage,
            engine: copilotEngine
          })
        });

        if (!response.ok) {
          throw new Error(`Server returned status ${response.status}`);
        }

        const data = await response.json();
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.answer || 'No code response received.',
          code: data.code || undefined,
          thoughtProcess: [
            `Skill: Code & Language Tutor`,
            `Engine: ${data.engine?.toUpperCase() || 'GROQ'}`,
            `Target Language: ${(data.language || codeLanguage).toUpperCase()}`
          ],
          skill: 'code'
        };

        const finalMessages = [...newMessages, assistantMessage];
        setMessages(finalMessages);
        updateSessions(sessionId, finalMessages, queryText);
        return;
      }

      // Skill Route 2 & 3: Enterprise RAG and Security & Guardrails
      const effectiveSystemPrompt = activeSkill === 'guardrails'
        ? "You are a Security & Guardrails Auditor. Test, analyze, and report on prompt safety, jailbreak defenses, and enterprise policy enforcement."
        : settings.systemPrompt;

      const response = await fetch(`${backendUrl}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          q: queryText, 
          thread_id: sessionId,
          persona: settings.persona,
          system_prompt: effectiveSystemPrompt,
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
        sources: data.sources || [],
        skill: activeSkill
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);
      updateSessions(sessionId, finalMessages, queryText);

    } catch (err: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Unable to connect to backend server (${backendUrl}). Error: ${err.message || err}`
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    setUploadStatusMessage(`Validating "${file.name}" through NeMo Guardrails & RAG pipeline...`);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const res = await fetch(`${backendUrl}/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.safe && data.success) {
        const confirmMsg: Message = {
          role: 'assistant',
          content: `Document **${data.filename}** passed NeMo Guardrails verification and has been indexed into the Enterprise RAG vector store (${data.chunks_count} chunks, ${data.points_indexed} points).\n\nYou can now ask questions about the contents of this document.`,
          thoughtProcess: [
            `File Validation: ${data.filename}`,
            `NeMo Guardrails: ${data.guardrail_status || 'Verified Safe'}`,
            `RAG Ingestion: Chunked & Embedded with dual vectors`,
            `Vector Store: ${data.points_indexed} points indexed in Qdrant`
          ],
          sources: [`File Source: ${data.filename}`]
        };
        const updated = [...messages, confirmMsg];
        setMessages(updated);
        updateSessions(sessionId, updated, `Upload: ${data.filename}`);
        setSavedLearningAlert(`File "${data.filename}" safely indexed into RAG`);
        setTimeout(() => setSavedLearningAlert(null), 4000);
      } else {
        const rejectMsg: Message = {
          role: 'assistant',
          content: `**Upload Rejected by Security Guardrails**\n\nFile **${data.filename}** could not be ingested into RAG.\n\n**Reason:** ${data.reason || 'Guardrail policy violation or disallowed prompt injection detected.'}\n\n*This document was blocked and not stored or indexed into the vector database.*`,
          thoughtProcess: [
            `File Scan: ${data.filename}`,
            `Security Gate: Prompt injection or policy violation detected`,
            `Action: File rejected, RAG ingestion aborted`
          ]
        };
        const updated = [...messages, rejectMsg];
        setMessages(updated);
        updateSessions(sessionId, updated, `Blocked: ${data.filename}`);
        setSavedLearningAlert(`Upload blocked: Guardrail policy violation`);
        setTimeout(() => setSavedLearningAlert(null), 4000);
      }
    } catch (err: any) {
      console.error('File upload failed', err);
      setSavedLearningAlert(`Upload failed: ${err.message || err}`);
      setTimeout(() => setSavedLearningAlert(null), 4000);
    } finally {
      setIsUploadingFile(false);
      setUploadStatusMessage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendQuery(inputPrompt);
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
    const code = customCode !== undefined 
      ? customCode 
      : (LANGUAGE_TEMPLATES[lang] || `// ${lang.toUpperCase()} Code Sandbox\n// Write or test ${lang} code here\n`);
    setCodeContent(code);

    if (lang === 'html') {
      setPreviewHtml(code);
      setOutputTab('preview');
      setTerminalOutput('HTML5 document loaded. Click "Render HTML" or view Live Preview.');
      setTerminalStatus('Ready');
    } else if (lang === 'css') {
      setPreviewHtml(createCssPreview(code));
      setOutputTab('preview');
      setTerminalOutput('CSS3 stylesheet loaded. Click "Render CSS" or view Live Preview.');
      setTerminalStatus('Ready');
    } else {
      setOutputTab('terminal');
      setTerminalOutput(`Ready. Click Run Code to execute in your ${lang === 'python' ? 'Pyodide WASM' : lang === 'javascript' ? 'browser runtime' : 'sandbox'}.`);
      setTerminalStatus('Ready');
    }
  };

  const runCode = async () => {
    setIsExecuting(true);
    setTerminalStatus(codeLanguage === 'html' || codeLanguage === 'css' ? 'Rendering...' : 'Running...');
    const startTime = performance.now();

    try {
      if (codeLanguage === 'html') {
        setPreviewHtml(codeContent);
        setOutputTab('preview');
        const duration = ((performance.now() - startTime) / 1000).toFixed(3);
        setTerminalOutput('HTML5 document rendered live in the Preview window below.');
        setTerminalStatus(`Rendered (${duration}s)`);
      } else if (codeLanguage === 'css') {
        setPreviewHtml(createCssPreview(codeContent));
        setOutputTab('preview');
        const duration = ((performance.now() - startTime) / 1000).toFixed(3);
        setTerminalOutput('CSS3 styles applied live in the Preview window below.');
        setTerminalStatus(`Rendered (${duration}s)`);
      } else if (codeLanguage === 'javascript') {
        setOutputTab('terminal');
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
      } else if (codeLanguage === 'typescript') {
        setOutputTab('terminal');
        const logs: string[] = [];
        const customConsole = {
          log: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
          error: (...args: any[]) => logs.push('[ERROR] ' + args.join(' ')),
          warn: (...args: any[]) => logs.push('[WARN] ' + args.join(' ')),
          info: (...args: any[]) => logs.push('[INFO] ' + args.join(' ')),
        };
        const stripped = codeContent
          .replace(/interface\s+\w+(\s*<[^>]+>)?\s*\{[\s\S]*?\}/g, '')
          .replace(/type\s+\w+(\s*<[^>]+>)?\s*=[\s\S]*?;/g, '')
          .replace(/:\s*[A-Z]\w*(<[^>]+>)?(\[\])?/g, '')
          .replace(/<[A-Z]\w*>/g, '');
        const runFn = new Function('console', stripped);
        const ret = runFn(customConsole);
        if (ret !== undefined) {
          logs.push(`=> ${typeof ret === 'object' ? JSON.stringify(ret, null, 2) : ret}`);
        }
        const duration = ((performance.now() - startTime) / 1000).toFixed(3);
        setTerminalOutput(logs.length ? logs.join('\n') : '(TypeScript executed successfully with no print output)');
        setTerminalStatus(`Success (${duration}s)`);
      } else if (codeLanguage === 'python') {
        setOutputTab('terminal');
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

        // Set up standard environment variables (__file__, __name__) and virtual filesystem directory
        pyodide.runPython(`
import sys, os
os.makedirs('/home/pyodide', exist_ok=True)
try:
    os.chdir('/home/pyodide')
except Exception:
    pass
__file__ = '/home/pyodide/main.py'
__name__ = '__main__'
`);

        await pyodide.runPythonAsync(codeContent);

        // Check if script generated any HTML files in the virtual filesystem
        try {
          const files: string[] = pyodide.FS.readdir('/home/pyodide');
          const htmlFile = files.find((f: string) => f.endsWith('.html'));
          if (htmlFile) {
            const htmlData = pyodide.FS.readFile(`/home/pyodide/${htmlFile}`, { encoding: 'utf8' });
            setPreviewHtml(htmlData);
            pyStdout += `\n[HTML Output Generated: "${htmlFile}" — Click "Live Preview" tab to view rendered page]`;
          }
        } catch {
          // Virtual FS inspection optional
        }

        const duration = ((performance.now() - startTime) / 1000).toFixed(3);
        setTerminalOutput(pyStdout.trim() || '(Python executed with no print output)');
        setTerminalStatus(`Success (${duration}s)`);
      } else {
        setOutputTab('terminal');
        const duration = ((performance.now() - startTime) / 1000).toFixed(3);
        setTerminalOutput(`Local browser sandbox directly executes Python (Pyodide WASM), JavaScript, and renders HTML/CSS.\nFor ${codeLanguage.toUpperCase()}, the AI Copilot provides live syntax explanation, code refactoring, and test cases.\nYou can click "Save to Project" to persist this ${codeLanguage.toUpperCase()} code into your active project.`);
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

  const getViewTitle = () => {
    switch (activeView) {
      case 'chat': return 'Knowledge Assistant';
      case 'projects': return 'Projects';
      case 'code': return 'Code Studio';
      default: return 'Workspace';
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
            {/* Active Skills Bar */}
            <div className="chat-skills-header">
              <span className="chat-skills-label">Active Skill:</span>
              <button
                type="button"
                className={`chat-skill-btn ${activeSkill === 'rag' ? 'active' : ''}`}
                onClick={() => setActiveSkill('rag')}
              >
                <Database size={13} />
                <span>Enterprise RAG</span>
              </button>
              <button
                type="button"
                className={`chat-skill-btn ${activeSkill === 'code' ? 'active' : ''}`}
                onClick={() => setActiveSkill('code')}
              >
                <Code2 size={13} />
                <span>Code & Language Tutor</span>
              </button>
              <button
                type="button"
                className={`chat-skill-btn ${activeSkill === 'guardrails' ? 'active' : ''}`}
                onClick={() => setActiveSkill('guardrails')}
              >
                <ShieldCheck size={13} />
                <span>Security & Guardrails</span>
              </button>
            </div>

            {/* Sub-bar when Code Skill is active: Language switcher */}
            {activeSkill === 'code' && (
              <div className="chat-skill-subbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 500 }}>Language:</span>
                  <select
                    className="copilot-model-select"
                    style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                    value={codeLanguage}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                  >
                    {POPULAR_LANGUAGES.map(lang => (
                      <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Uploading / Guardrails Progress Banner */}
            {isUploadingFile && (
              <div className="uploading-banner">
                <Loader />
                <span>{uploadStatusMessage || 'Validating document through Guardrails and indexing to RAG...'}</span>
              </div>
            )}

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

                    {msg.code && (
                      <div className="chat-code-actions">
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                          onClick={() => {
                            handleLanguageChange(codeLanguage, msg.code || '');
                            setActiveView('code');
                          }}
                        >
                          <Play size={11} />
                          <span>Run in Studio</span>
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                          onClick={() => {
                            const title = `${codeLanguage.toUpperCase()}: ${msg.content.slice(0, 30).replace(/[^a-zA-Z0-9 ]/g, '').trim() || 'Concept'}`;
                            saveLearningToProject(title, codeLanguage, msg.content, msg.code || '');
                          }}
                        >
                          <Bookmark size={11} />
                          <span>Save to {projects.find(p => p.id === activeProjectId)?.name || 'Project'}</span>
                        </button>
                      </div>
                    )}

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
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                  accept=".txt,.md,.pdf,.py,.json,.csv,.docx,.html,.htm,.sh,.sql,.yaml,.yml"
                />
                <button
                  type="button"
                  className="file-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || isUploadingFile}
                  title="Upload document to RAG pipeline (validated through Guardrails first)"
                >
                  <Paperclip size={16} />
                </button>
                <input
                  type="text"
                  className="input-box"
                  placeholder={
                    activeSkill === 'code'
                      ? `Ask to teach a concept, write algorithms, or debug in ${codeLanguage.toUpperCase()}...`
                      : activeSkill === 'guardrails'
                      ? "Test prompt injection, jailbreak defenses, or security rules..."
                      : "Ask a question about your enterprise documentation or uploaded files..."
                  }
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  disabled={isLoading || isUploadingFile}
                />
                <button
                  type="submit"
                  className="input-btn-send"
                  disabled={isLoading || isUploadingFile || !inputPrompt.trim()}
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
                <h2>Code Studio</h2>
                <p>Search any programming language, write and test code, and save to your projects.</p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  type="button"
                  className={`btn-secondary ${isCopilotOpen ? 'active' : ''}`}
                  onClick={() => {
                    setIsCopilotOpen(prev => {
                      const next = !prev;
                      localStorage.setItem('claude_rag_copilot_visible', String(next));
                      return next;
                    });
                  }}
                  title={isCopilotOpen ? "Hide Coding Copilot to expand Editor & Preview" : "Show Coding Copilot"}
                >
                  <MessageSquare size={13} />
                  <span>{isCopilotOpen ? "Hide Copilot" : "Coding Copilot"}</span>
                </button>
                <button 
                  type="button" 
                  className="btn-primary" 
                  onClick={() => setIsCreatingProject(prev => !prev)}
                >
                  <Plus size={13} />
                  <span>{isCreatingProject ? 'Cancel' : 'Create Project'}</span>
                </button>
              </div>
            </div>

            {/* Inline Project Creator */}
            {isCreatingProject && (
              <div className="inline-creator" style={{ marginBottom: 12 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Create New Project
                </div>
                <div className="inline-creator-row">
                  <input 
                    type="text" 
                    placeholder="Project Name (e.g., Concurrency & Systems, Rust Microservices)"
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

            {/* Small Boxes List of Created Projects (Redirects to Projects Section) */}
            <div className="code-projects-mini-list">
              {projects.map((proj) => (
                <button
                  key={proj.id}
                  type="button"
                  className={`mini-project-box ${activeProjectId === proj.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveProjectId(proj.id);
                    localStorage.setItem('claude_rag_active_project_id', proj.id);
                    setActiveView('projects');
                  }}
                  title="Click to view details in Projects section"
                >
                  <Folder size={12} style={{ color: 'var(--text-secondary)' }} />
                  <span className="mini-project-name">{proj.name}</span>
                  <span className="mini-project-count">{proj.learnings.length}</span>
                </button>
              ))}
            </div>

            {/* Language Search & Picker */}
            <div className="language-search-bar" style={{ marginBottom: 12 }}>
              <Search size={13} style={{ color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search language (e.g. Python, Rust, Go, TypeScript, C++)..."
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

            {/* Notification alert banner */}
            {savedLearningAlert && (
              <div style={{ marginBottom: 12 }}>
                <span className="alert-toast">
                  <Check size={13} style={{ color: '#34d399' }} />
                  <span>{savedLearningAlert}</span>
                </span>
              </div>
            )}

            {/* Code Studio & Runner Layout */}
            <div className="code-studio-layout">
              {/* Left: AI Coding Copilot (Toggleable) */}
              {isCopilotOpen && (
                <div className="code-copilot-pane">
                  <div className="copilot-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                    <button
                      type="button"
                      onClick={() => {
                        setIsCopilotOpen(false);
                        localStorage.setItem('claude_rag_copilot_visible', 'false');
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                      title="Hide Copilot to expand preview & editor"
                    >
                      <PanelLeftClose size={14} />
                    </button>
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
              )}

              {/* Right: Code Editor & In-Browser Runner (Expands to 100% when Copilot is hidden) */}
              <div className="code-runner-pane">
                <div className="runner-toolbar">
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className={`btn-secondary ${isCopilotOpen ? 'active' : ''}`}
                      style={{ padding: '4px 8px', fontSize: '0.76rem' }}
                      onClick={() => {
                        setIsCopilotOpen(prev => {
                          const next = !prev;
                          localStorage.setItem('claude_rag_copilot_visible', String(next));
                          return next;
                        });
                      }}
                      title={isCopilotOpen ? "Hide Coding Copilot to expand Editor & Preview" : "Show Coding Copilot"}
                    >
                      <MessageSquare size={12} />
                      <span>{isCopilotOpen ? "Hide Copilot" : "Copilot"}</span>
                    </button>

                    <select 
                      className="copilot-model-select"
                      value={codeLanguage}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                    >
                      {POPULAR_LANGUAGES.map(lang => (
                        <option key={lang} value={lang}>
                          {lang.toUpperCase()} {
                            lang === 'html' ? '(Live DOM Preview)' :
                            lang === 'css' ? '(Live Stylesheet Preview)' :
                            lang === 'python' ? '(Pyodide WASM)' :
                            lang === 'javascript' ? '(V8 Engine)' :
                            lang === 'typescript' ? '(Transpiled JS)' :
                            '(AI Sandbox)'
                          }
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
                    style={codeLanguage === 'html' || codeLanguage === 'css' ? { background: '#2563eb', borderColor: '#1d4ed8' } : undefined}
                  >
                    {codeLanguage === 'html' || codeLanguage === 'css' ? <Eye size={13} /> : <Play size={13} />}
                    <span>{isExecuting ? 'Processing...' : codeLanguage === 'html' ? 'Render HTML' : codeLanguage === 'css' ? 'Render CSS' : 'Run Code'}</span>
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
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button
                        type="button"
                        className={`terminal-tab-btn ${outputTab === 'terminal' ? 'active' : ''}`}
                        onClick={() => setOutputTab('terminal')}
                      >
                        <Terminal size={12} />
                        <span>Console</span>
                      </button>
                      <button
                        type="button"
                        className={`terminal-tab-btn ${outputTab === 'preview' ? 'active' : ''}`}
                        onClick={() => setOutputTab('preview')}
                      >
                        <Eye size={12} />
                        <span>Live Preview</span>
                      </button>
                    </div>
                    <span>Status: <strong style={{ color: terminalStatus.includes('Error') ? '#f87171' : '#34d399' }}>{terminalStatus}</strong></span>
                  </div>
                  {outputTab === 'preview' ? (
                    previewHtml ? (
                      <iframe 
                        title="Live Code Preview"
                        className="live-preview-frame"
                        sandbox="allow-scripts allow-modals"
                        srcDoc={previewHtml}
                      />
                    ) : (
                      <div style={{ padding: 24, color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center' }}>
                        No preview rendered yet. Click "{codeLanguage === 'html' ? 'Render HTML' : codeLanguage === 'css' ? 'Render CSS' : 'Render Preview'}" to view rendered DOM.
                      </div>
                    )
                  ) : (
                    <div className={`terminal-screen ${terminalStatus.includes('Error') ? 'error' : ''}`}>
                      {terminalOutput}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── VIEW 3: PROJECTS ── */}
        {activeView === 'projects' && (
          <div className="workspace-view">
            <div className="view-header">
              <div className="view-title-group">
                <h2>Projects</h2>
                <p>Track created projects and inspect saved language concepts in detail.</p>
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setIsCreatingProject(prev => !prev)}
              >
                <Plus size={13} />
                <span>{isCreatingProject ? 'Cancel' : 'Create Project'}</span>
              </button>
            </div>

            {/* Inline Project Creator */}
            {isCreatingProject && (
              <div className="inline-creator" style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Create New Project
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
              <div style={{ marginBottom: 14 }}>
                <span className="alert-toast">
                  <Check size={13} style={{ color: '#34d399' }} />
                  <span>{savedLearningAlert}</span>
                </span>
              </div>
            )}

            {/* Dropdown Minimal Projects List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {projects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <Folder size={32} style={{ margin: '0 auto 12px auto', display: 'block', opacity: 0.5 }} />
                  <p>No projects created yet. Click "Create Project" to get started.</p>
                </div>
              ) : (
                projects.map((project) => {
                  const uniqueLanguages = Array.from(new Set(project.learnings.map(l => l.language.toLowerCase())));
                  return (
                    <details 
                      key={project.id} 
                      className="project-minimal-item"
                      open={activeProjectId === project.id}
                    >
                      <summary className="project-minimal-summary">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Folder size={14} style={{ color: 'var(--text-secondary)' }} />
                          <span>{project.name}</span>
                          <span className="badge-tag" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                            {project.learnings.length} {project.learnings.length === 1 ? 'learning' : 'learnings'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {uniqueLanguages.map(lang => (
                            <span key={lang} className="badge-tag" style={{ fontSize: '0.68rem' }}>
                              {lang.toUpperCase()}
                            </span>
                          ))}
                          <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
                        </div>
                      </summary>

                      <div className="project-minimal-details">
                        {project.description && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                            {project.description}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
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
                            <span>Open in Studio</span>
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

                        {/* Saved Learnings */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {project.learnings.length === 0 ? (
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 0' }}>
                              No learnings saved yet. Open Code Studio, search any language or concept, and click "Save to Project".
                            </div>
                          ) : (
                            project.learnings.map((entry) => (
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
                            ))
                          )}
                        </div>
                      </div>
                    </details>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;


