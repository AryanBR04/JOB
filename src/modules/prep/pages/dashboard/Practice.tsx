import React, { useState } from 'react';
import { useAnalysisHistory } from '../../hooks/useAnalysisHistory';
import { usePrepRouter } from '../../context/PrepRouterContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { CheckCircle, PlayCircle, BookOpen, AlertCircle, ChevronRight, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Practice: React.FC = () => {
    const { getLatestAnalysis, updateAnalysis } = useAnalysisHistory();
    const { navigate } = usePrepRouter();
    const analysis = getLatestAnalysis();

    const [activeTab, setActiveTab] = useState<'bootcamp' | 'interview' | 'skills'>('bootcamp');
    const [currentFlashcard, setCurrentFlashcard] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);

    if (!analysis) {
        return (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">No Active Analysis</h2>
                <p className="text-gray-500 mb-6">Analyze a Job Description first to generate your custom practice hub.</p>
                <button
                    onClick={() => navigate('analyze')}
                    className="px-6 py-2 bg-primary text-white rounded-md hover:bg-indigo-700 transition"
                >
                    Start New Analysis
                </button>
            </div>
        );
    }

    const completedDays = analysis.completedDays || [];
    const masteredQuestions = analysis.masteredQuestions || [];

    const toggleDay = (dayIndex: number) => {
        const isCompleted = completedDays.includes(dayIndex);
        const newCompleted = isCompleted 
            ? completedDays.filter(d => d !== dayIndex)
            : [...completedDays, dayIndex];
            
        // Gamification: Reward points
        const scoreDelta = isCompleted ? -1 : 1;
        const newScore = Math.min(Math.max(analysis.readinessScore + scoreDelta, 0), 100);

        updateAnalysis(analysis.id, { 
            completedDays: newCompleted,
            readinessScore: newScore
        });
    };

    const toggleQuestionMastery = (qIndex: number, mastered: boolean) => {
        const isCurrentlyMastered = masteredQuestions.includes(qIndex);
        let newMastered = [...masteredQuestions];
        
        if (mastered && !isCurrentlyMastered) newMastered.push(qIndex);
        if (!mastered && isCurrentlyMastered) newMastered = newMastered.filter(q => q !== qIndex);

        updateAnalysis(analysis.id, { masteredQuestions: newMastered });
        
        // Auto-advance flashcard if marked as mastered
        if (mastered && currentFlashcard < analysis.questions.length - 1) {
            setTimeout(() => {
                setShowAnswer(false);
                setCurrentFlashcard(prev => prev + 1);
            }, 500);
        }
    };

    const weakSkills = Object.entries(analysis.skillConfidenceMap || {})
        .filter(([_, status]) => status === 'practice')
        .map(([skill]) => skill);

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
            {/* Context Header */}
            <div className="bg-gradient-to-r from-indigo-900 to-primary text-white p-8 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-indigo-200 text-sm font-semibold tracking-wider uppercase mb-1">Active Target</p>
                    <h1 className="text-3xl font-bold font-serif mb-2">{analysis.role} @ {analysis.company}</h1>
                    <div className="flex items-center gap-4 mt-4">
                        <div className="bg-white/20 px-3 py-1 rounded-full text-sm flex items-center gap-2 backdrop-blur-sm">
                            <CheckCircle size={16} /> {completedDays.length}/{analysis.plan.length} Days Complete
                        </div>
                        <div className="bg-white/20 px-3 py-1 rounded-full text-sm flex items-center gap-2 backdrop-blur-sm">
                            <PlayCircle size={16} /> {masteredQuestions.length}/{analysis.questions.length} Questions Mastered
                        </div>
                    </div>
                </div>
                <div className="absolute right-0 top-0 w-64 h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
                <button
                    onClick={() => setActiveTab('bootcamp')}
                    className={cn(
                        "flex-1 py-3 text-sm font-semibold rounded-lg transition-all",
                        activeTab === 'bootcamp' ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                    )}
                >
                    7-Day Bootcamp
                </button>
                <button
                    onClick={() => setActiveTab('interview')}
                    className={cn(
                        "flex-1 py-3 text-sm font-semibold rounded-lg transition-all",
                        activeTab === 'interview' ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                    )}
                >
                    Mock Interview
                </button>
                <button
                    onClick={() => setActiveTab('skills')}
                    className={cn(
                        "flex-1 py-3 text-sm font-semibold rounded-lg transition-all",
                        activeTab === 'skills' ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                    )}
                >
                    Weak Skill Drills
                </button>
            </div>

            {/* TAB CONTENT: 7-DAY BOOTCAMP */}
            {activeTab === 'bootcamp' && (
                <div className="space-y-4 mt-8">
                    {analysis.plan.map((day, index) => {
                        const isDone = completedDays.includes(index);
                        return (
                            <Card key={index} className={cn("transition-all border-l-4", isDone ? "border-l-green-500 bg-green-50/30 opacity-75" : "border-l-primary hover:shadow-md")}>
                                <div className="flex items-center p-6 gap-6">
                                    <div className="shrink-0">
                                        <button 
                                            onClick={() => toggleDay(index)}
                                            className={cn(
                                                "h-12 w-12 rounded-full flex items-center justify-center border-2 transition-colors",
                                                isDone ? "bg-green-500 border-green-500 text-white" : "border-gray-300 text-gray-300 hover:border-primary hover:text-primary"
                                            )}
                                        >
                                            {isDone ? <Check size={24} /> : <span className="font-bold text-lg">{index + 1}</span>}
                                        </button>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={cn("text-lg font-bold", isDone ? "text-gray-500 line-through" : "text-gray-900")}>
                                            {day.day}: {day.title}
                                        </h3>
                                        <p className="text-gray-600 mt-1">{day.desc}</p>
                                    </div>
                                    <div className="shrink-0 hidden md:block">
                                        <button 
                                            onClick={() => toggleDay(index)}
                                            className={cn("px-4 py-2 rounded font-medium text-sm transition-colors", isDone ? "bg-gray-200 text-gray-600" : "bg-primary text-white hover:bg-indigo-700")}
                                        >
                                            {isDone ? 'Undo' : 'Mark Complete'}
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* TAB CONTENT: MOCK INTERVIEW FLASHCARDS */}
            {activeTab === 'interview' && (
                <div className="mt-8">
                    {analysis.questions.length > 0 ? (
                        <div className="max-w-3xl mx-auto">
                            <div className="mb-4 flex justify-between items-center text-sm font-medium text-gray-500">
                                <span>Question {currentFlashcard + 1} of {analysis.questions.length}</span>
                                <span className="text-green-600">{masteredQuestions.length} Mastered</span>
                            </div>
                            
                            <Card className="min-h-[300px] flex flex-col justify-center text-center p-8 border-2 border-indigo-100 shadow-xl relative bg-gradient-to-b from-white to-indigo-50/30">
                                {masteredQuestions.includes(currentFlashcard) && (
                                    <div className="absolute top-4 right-4 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                        <Check size={14} /> Mastered
                                    </div>
                                )}
                                <h2 className="text-2xl font-bold text-gray-900 mb-8 leading-relaxed">
                                    "{analysis.questions[currentFlashcard]}"
                                </h2>
                                
                                <div className={cn("transition-all duration-500 overflow-hidden", showAnswer ? "max-h-40 opacity-100" : "max-h-0 opacity-0")}>
                                    <p className="text-gray-600 italic bg-white p-4 rounded border border-gray-200 mb-6 text-sm">
                                        (Self-Assessment: Did you answer confidently and mention key technical terms clearly? Compare your verbal answer to ideal best practices.)
                                    </p>
                                </div>

                                <div className="mt-auto">
                                    {!showAnswer ? (
                                        <button 
                                            onClick={() => setShowAnswer(true)}
                                            className="px-8 py-3 bg-gray-900 text-white font-bold rounded-full hover:bg-gray-800 transition shadow-lg"
                                        >
                                            Show Answer Hints
                                        </button>
                                    ) : (
                                        <div className="flex justify-center gap-4">
                                            <button 
                                                onClick={() => toggleQuestionMastery(currentFlashcard, false)}
                                                className="px-6 py-2 border-2 border-amber-500 text-amber-700 font-bold rounded-full hover:bg-amber-50 transition"
                                            >
                                                Needs Work
                                            </button>
                                            <button 
                                                onClick={() => toggleQuestionMastery(currentFlashcard, true)}
                                                className="px-6 py-2 bg-green-500 text-white font-bold rounded-full hover:bg-green-600 transition shadow-lg flex items-center gap-2"
                                            >
                                                <Check size={18} /> I Nailed This
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            <div className="flex justify-between mt-6">
                                <button 
                                    disabled={currentFlashcard === 0}
                                    onClick={() => { setCurrentFlashcard(prev => prev - 1); setShowAnswer(false); }}
                                    className="px-4 py-2 text-gray-600 font-medium hover:text-gray-900 disabled:opacity-50"
                                >
                                    &larr; Previous
                                </button>
                                <button 
                                    disabled={currentFlashcard === analysis.questions.length - 1}
                                    onClick={() => { setCurrentFlashcard(prev => prev + 1); setShowAnswer(false); }}
                                    className="px-4 py-2 text-gray-600 font-medium hover:text-gray-900 disabled:opacity-50"
                                >
                                    Next &rarr;
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-10">No questions available for this role.</p>
                    )}
                </div>
            )}

            {/* TAB CONTENT: WEAK SKILLS */}
            {activeTab === 'skills' && (
                <div className="mt-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-amber-700">
                                <AlertCircle size={20} /> Areas Needing Practice
                            </CardTitle>
                            <CardDescription>These are the skills you marked as weak during the analysis phase.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {weakSkills.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {weakSkills.map((skill, idx) => (
                                        <a 
                                            key={idx}
                                            href={`https://www.google.com/search?q=${encodeURIComponent(skill + ' interview questions and answers')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-4 border border-gray-200 rounded-lg hover:border-amber-400 hover:shadow-md transition group bg-white flex justify-between items-center"
                                        >
                                            <span className="font-semibold text-gray-800">{skill}</span>
                                            <ChevronRight size={18} className="text-gray-400 group-hover:text-amber-500 transition-colors" />
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <CheckCircle className="mx-auto h-12 w-12 text-green-400 mb-3" />
                                    <p className="text-gray-600 font-medium">You have no weak skills marked!</p>
                                    <p className="text-gray-500 text-sm mt-1">Go to the Analysis page to toggle skills to "practice" mode.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};
