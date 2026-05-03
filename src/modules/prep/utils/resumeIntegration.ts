
export interface ProfileResumeData {
    score: number;
    skills: string[];
    fileName: string;
    timestamp: string;
}

export const getProfileResume = (): ProfileResumeData | null => {
    const raw = localStorage.getItem('kcarrier_profile_analysis');
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
};

export const getResumeBuilderData = () => {
    const raw = localStorage.getItem('resumeBuilderData');
    if (!raw) return null;
    try {
        const data = JSON.parse(raw);
        // Extract flat skills from the builder object
        const technical = data.skills?.technical || [];
        const soft = data.skills?.soft || [];
        const tools = data.skills?.tools || [];
        return {
            skills: [...technical, ...soft, ...tools],
            name: data.personalInfo?.fullName || 'Builder Resume'
        };
    } catch (e) {
        return null;
    }
};

export const getIntegratedResumeData = () => {
    // Priority 1: Profile Uploaded Resume
    const profile = getProfileResume();
    if (profile) {
        return {
            skills: profile.skills,
            source: 'profile',
            name: profile.fileName
        };
    }

    // Priority 2: Resume Builder Data
    const builder = getResumeBuilderData();
    if (builder && builder.skills.length > 0) {
        return {
            skills: builder.skills,
            source: 'builder',
            name: builder.name
        };
    }

    return null;
};
