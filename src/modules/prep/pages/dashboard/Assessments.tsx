import React, { useState, useEffect, useRef } from 'react';
import { useAnalysisHistory } from '../../hooks/useAnalysisHistory';
import Editor from '@monaco-editor/react';
import { Play, RotateCcw, Clock, Terminal, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

// Standard Piston API language versions
const LANGUAGE_MAP: Record<string, { pistonName: string, version: string, defaultCode: string, judge0Id: number }> = {
    'javascript': { pistonName: 'javascript', version: '18.15.0', defaultCode: 'console.log("Hello Placement Prep!");', judge0Id: 63 },
    'python': { pistonName: 'python', version: '3.10.0', defaultCode: 'print("Hello Placement Prep!")', judge0Id: 71 },
    'java': { pistonName: 'java', version: '15.0.2', defaultCode: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello Placement Prep!");\n    }\n}', judge0Id: 62 },
    'cpp': { pistonName: 'cpp', version: '10.2.0', defaultCode: '#include <iostream>\n\nint main() {\n    std::cout << "Hello Placement Prep!" << std::endl;\n    return 0;\n}', judge0Id: 54 }
};

export const Assessments: React.FC = () => {
    const { getLatestAnalysis } = useAnalysisHistory();
    const analysis = getLatestAnalysis();

    // 1. Language Detection
    const [language, setLanguage] = useState('javascript');
    
    useEffect(() => {
        if (analysis) {
            const allSkills = Object.values(analysis.extractedSkills).flat().map(s => s.toLowerCase());
            if (allSkills.includes('python')) setLanguage('python');
            else if (allSkills.includes('java')) setLanguage('java');
            else if (allSkills.includes('c++') || allSkills.includes('cpp')) setLanguage('cpp');
            else setLanguage('javascript');
        }
    }, [analysis]);

    // 2. State
    const [code, setCode] = useState(LANGUAGE_MAP['javascript'].defaultCode);
    const [output, setOutput] = useState<string>('Console output will appear here...');
    const [isRunning, setIsRunning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(45 * 60); // 45 minutes

    const [isPyodideLoading, setIsPyodideLoading] = useState(false);

    // Update default code when language changes
    useEffect(() => {
        setCode(LANGUAGE_MAP[language].defaultCode);
    }, [language]);

    // 3. Timer Logic
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // 3. Pre-load Pyodide for Python
    useEffect(() => {
        if (language === 'python' && !(window as any).loadPyodide) {
            setIsPyodideLoading(true);
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js";
            script.async = true;
            script.onload = () => setIsPyodideLoading(false);
            script.onerror = () => {
                setIsPyodideLoading(false);
                setOutput("Error: Failed to load Python engine from CDN.");
            };
            document.head.appendChild(script);
        }
    }, [language]);

    const pyodideRef = useRef<any>(null);

    // 4. Execution Engine (Local-First)
    const runCode = async () => {
        setIsRunning(true);
        setOutput('Running code locally...');

        if (language === 'javascript') {
            const logs: string[] = [];
            const originalLog = console.log;
            
            // Override console.log
            console.log = (...args) => {
                const message = args.map(a => {
                    try {
                        return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a);
                    } catch {
                        return String(a);
                    }
                }).join(' ');
                logs.push(message);
                originalLog(...args);
            };

            try {
                // Execute code
                const runner = new Function(code);
                runner();
                const finalOutput = logs.join('\n');
                setOutput(finalOutput || 'Program executed (no console output).');
            } catch (err: any) {
                setOutput(`Runtime Error: ${err.message}`);
            } finally {
                console.log = originalLog;
                setIsRunning(false);
            }
        } else if (language === 'python') {
            if (isPyodideLoading) {
                setOutput('Python engine is still downloading... Please wait 10 seconds.');
                setIsRunning(false);
                return;
            }

            try {
                if (!(window as any).loadPyodide) {
                    throw new Error("Python engine script not found on the page.");
                }

                if (!pyodideRef.current) {
                    setOutput('Initializing Python... (This may take 10-20 seconds on first run)');
                    pyodideRef.current = await (window as any).loadPyodide({
                        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/"
                    });
                }

                const py = pyodideRef.current;
                let pyOutput = '';
                py.setStdout({ batched: (str: string) => { pyOutput += str + '\n'; } });
                
                await py.runPythonAsync(code);
                setOutput(pyOutput || 'Python execution finished (no output).');
            } catch (err: any) {
                setOutput(`Python Error: ${err.message}`);
            } finally {
                setIsRunning(false);
            }
        } else if (language === 'java' || language === 'cpp') {
            setOutput(`Compiling and running ${language.toUpperCase()} via Judge0...`);
            try {
                const langConfig = LANGUAGE_MAP[language];
                const response = await fetch('https://ce.judge0.com/submissions?base64_encoded=false&wait=true', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        source_code: code,
                        language_id: langConfig.judge0Id
                    })
                });

                const result = await response.json();
                
                if (result.status?.id <= 3) { // Accepted
                    const fullOutput = [
                        result.compile_output,
                        result.stdout,
                        result.stderr
                    ].filter(Boolean).join('\n').trim();

                    setOutput(fullOutput || 'Program executed (no output).');
                } else {
                    const errorOutput = [
                        result.status?.description,
                        result.compile_output,
                        result.stderr,
                        result.message
                    ].filter(Boolean).join('\n').trim();
                    throw new Error(errorOutput || 'Execution failed');
                }
            } catch (err: any) {
                setOutput(`Remote Execution Error: ${err.message}`);
            } finally {
                setIsRunning(false);
            }
        } else {
            setOutput(`Local execution for ${language.toUpperCase()} is restricted.`);
            setIsRunning(false);
        }
    };

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col bg-gray-50 -mt-6 -mx-6">
            {/* Header Toolbar */}
            <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <h1 className="font-bold text-gray-900 flex items-center gap-2">
                        <Terminal size={18} className="text-primary" /> Coding Assessment
                    </h1>
                    <div className="h-6 w-px bg-gray-200"></div>
                    <select 
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="text-sm bg-gray-100 border-none rounded-md px-3 py-1 text-gray-700 font-medium focus:ring-primary"
                    >
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                    </select>
                </div>

                <div className="flex items-center gap-6">
                    <div className={cn(
                        "flex items-center gap-2 font-mono text-lg font-bold px-4 py-1 rounded-md border",
                        timeLeft < 300 ? "text-red-600 bg-red-50 border-red-200 animate-pulse" : "text-indigo-900 bg-indigo-50 border-indigo-100"
                    )}>
                        <Clock size={18} /> {formatTime(timeLeft)}
                    </div>
                    
                    <button
                        onClick={runCode}
                        disabled={isRunning}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2 rounded-md font-bold text-sm transition shadow-sm",
                            isRunning ? "bg-gray-400 text-white cursor-not-allowed" : "bg-green-500 hover:bg-green-600 text-white"
                        )}
                    >
                        {isRunning ? <RotateCcw size={16} className="animate-spin" /> : <Play size={16} />}
                        {isRunning ? 'Running...' : 'Run Code'}
                    </button>
                </div>
            </div>

            {/* Split Screen Workspace */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* Left Panel: Problem Context */}
                <div className="w-1/3 bg-white border-r border-gray-200 overflow-y-auto p-8 relative">
                    {analysis ? (
                        <div className="absolute top-4 right-4 bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                            Custom Challenge
                        </div>
                    ) : (
                        <div className="absolute top-4 right-4 bg-gray-100 text-gray-500 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1">
                            <AlertCircle size={12} /> Fallback Mode
                        </div>
                    )}
                    
                    <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">
                        {analysis ? `Technical Screen: ${analysis.company}` : 'Standard Technical Screen'}
                    </h2>

                    <div className="prose prose-sm text-gray-700 space-y-4">
                        <p>
                            <strong>Target Role:</strong> {analysis ? analysis.role : 'Software Engineer'}
                        </p>
                        <p>
                            Welcome to the assessment environment. This simulated challenge tests your logical reasoning and syntax mastery under pressure.
                        </p>
                        
                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 my-6">
                            <h4 className="font-bold text-amber-900 flex items-center gap-2 mb-2">
                                <CheckCircle size={16} /> Problem Statement
                            </h4>
                            <p className="text-amber-800 text-sm">
                                Write a program that demonstrates your mastery of <strong>{language}</strong>. <br/><br/>
                                As a warm-up, implement a function that takes an array of integers and returns a new array with all duplicate values removed. Print the result to the console.
                            </p>
                        </div>

                        {analysis && (
                            <div className="mt-8 pt-8 border-t border-gray-100">
                                <h4 className="font-bold text-gray-900 mb-3">Targeted Skills for this Role:</h4>
                                <div className="flex flex-wrap gap-2">
                                    {Object.values(analysis.extractedSkills).flat().slice(0, 8).map((skill, i) => (
                                        <span key={i} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Editor & Console */}
                <div className="w-2/3 flex flex-col">
                    <div className="flex-1 bg-[#1e1e1e] relative">
                        <Editor
                            height="100%"
                            language={language}
                            theme="vs-dark"
                            value={code}
                            onChange={(val) => setCode(val || '')}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                padding: { top: 16 },
                                scrollBeyondLastLine: false,
                            }}
                        />
                    </div>
                    
                    <div className="h-64 bg-[#0d0d0d] border-t-4 border-gray-800 flex flex-col shrink-0">
                        <div className="bg-[#1a1a1a] px-4 py-2 text-xs font-bold tracking-wider text-gray-400 uppercase flex items-center justify-between">
                            <span>Console Output</span>
                            <button onClick={() => setOutput('')} className="hover:text-white transition-colors">Clear</button>
                        </div>
                        <div className="p-4 font-mono text-sm overflow-y-auto flex-1">
                            {output.startsWith('Error') || 
                             output.startsWith('Python Error') || 
                             output.startsWith('Runtime Error') || 
                             output.startsWith('Remote Execution Error') ? (
                                <pre className="text-red-400 whitespace-pre-wrap">{output}</pre>
                            ) : (
                                <pre className="text-green-400 whitespace-pre-wrap">{output}</pre>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
