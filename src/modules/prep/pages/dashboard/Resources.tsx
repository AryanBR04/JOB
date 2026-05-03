import React, { useState, useMemo } from 'react';
import { useAnalysisHistory } from '../../hooks/useAnalysisHistory';
import { usePrepRouter } from '../../context/PrepRouterContext';
import { 
    BookOpen, 
    CheckCircle, 
    ExternalLink, 
    ArrowRight,
    Youtube,
    FileText,
    Github,
    Code
} from 'lucide-react';
import { cn } from '../../lib/utils';

// Resource Database
const RESOURCE_DB: Record<string, { type: 'video' | 'doc' | 'repo', title: string, url: string, provider: string }> = {
    'react': { type: 'doc', title: 'React: Thinking in React', url: 'https://react.dev/learn/thinking-in-react', provider: 'Meta' },
    'javascript': { type: 'video', title: 'JS: The Hard Parts', url: 'https://www.youtube.com/watch?v=hO7mzO83N_M', provider: 'Frontend Masters' },
    'typescript': { type: 'doc', title: 'TS Handbook: The Basics', url: 'https://www.typescriptlang.org/docs/handbook/2/basic-types.html', provider: 'Microsoft' },
    'node.js': { type: 'video', title: 'Node.js: The Complete Guide', url: 'https://www.youtube.com/watch?v=TlB_eWDSMt4', provider: 'Academind' },
    'python': { type: 'video', title: 'Python for Data Science', url: 'https://www.youtube.com/watch?v=rfscVS0vtbw', provider: 'freeCodeCamp' },
    'sql': { type: 'video', title: 'SQL Beginner to Pro', url: 'https://www.youtube.com/watch?v=HXV3zeQKqGY', provider: 'Programming with Mosh' },
    'docker': { type: 'video', title: 'Docker in 100 Seconds', url: 'https://www.youtube.com/watch?v=gAkwW2tuIqE', provider: 'Fireship' },
    'aws': { type: 'video', title: 'AWS Cloud Practitioner Full Course', url: 'https://www.youtube.com/watch?v=SOTamWNgDKc', provider: 'freeCodeCamp' },
    'system design': { type: 'repo', title: 'The System Design Primer', url: 'https://github.com/donnemartin/system-design-primer', provider: 'GitHub' },
    'dsa': { type: 'video', title: 'DSA Complete Roadmap 2024', url: 'https://www.youtube.com/watch?v=EAR7De6G66E', provider: 'Striver' },
    'java': { type: 'video', title: 'Java: Object Oriented Programming', url: 'https://www.youtube.com/watch?v=GoXwIVyNvX0', provider: 'freeCodeCamp' },
    'cpp': { type: 'video', title: 'C++ Full Course for Beginners', url: 'https://www.youtube.com/watch?v=vLnPwxZdW4Y', provider: 'freeCodeCamp' },
    'c': { type: 'video', title: 'C Programming Tutorial', url: 'https://www.youtube.com/watch?v=KJgsSFOSQv0', provider: 'freeCodeCamp' }
};

const DEFAULT_RESOURCES = [
    { type: 'video', title: 'General Interview Tips', url: 'https://youtube.com', provider: 'CareerCup' },
    { type: 'doc', title: 'The STAR Method Guide', url: 'https://indeed.com', provider: 'Indeed' },
    { type: 'repo', title: 'Coding Interview University', url: 'https://github.com/jwasham/coding-interview-university', provider: 'GitHub' }
];

export const Resources: React.FC = () => {
    const { getLatestAnalysis, updateAnalysis } = useAnalysisHistory();
    const { navigate } = usePrepRouter();
    const analysis = getLatestAnalysis();

    // 1. Identify Skill Gaps
    const gaps = useMemo(() => {
        if (!analysis) return [];
        return Object.entries(analysis.skillConfidenceMap || {})
            .filter(([_, level]) => level === 'practice')
            .map(([skill]) => skill);
    }, [analysis]);

    const masteredCount = useMemo(() => {
        if (!analysis) return 0;
        return Object.values(analysis.skillConfidenceMap || {})
            .filter(level => level === 'know').length;
    }, [analysis]);

    const totalSkills = analysis ? Object.keys(analysis.skillConfidenceMap || {}).length : 0;
    const progressPercent = totalSkills > 0 ? Math.round((masteredCount / totalSkills) * 100) : 0;

    // 2. Map Gaps to Resources
    const recommendedResources = useMemo(() => {
        const items = gaps.flatMap(gap => {
            // Senior Developer Fix: Use Regex for exact word matching
            // This prevents "java" from matching "javascript"
            const key = Object.keys(RESOURCE_DB).find(k => {
                const searchPattern = new RegExp(`\\b${k.replace('.', '\\.')}\\b`, 'i');
                return searchPattern.test(gap) || gap.toLowerCase() === k.toLowerCase();
            });
            return key ? [{ ...RESOURCE_DB[key], skill: gap }] : [];
        });
        
        // Ensure uniqueness and add defaults if needed
        const unique = Array.from(new Set(items.map(i => i.title)))
            .map(title => items.find(i => i.title === title)!);
            
        return unique.length > 0 ? unique : DEFAULT_RESOURCES.map(r => ({ ...r, skill: 'General' }));
    }, [gaps]);

    const handleMarkAsMastered = (skill: string) => {
        if (!analysis) return;
        const newMap = { ...analysis.skillConfidenceMap, [skill]: 'know' as const };
        
        // Senior Developer logic: Increment global readiness score as user masters skills
        const currentScore = analysis.readinessScore || 0;
        const newScore = Math.min(currentScore + 3, 100);
        
        updateAnalysis(analysis.id, { 
            skillConfidenceMap: newMap,
            readinessScore: newScore 
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header with Stats */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <BookOpen className="text-blue-600" /> Learning Resources
                    </h1>
                    <p className="text-gray-500">
                        Tailored roadmap based on your <strong>{analysis?.role || 'Career'}</strong> analysis for <strong>{analysis?.company || 'Top Tech Companies'}</strong>.
                    </p>
                </div>

                <div className="flex gap-4">
                    <div className="bg-blue-50 px-6 py-4 rounded-xl border border-blue-100 text-center">
                        <div className="text-2xl font-black text-blue-700">{progressPercent}%</div>
                        <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">Mastery</div>
                    </div>
                    <div className="bg-orange-50 px-6 py-4 rounded-xl border border-orange-100 text-center">
                        <div className="text-2xl font-black text-orange-700">{gaps.length}</div>
                        <div className="text-xs font-bold text-orange-600 uppercase tracking-wider">Gaps Found</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Recommended Resources */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <SparklesIcon className="text-blue-500" /> Personalized Recommendations
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recommendedResources.map((res, idx) => (
                            <ResourceCard key={idx} resource={res} />
                        ))}
                    </div>
                </div>

                {/* Right: Skill Gap Checklist */}
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-900">Skill Checklist</h3>
                    <div className="bg-gray-900 rounded-2xl p-6 text-white space-y-4">
                        {gaps.length > 0 ? (
                            gaps.map((skill, idx) => (
                                <div key={idx} className="flex items-center justify-between group">
                                    <span className="capitalize text-gray-300 font-medium">{skill}</span>
                                    <button 
                                        onClick={() => handleMarkAsMastered(skill)}
                                        className="text-gray-500 hover:text-green-400 transition-colors"
                                        title="Mark as Mastered"
                                    >
                                        <CheckCircle size={20} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <div className="bg-green-500/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="text-green-400" />
                                </div>
                                <p className="text-sm text-gray-400">All identified skills mastered!</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-indigo-600 rounded-2xl p-6 text-white overflow-hidden relative group">
                        <div className="relative z-10">
                            <h4 className="font-bold mb-2">Ready to Test?</h4>
                            <p className="text-xs text-indigo-100 mb-4">Try a simulated assessment to verify your mastery.</p>
                            <button 
                                onClick={() => navigate('assessments')}
                                className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-indigo-50 transition-colors"
                            >
                                Go to Assessments <ArrowRight size={14} />
                            </button>
                        </div>
                        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <ClipboardCheckIcon size={120} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Sub-components ---

const ResourceCard: React.FC<{ resource: any }> = ({ resource }) => {
    const Icon = resource.type === 'video' ? Youtube : resource.type === 'repo' ? Github : FileText;
    
    return (
        <a 
            href={resource.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block bg-white p-5 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group"
        >
            <div className="flex items-start justify-between mb-4">
                <div className={cn(
                    "p-2 rounded-lg",
                    resource.type === 'video' ? "bg-red-50 text-red-500" :
                    resource.type === 'repo' ? "bg-gray-50 text-gray-700" :
                    "bg-blue-50 text-blue-500"
                )}>
                    <Icon size={20} />
                </div>
                <ExternalLink size={14} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
            </div>
            
            <div className="space-y-1">
                <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{resource.skill}</div>
                <h4 className="font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">{resource.title}</h4>
                <p className="text-xs text-gray-500">{resource.provider}</p>
            </div>
        </a>
    );
};

// Icons (Tailwind/Lucide missing shims)
const SparklesIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
        <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
    </svg>
);

const ClipboardCheckIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>
    </svg>
);
