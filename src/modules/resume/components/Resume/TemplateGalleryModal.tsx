import React from 'react';
import { X } from 'lucide-react';
import { useResume } from '../../context/ResumeContext';
import { useModuleRouter } from '../../context/ModuleRouterContext';

interface Props {
    onClose: () => void;
}

const TEMPLATES = [
    {
        id: 'tech-minimalist',
        name: 'Tech Minimalist',
        description: 'Clean single-column. Perfect for software engineers.',
        template: 'minimal' as const,
        color: '#374151',
        previewBg: '#f9fafb',
        previewAccent: '#374151',
        layout: 'single',
    },
    {
        id: 'modern-split',
        name: 'Modern Split',
        description: 'Two-column with colored sidebar for skills & contact.',
        template: 'modern' as const,
        color: '#14b8a6',
        previewBg: '#f0fdfa',
        previewAccent: '#14b8a6',
        layout: 'split',
    },
    {
        id: 'executive-bold',
        name: 'Executive Bold',
        description: 'Strong centered header. Great for senior roles.',
        template: 'classic' as const,
        color: '#1e3a8a',
        previewBg: '#eff6ff',
        previewAccent: '#1e3a8a',
        layout: 'single',
    },
    {
        id: 'creative-grid',
        name: 'Creative Grid',
        description: 'Bold color accent with modern layout. Stand out.',
        template: 'modern' as const,
        color: '#881337',
        previewBg: '#fff1f2',
        previewAccent: '#881337',
        layout: 'split',
    },
    {
        id: 'ats-clean',
        name: 'ATS Clean',
        description: 'Fully ATS-optimized. No columns, max readability.',
        template: 'classic' as const,
        color: '#14532d',
        previewBg: '#f0fdf4',
        previewAccent: '#14532d',
        layout: 'single',
    },
    {
        id: 'fresher-pro',
        name: 'Fresher Pro',
        description: 'Highlights education & projects. Great for students.',
        template: 'minimal' as const,
        color: '#2563eb',
        previewBg: '#eff6ff',
        previewAccent: '#2563eb',
        layout: 'single',
    },
];

const MiniPreview: React.FC<{ accent: string; bg: string; layout: string }> = ({ accent, bg, layout }) => {
    if (layout === 'split') {
        return (
            <div style={{ display: 'flex', width: '100%', height: '100%', background: bg }}>
                <div style={{ width: '32%', background: accent, padding: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.5)', borderRadius: '2px' }} />
                    <div style={{ height: '5px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px', width: '70%' }} />
                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.2)', margin: '2px 0' }} />
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px' }} />
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px', width: '80%' }} />
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px', width: '60%' }} />
                </div>
                <div style={{ flex: 1, padding: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ height: '5px', background: accent, borderRadius: '2px', width: '50%', opacity: 0.7 }} />
                    <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '2px' }} />
                    <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '2px', width: '80%' }} />
                    <div style={{ height: '1px', background: '#e5e7eb', margin: '2px 0' }} />
                    <div style={{ height: '5px', background: accent, borderRadius: '2px', width: '50%', opacity: 0.7 }} />
                    <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '2px' }} />
                    <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '2px', width: '70%' }} />
                </div>
            </div>
        );
    }
    return (
        <div style={{ width: '100%', height: '100%', background: bg, padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ height: '8px', background: accent, borderRadius: '2px', width: '55%', alignSelf: 'center' }} />
            <div style={{ height: '4px', background: '#d1d5db', borderRadius: '2px', width: '70%', alignSelf: 'center' }} />
            <div style={{ height: '1px', background: accent, opacity: 0.4, margin: '3px 0' }} />
            <div style={{ height: '4px', background: accent, borderRadius: '2px', width: '30%', opacity: 0.7 }} />
            <div style={{ height: '3px', background: '#e5e7eb', borderRadius: '2px' }} />
            <div style={{ height: '3px', background: '#e5e7eb', borderRadius: '2px', width: '85%' }} />
            <div style={{ height: '3px', background: '#e5e7eb', borderRadius: '2px', width: '70%' }} />
            <div style={{ height: '1px', background: '#e5e7eb', margin: '2px 0' }} />
            <div style={{ height: '4px', background: accent, borderRadius: '2px', width: '30%', opacity: 0.7 }} />
            <div style={{ height: '3px', background: '#e5e7eb', borderRadius: '2px' }} />
            <div style={{ height: '3px', background: '#e5e7eb', borderRadius: '2px', width: '80%' }} />
        </div>
    );
};

export const TemplateGalleryModal: React.FC<Props> = ({ onClose }) => {
    const { setTemplate, setColor } = useResume();
    const { navigate } = useModuleRouter();

    const handleUseTemplate = (tmpl: typeof TEMPLATES[0]) => {
        setTemplate(tmpl.template);
        setColor(tmpl.color);
        onClose();
        navigate('builder');
    };

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '16px',
                backgroundColor: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(4px)',
            }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div style={{
                background: '#fff', borderRadius: '16px',
                width: '100%', maxWidth: '860px',
                maxHeight: '88vh', display: 'flex', flexDirection: 'column',
                boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
                overflow: 'hidden',
            }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#111827' }}>Choose a Template</h2>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6b7280' }}>Pick a layout — then edit every field to your preference</p>
                    </div>
                    <button onClick={onClose} style={{ border: 'none', background: '#f3f4f6', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                        <X size={16} />
                    </button>
                </div>

                {/* Grid — 3 columns, always */}
                <div style={{ overflowY: 'auto', padding: '24px 28px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        {TEMPLATES.map((tmpl) => (
                            <div key={tmpl.id} style={{
                                border: '1.5px solid #e5e7eb', borderRadius: '12px',
                                overflow: 'hidden', display: 'flex', flexDirection: 'column',
                                transition: 'border-color 0.15s, box-shadow 0.15s',
                                cursor: 'pointer',
                            }}
                                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = tmpl.color; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 16px ${tmpl.color}30`; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
                            >
                                {/* Mini Preview */}
                                <div style={{ height: '120px', overflow: 'hidden' }}>
                                    <MiniPreview accent={tmpl.previewAccent} bg={tmpl.previewBg} layout={tmpl.layout} />
                                </div>

                                {/* Card Info */}
                                <div style={{ padding: '12px 14px', borderTop: '1px solid #f3f4f6', background: '#fff' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: tmpl.color, flexShrink: 0 }} />
                                        <span style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>{tmpl.name}</span>
                                    </div>
                                    <p style={{ margin: '0 0 10px', fontSize: '11px', color: '#9ca3af', lineHeight: 1.4 }}>{tmpl.description}</p>
                                    <button
                                        onClick={() => handleUseTemplate(tmpl)}
                                        style={{
                                            width: '100%', padding: '8px', border: 'none', borderRadius: '8px',
                                            background: tmpl.color, color: '#fff',
                                            fontWeight: 600, fontSize: '12px', cursor: 'pointer',
                                            transition: 'opacity 0.15s',
                                        }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                                    >
                                        Use This Template
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
