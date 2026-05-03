import React, { useState, useRef } from 'react';
import { AppNavigation } from '../components/Layout/AppNavigation';
import { ResumeForm } from '../components/Resume/ResumeForm';
import { ResumePreview } from '../components/Resume/ResumePreview';
import { ATSScoreMeter } from '../components/Resume/ATSScoreMeter';
import { TemplateSelector } from '../components/Resume/TemplateSelector';
import { Download } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

import { useResume } from '../context/ResumeContext';
import { useATSScore } from '../hooks/useATSScore';

export const BuilderPage: React.FC = () => {
    const { resumeData } = useResume();
    const analysis = useATSScore(resumeData);
    const [isMobilePreview, setIsMobilePreview] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef,
        documentTitle: `Resume_${resumeData.personalInfo.fullName || 'Draft'}`,
        pageStyle: `
            @media print {
                @page { margin: 10mm; size: A4; }
                body { margin: 0; padding: 0; background: white !important; }
                #resume-preview { 
                    display: block !important; 
                    width: 210mm !important; 
                    height: 297mm !important; 
                    transform: none !important; 
                    margin: 0 !important;
                    padding-top: 15mm !important;
                    box-shadow: none !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                #resume-header { display: block !important; visibility: visible !important; }
                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                .no-print { display: none !important; }
            }
        `
    });

    return (
        <div className="h-screen flex flex-col bg-gray-50 font-sans overflow-hidden relative">
            <style>
                {`
                /* Native Responsive CSS for the Split Screen Toggle */
                @media (max-width: 767px) {
                    .mobile-hide-form .resume-form-panel { display: none !important; }
                    .mobile-hide-preview .resume-preview-panel { display: none !important; }
                }
                @media (min-width: 768px) {
                    .resume-form-panel { width: 45% !important; display: block !important; }
                    .resume-preview-panel { display: flex !important; }
                }
                `}
            </style>
            <AppNavigation />

            <div className={`flex-1 flex overflow-hidden w-full relative ${isMobilePreview ? 'mobile-hide-form' : 'mobile-hide-preview'}`}>
                {/* Left: Form */}
                <div className="resume-form-panel w-full bg-white border-r border-gray-200 h-full overflow-y-auto p-6 scrollbar-thin">
                    <div className="max-w-xl mx-auto pb-20 md:pb-0">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Resume Details</h2>
                            <p className="text-gray-500">Fill in your information below.</p>
                        </div>

                        <TemplateSelector />
                        <ATSScoreMeter score={analysis.score} suggestions={analysis.suggestions} />

                        <ResumeForm />
                    </div>
                </div>

                {/* Right: Preview */}
                <div className="resume-preview-panel flex-1 bg-gray-100 p-4 md:p-8 h-full overflow-y-auto flex-col items-center pb-24 md:pb-8 flex">
                    {/* Download Button */}
                    <div className="no-print w-full max-w-[210mm] mb-3 flex justify-end">
                        <button
                            onClick={() => handlePrint()}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg shadow transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Download PDF
                        </button>
                    </div>
                    <div className="resume-preview-wrapper w-full max-w-[210mm] flex justify-center" ref={contentRef}>
                        <ResumePreview />
                    </div>
                </div>
                
                {/* Floating Mobile Toggle Button */}
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] md:hidden no-print">
                    <button
                        onClick={() => setIsMobilePreview(!isMobilePreview)}
                        className="flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-full shadow-2xl transition-all border border-teal-500"
                    >
                        {isMobilePreview ? '✏️ Back to Edit' : '👁️ View Preview'}
                    </button>
                </div>
            </div>
        </div>
    );
};
