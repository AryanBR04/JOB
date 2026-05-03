import { useMemo } from 'react';
import type { ResumeData } from '../types/resume';

interface ATSAnalysis {
    score: number;
    suggestions: string[];
}

export const useATSScore = (data: ResumeData): ATSAnalysis => {
    return useMemo(() => {
        let score = 0;
        const suggestions: string[] = [];

        // 1. Contact Info (+10)
        const hasName = data.personalInfo.fullName?.trim();
        const hasEmail = data.personalInfo.email?.trim();
        if (hasName && hasEmail) {
            score += 10;
        } else {
            suggestions.push("Add both your full name and professional email (+10)");
        }

        // 2. Professional Links (+10)
        const hasLinkedIn = data.personalInfo.linkedin?.trim();
        const hasGithub = data.personalInfo.github?.trim();
        if (hasLinkedIn || hasGithub) {
            score += 10;
        } else {
            suggestions.push("Add a LinkedIn or GitHub profile link (+10)");
        }

        // 3. Summary Length (+10)
        const summaryWords = data.summary ? data.summary.trim().split(/\s+/).filter(w => w.length > 0).length : 0;
        if (summaryWords >= 40 && summaryWords <= 120) {
            score += 10;
        } else {
            suggestions.push("Expand summary to 40-120 words (+10)");
        }

        // 4. Experience (+15)
        if (data.experience.length >= 1) {
            score += 15;
        } else {
            suggestions.push("Add internship or work experience (+15)");
        }

        // 5. Projects (+15)
        if (data.projects.length >= 1) {
            score += 15;
        } else {
            suggestions.push("Add at least 1 project to showcase your skills (+15)");
        }

        // 6. Skills (+10)
        const skillCount = (data.skills?.technical?.length || 0) + 
                           (data.skills?.soft?.length || 0) + 
                           (data.skills?.tools?.length || 0);
        if (skillCount >= 8) {
            score += 10;
        } else {
            suggestions.push(`Add more skills (Target 8+, Current: ${skillCount}) (+10)`);
        }

        // 7. Education (+10)
        const hasEducation = data.education.length > 0;
        const educationComplete = hasEducation && data.education.some(edu =>
            edu.school.trim() && edu.degree.trim() && edu.year.trim()
        );
        if (educationComplete) {
            score += 10;
        } else {
            suggestions.push("Add complete education details (School, Degree, Year) (+10)");
        }

        // Combine all descriptions for keyword analysis
        const allDescriptions = [
            ...data.experience.map(e => e.description),
            ...data.projects.map(p => p.description)
        ].join(' ');

        // 8. Quantifiable Impact (+10)
        // Matches percentages (%), dollar signs ($), multipliers (10x, 50k), or plus signs (+)
        const impactRegex = /%|\$|\b\d+x\b|\b\d+k\b|\+/i;
        if (impactRegex.test(allDescriptions)) {
            score += 10;
        } else if (data.experience.length > 0 || data.projects.length > 0) {
            suggestions.push("Add measurable impact like %, $, or multipliers (e.g. 10x) (+10)");
        }

        // 9. Action Verbs (+10)
        const actionVerbs = ['developed', 'architected', 'led', 'optimized', 'built', 'implemented', 'created', 'designed', 'managed', 'spearheaded', 'engineered'];
        const hasActionVerbs = actionVerbs.some(verb => new RegExp(`\\b${verb}\\b`, 'i').test(allDescriptions));
        
        if (hasActionVerbs) {
            score += 10;
        } else if (data.experience.length > 0 || data.projects.length > 0) {
            suggestions.push("Start bullet points with strong action verbs like 'Developed' or 'Led' (+10)");
        }

        // Cap at 100 just in case
        score = Math.min(score, 100);

        // Return top 3 suggestions
        return {
            score,
            suggestions: suggestions.slice(0, 3)
        };
    }, [data]);
};
