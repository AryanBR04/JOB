import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Progress } from "../../components/ui/progress";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { PlayCircle, Clock, Calendar, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAnalysisHistory } from '../../hooks/useAnalysisHistory';
import { usePrepRouter } from '../../context/PrepRouterContext';
import { cn } from '../../lib/utils';
import { getIntegratedResumeData } from '../../utils/resumeIntegration';

const ReadinessCircle: React.FC<{ score: number }> = ({ score }) => {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
                <circle
                    className="text-gray-100"
                    strokeWidth="12"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="80"
                    cy="80"
                />
                <circle
                    className="text-blue-600 transition-all duration-1000 ease-out"
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="80"
                    cy="80"
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-bold text-gray-900">{score}</span>
                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Score</span>
            </div>
        </div>
    );
};

export const DashboardHome: React.FC = () => {
    const { getLatestAnalysis, history } = useAnalysisHistory();
    const { navigate } = usePrepRouter();
    const analysis = getLatestAnalysis();

    // 1. Dynamic Radar Data
    const radarData = useMemo(() => {
        if (!analysis) return [];
        
        // Map top 5 skill categories or top 5 skills
        const categories = Object.keys(analysis.extractedSkills).slice(0, 5);
        return categories.map(cat => {
            const skills = analysis.extractedSkills[cat];
            const mastered = skills.filter(s => analysis.skillConfidenceMap?.[s] === 'know').length;
            const score = skills.length > 0 ? Math.round((mastered / skills.length) * 100) : 0;
            
            // Ensure some minimum score for visibility if it's just extracted
            return {
                subject: cat,
                A: Math.max(score, 20), 
                fullMark: 100
            };
        });
    }, [analysis]);

    // 2. Next Practice Target
    const nextPractice = useMemo(() => {
        if (!analysis) return null;
        const gaps = Object.entries(analysis.skillConfidenceMap || {})
            .filter(([_, level]) => level === 'practice');
        return gaps.length > 0 ? gaps[0][0] : null;
    }, [analysis]);

    // 3. Combined Progress (Skills + Checklist)
    const overallProgress = useMemo(() => {
        if (!analysis) return 0;
        
        // Skills
        const skills = Object.values(analysis.skillConfidenceMap || {});
        const masteredSkills = skills.filter(s => s === 'know').length;
        
        // Checklist
        const checklistItems = Object.values(analysis.checklist).flat();
        const completedItems = analysis.completedChecklistItems?.length || 0;
        
        const total = skills.length + checklistItems.length;
        const completed = masteredSkills + completedItems;
        
        return total > 0 ? Math.round((completed / total) * 100) : 0;
    }, [analysis]);

    // 4. Specific Skill Mastery (for the 'Continue Prep' card)
    const skillMasteryPercent = useMemo(() => {
        if (!analysis) return 0;
        const skills = Object.values(analysis.skillConfidenceMap || {});
        const mastered = skills.filter(s => s === 'know').length;
        return skills.length > 0 ? Math.round((mastered / skills.length) * 100) : 0;
    }, [analysis]);

    const integratedResume = useMemo(() => getIntegratedResumeData(), []);

    if (!analysis) {
        if (integratedResume) {
            return (
                <div className="space-y-6 animate-in fade-in duration-700">
                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Placement Dashboard</h1>
                            <p className="text-gray-500">Analysis based on your uploaded resume: <strong>{integratedResume.name}</strong></p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="flex flex-col items-center justify-center py-8 border-none shadow-sm bg-white">
                            <CardHeader className="pb-2 text-center">
                                <CardTitle>Profile Readiness</CardTitle>
                                <CardDescription>General ATS compatibility</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ReadinessCircle score={75} />
                                <div className="flex items-center gap-2 mt-6 text-sm font-medium text-blue-600 bg-blue-50 px-4 py-2 rounded-full">
                                    <Sparkles size={16} /> 
                                    Resume Found: {integratedResume.skills.length} Skills Detected
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-white">
                            <CardHeader>
                                <CardTitle>Next Step</CardTitle>
                                <CardDescription>Match your resume with a Job Description</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center py-10 space-y-4">
                                <p className="text-gray-500 text-center max-w-sm">To generate a specific practice checklist and assessment, match your resume against a target JD.</p>
                                <button 
                                    onClick={() => navigate('analyze')}
                                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg"
                                >
                                    Match with JD
                                </button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                <div className="bg-blue-50 p-6 rounded-full">
                    <Sparkles size={48} className="text-blue-600" />
                </div>
                <div className="max-w-md">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">No Resume Found</h2>
                    <p className="text-gray-500">Go to your <strong>Profile</strong> to upload a resume or use the <strong>Resume Builder</strong> to get started.</p>
                </div>
                <button 
                    onClick={() => window.location.hash = '#/dashboard/profile'}
                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
                >
                    Upload Resume <ArrowRight size={20} />
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Placement Dashboard</h1>
                    <p className="text-gray-500">Tracking your readiness for <strong>{analysis.company}</strong></p>
                </div>
                <div className="text-right hidden md:block">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Target Role</div>
                    <div className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{analysis.role}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Overall Readiness */}
                <Card className="flex flex-col items-center justify-center py-8 border-none shadow-sm bg-white">
                    <CardHeader className="pb-2 text-center">
                        <CardTitle>Overall Readiness</CardTitle>
                        <CardDescription>Based on your latest profile analysis</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ReadinessCircle score={analysis.readinessScore || 0} />
                        <div className="flex items-center gap-2 mt-6 text-sm font-medium text-green-600 bg-green-50 px-4 py-2 rounded-full">
                            <CheckCircle2 size={16} /> 
                            {analysis.readinessScore > 70 ? 'Ready for Interviews' : 'Preparation Recommended'}
                        </div>
                    </CardContent>
                </Card>

                {/* Skill Radar */}
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader>
                        <CardTitle>Skill Breakdown</CardTitle>
                        <CardDescription>Mastery across analyzed categories</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="#f3f4f6" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name="Mastery"
                                    dataKey="A"
                                    stroke="#2563eb"
                                    strokeWidth={3}
                                    fill="#2563eb"
                                    fillOpacity={0.2}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Next Step Practice */}
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader>
                        <CardTitle>Continue Prep</CardTitle>
                        <CardDescription>Focused on your identified skill gaps</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {nextPractice ? (
                            <>
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h4 className="font-bold text-xl text-gray-900 capitalize">{nextPractice}</h4>
                                        <p className="text-sm text-gray-500">Identified as a "Practice" area</p>
                                    </div>
                                    <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-100 cursor-pointer hover:scale-105 transition-transform" onClick={() => navigate('resources')}>
                                        <PlayCircle className="text-white h-8 w-8" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-400">
                                        <span>Mastery Progress</span>
                                        <span className="text-blue-600">{skillMasteryPercent}%</span>
                                    </div>
                                    <Progress value={skillMasteryPercent} className="h-3 bg-gray-50" />
                                </div>
                            </>
                        ) : (
                            <div className="py-6 text-center text-gray-400 italic">No practice gaps found. You're all set!</div>
                        )}
                        <button 
                            onClick={() => navigate('practice')}
                            className="w-full mt-8 bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-xl transition-all shadow-md"
                        >
                            Open Practice IDE
                        </button>
                    </CardContent>
                </Card>

                {/* Goals & Progress */}
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader>
                        <CardTitle>Total Preparation Mastery</CardTitle>
                        <CardDescription>Aggregate of skills & tasks completed</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-end mb-3">
                                    <span className="text-sm font-bold text-gray-600 uppercase tracking-widest">Global Completion</span>
                                    <span className="text-3xl font-black text-gray-900">{overallProgress}%</span>
                                </div>
                                <Progress value={overallProgress} className="h-3 bg-gray-50" />
                            </div>

                            <div className="pt-4 border-t border-gray-50">
                                <p className="text-xs text-gray-400 mb-4 font-bold uppercase tracking-widest">Quick Navigation</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <QuickNavButton label="Assessments" onClick={() => navigate('assessments')} />
                                    <QuickNavButton label="Resources" onClick={() => navigate('resources')} />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
};

const QuickNavButton: React.FC<{ label: string, onClick: () => void }> = ({ label, onClick }) => (
    <button 
        onClick={onClick}
        className="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-100 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-blue-200 hover:text-blue-600 transition-all"
    >
        {label}
    </button>
);
