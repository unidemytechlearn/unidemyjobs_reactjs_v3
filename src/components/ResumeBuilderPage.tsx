import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Download, Share2, Eye, Edit3, Sparkles, User, Briefcase, GraduationCap, Code, FolderOpen, FileText, Save, Plus, X, Calendar, MapPin, Mail, Phone, Globe, Linkedin, Github, Star, Award, Target, Zap, CheckCircle, AlertCircle, Loader, Palette, Layout, Wand2, RefreshCw, Upload } from 'lucide-react';

interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  summary: string;
  title: string;
}

interface Experience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string[];
  technologies: string[];
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa: string;
  achievements: string[];
}

interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  link: string;
  github: string;
  highlights: string[];
}

interface ResumeData {
  personalInfo: PersonalInfo;
  experience: Experience[];
  education: Education[];
  skills: {
    technical: string[];
    soft: string[];
    languages: string[];
    tools: string[];
  };
  projects: Project[];
  certifications: string[];
  achievements: string[];
}

  const [languages, setLanguages] = useState<{ value: string; proficiency: string }[]>([
    { value: '', proficiency: 'Native' }
  ]);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const [resumeData, setResumeData] = useState<ResumeData>({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      location: '',
      website: '',
      linkedin: '',
      github: '',
      summary: '',
      title: ''
    },
    experience: [],
    education: [],
    skills: {
      technical: [],
      soft: [],
      languages: [],
      tools: []
    },
    projects: [],
    certifications: [],
    achievements: []
  });

  const steps = [
    { id: 1, title: 'Personal Info', icon: User, description: 'Basic information and contact details' },
    { id: 2, title: 'Experience', icon: Briefcase, description: 'Work history and achievements' },
    { id: 3, title: 'Education', icon: GraduationCap, description: 'Academic background' },
    { id: 4, title: 'Skills', icon: Code, description: 'Technical and soft skills' },
    { id: 5, title: 'Projects', icon: FolderOpen, description: 'Portfolio and side projects' },
    { id: 6, title: 'Preview', icon: Eye, description: 'Review and download' }
  ];

  const templates = [
    { 
      id: 'modern', 
      name: 'Modern Professional', 
      description: 'Clean design with accent colors',
      preview: 'bg-gradient-to-br from-blue-50 to-indigo-100'
    },
    { 
      id: 'executive', 
      name: 'Executive', 
      description: 'Sophisticated layout for senior roles',
      preview: 'bg-gradient-to-br from-gray-50 to-slate-100'
    },
    { 
      id: 'creative', 
      name: 'Creative', 
      description: 'Bold design for creative professionals',
      preview: 'bg-gradient-to-br from-purple-50 to-pink-100'
    },
    { 
      id: 'minimal', 
      name: 'Minimal', 
      description: 'Simple and elegant design',
      preview: 'bg-gradient-to-br from-green-50 to-emerald-100'
    }
  ];

  // AI Suggestion Functions
  const generateAISuggestions = async (type: string, context: any) => {
    setIsLoadingSuggestions(true);
    
    // Simulate AI generation with realistic suggestions
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    let suggestions: string[] = [];
    
    switch (type) {
      case 'summary':
        suggestions = [
          `Experienced ${context.title || 'Professional'} with ${context.experience || '5+'} years of expertise in driving innovation and delivering results. Proven track record of leading cross-functional teams and implementing strategic initiatives that increase efficiency by 30%.`,
          `Results-driven ${context.title || 'Professional'} specializing in ${context.skills || 'technology solutions'}. Demonstrated ability to manage complex projects, mentor junior staff, and collaborate with stakeholders to achieve business objectives.`,
          `Dynamic ${context.title || 'Professional'} with strong analytical and problem-solving skills. Passionate about leveraging cutting-edge technologies to solve business challenges and drive digital transformation initiatives.`
        ];
        break;
      case 'experience':
        suggestions = [
          `• Led a team of ${Math.floor(Math.random() * 8) + 3} developers to deliver high-quality software solutions, resulting in 25% improvement in system performance`,
          `• Implemented agile methodologies and best practices, reducing project delivery time by 30% and improving team productivity`,
          `• Collaborated with cross-functional teams to design and develop scalable applications serving 100K+ users`,
          `• Mentored junior developers and conducted code reviews, improving code quality and team knowledge sharing`,
          `• Optimized database queries and system architecture, reducing response time by 40% and improving user experience`
        ];
        break;
      case 'skills':
        suggestions = [
          'React, Node.js, TypeScript, Python, AWS, Docker, Kubernetes, MongoDB, PostgreSQL, Git',
          'JavaScript, Vue.js, Express.js, Java, Azure, Jenkins, Redis, MySQL, GraphQL, REST APIs',
          'Angular, Django, C#, Google Cloud, Terraform, Elasticsearch, Firebase, Microservices, CI/CD'
        ];
        break;
      default:
        suggestions = ['AI suggestion not available for this field'];
    }
    
    setAiSuggestions(suggestions);
    setIsLoadingSuggestions(false);
  };

  const addExperience = () => {
    const newExp: Experience = {
      id: Date.now().toString(),
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: [''],
      technologies: []
    };
    setResumeData(prev => ({
      ...prev,
      experience: [...prev.experience, newExp]
    }));
  };

  const updateExperience = (id: string, field: string, value: any) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => 
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const addEducation = () => {
    const newEdu: Education = {
      id: Date.now().toString(),
      institution: '',
      degree: '',
      field: '',
      location: '',
      startDate: '',
      endDate: '',
      gpa: '',
      achievements: ['']
    };
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, newEdu]
    }));
  };

  const addProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: '',
      description: '',
      technologies: [],
      link: '',
      github: '',
      highlights: ['']
    };
    setResumeData(prev => ({
      ...prev,
      projects: [...prev.projects, newProject]
    }));
  };

  const generateResume = async () => {
    setIsGenerating(true);
    
    // Simulate AI resume generation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Auto-fill with sample data for demonstration
    const sampleData: ResumeData = {
      personalInfo: {
        firstName: resumeData.personalInfo.firstName || 'John',
        lastName: resumeData.personalInfo.lastName || 'Doe',
        email: resumeData.personalInfo.email || 'john.doe@email.com',
        phone: resumeData.personalInfo.phone || '+1 (555) 123-4567',
        location: resumeData.personalInfo.location || 'San Francisco, CA',
        website: resumeData.personalInfo.website || 'johndoe.dev',
        linkedin: resumeData.personalInfo.linkedin || 'linkedin.com/in/johndoe',
        github: resumeData.personalInfo.github || 'github.com/johndoe',
        title: resumeData.personalInfo.title || 'Senior Software Engineer',
        summary: resumeData.personalInfo.summary || 'Experienced Software Engineer with 7+ years of expertise in full-stack development. Proven track record of leading cross-functional teams and delivering scalable solutions that serve millions of users. Passionate about clean code, system architecture, and mentoring junior developers.'
      },
      experience: resumeData.experience.length > 0 ? resumeData.experience : [
        {
          id: '1',
          company: 'TechCorp Inc.',
          position: 'Senior Software Engineer',
          location: 'San Francisco, CA',
          startDate: '2021-03',
          endDate: '',
          current: true,
          description: [
            'Led development of microservices architecture serving 2M+ daily active users',
            'Implemented CI/CD pipelines reducing deployment time by 60%',
            'Mentored 5 junior developers and conducted technical interviews',
            'Collaborated with product team to define technical requirements and roadmap'
          ],
          technologies: ['React', 'Node.js', 'TypeScript', 'AWS', 'Docker', 'Kubernetes']
        },
        {
          id: '2',
          company: 'StartupXYZ',
          position: 'Full Stack Developer',
          location: 'Remote',
          startDate: '2019-06',
          endDate: '2021-02',
          current: false,
          description: [
            'Built responsive web applications using React and Node.js',
            'Designed and implemented RESTful APIs and database schemas',
            'Optimized application performance resulting in 40% faster load times',
            'Participated in agile development process and sprint planning'
          ],
          technologies: ['React', 'Express.js', 'MongoDB', 'PostgreSQL', 'Git']
        }
      ],
      education: resumeData.education.length > 0 ? resumeData.education : [
        {
          id: '1',
          institution: 'University of California, Berkeley',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          location: 'Berkeley, CA',
          startDate: '2015-08',
          endDate: '2019-05',
          gpa: '3.8',
          achievements: ['Dean\'s List', 'CS Honor Society', 'Hackathon Winner 2018']
        }
      ],
      skills: {
        technical: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'AWS', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL'],
        soft: ['Leadership', 'Team Management', 'Problem Solving', 'Communication', 'Agile Methodology'],
        languages: languages?.filter(Boolean)?.map(lang => lang?.value) || [],
        tools: ['Git', 'Jenkins', 'Jira', 'Figma', 'VS Code', 'Postman']
      },
      projects: resumeData.projects.length > 0 ? resumeData.projects : [
        {
          id: '1',
          name: 'E-commerce Platform',
          description: 'Full-stack e-commerce solution with payment integration and admin dashboard',
          technologies: ['React', 'Node.js', 'Stripe API', 'MongoDB'],
          link: 'https://ecommerce-demo.com',
          github: 'https://github.com/johndoe/ecommerce',
          highlights: ['Processed $100K+ in transactions', 'Served 10K+ customers', '99.9% uptime']
        },
        {
          id: '2',
          name: 'Task Management App',
          description: 'Collaborative project management tool with real-time updates',
          technologies: ['Vue.js', 'Socket.io', 'Express.js', 'PostgreSQL'],
          link: 'https://taskmanager-demo.com',
          github: 'https://github.com/johndoe/taskmanager',
          highlights: ['Real-time collaboration', 'Used by 500+ teams', 'Mobile responsive']
        }
      ],
      certifications: ['AWS Certified Solutions Architect', 'Google Cloud Professional', 'Scrum Master Certified'],
      achievements: ['Employee of the Year 2022', 'Led team that won company hackathon', 'Speaker at TechConf 2023']
    };
    
    setResumeData(sampleData);
    setIsGenerating(false);
    setCurrentStep(6); // Go to preview
  };

  const downloadResume = () => {
    const resumeContent = generateResumeText();
    const blob = new Blob([resumeContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resumeData.personalInfo.firstName}_${resumeData.personalInfo.lastName}_Resume.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateResumeText = () => {
    const { personalInfo, experience, education, skills, projects, certifications, achievements } = resumeData;
    
    return `
${personalInfo.firstName} ${personalInfo.lastName}
${personalInfo.title}

CONTACT INFORMATION
Email: ${personalInfo.email}
Phone: ${personalInfo.phone}
Location: ${personalInfo.location}
Website: ${personalInfo.website}
LinkedIn: ${personalInfo.linkedin}
GitHub: ${personalInfo.github}

PROFESSIONAL SUMMARY
${personalInfo.summary}

WORK EXPERIENCE
${experience.map(exp => `
${exp.position} | ${exp.company} | ${exp.location}
${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}

${exp.description.map(desc => `• ${desc}`).join('\n')}

Technologies: ${exp.technologies.join(', ')}
`).join('\n')}

EDUCATION
${education.map(edu => `
${edu.degree} in ${edu.field}
${edu.institution} | ${edu.location}
${edu.startDate} - ${edu.endDate}
${edu.gpa ? `GPA: ${edu.gpa}` : ''}

Achievements: ${edu.achievements.join(', ')}
`).join('\n')}

TECHNICAL SKILLS
${skills.technical.join(', ')}

SOFT SKILLS
${skills.soft.join(', ')}

LANGUAGES
${skills.languages.join(', ')}

TOOLS & TECHNOLOGIES
${skills.tools.join(', ')}

PROJECTS
${projects.map(project => `
${project.name}
${project.description}

Technologies: ${project.technologies.join(', ')}
${project.link ? `Live Demo: ${project.link}` : ''}
${project.github ? `GitHub: ${project.github}` : ''}

Key Highlights:
${project.highlights.map(highlight => `• ${highlight}`).join('\n')}
`).join('\n')}

CERTIFICATIONS
${certifications.map(cert => `• ${cert}`).join('\n')}

ACHIEVEMENTS
${achievements.map(achievement => `• ${achievement}`).join('\n')}
    `.trim();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Personal Information</h2>
              <p className="text-gray-600">Let's start with your basic information and contact details</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                <input
                  type="text"
                  value={resumeData.personalInfo.firstName}
                  onChange={(e) => setResumeData(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, firstName: e.target.value }
                  }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                <input
                  type="text"
                  value={resumeData.personalInfo.lastName}
                  onChange={(e) => setResumeData(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, lastName: e.target.value }
                  }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Professional Title *</label>
                <input
                  type="text"
                  value={resumeData.personalInfo.title}
                  onChange={(e) => setResumeData(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, title: e.target.value }
                  }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Senior Software Engineer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={resumeData.personalInfo.email}
                  onChange={(e) => setResumeData(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, email: e.target.value }
                  }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="john.doe@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                <input
                  type="tel"
                  value={resumeData.personalInfo.phone}
                  onChange={(e) => setResumeData(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, phone: e.target.value }
                  }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                <input
                  type="text"
                  value={resumeData.personalInfo.location}
                  onChange={(e) => setResumeData(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, location: e.target.value }
                  }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="San Francisco, CA"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                <input
                  type="url"
                  value={resumeData.personalInfo.website}
                  onChange={(e) => setResumeData(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, website: e.target.value }
                  }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="johndoe.dev"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                <input
                  type="url"
                  value={resumeData.personalInfo.linkedin}
                  onChange={(e) => setResumeData(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, linkedin: e.target.value }
                  }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="linkedin.com/in/johndoe"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">Professional Summary *</label>
                <button
                  onClick={() => generateAISuggestions('summary', { 
                    title: resumeData.personalInfo.title,
                    experience: '5+',
                    skills: 'technology'
                  })}
                  disabled={isLoadingSuggestions}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50"
                >
                  {isLoadingSuggestions ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  <span>AI Suggestions</span>
                </button>
              </div>
              <textarea
                value={resumeData.personalInfo.summary}
                onChange={(e) => setResumeData(prev => ({
                  ...prev,
                  personalInfo: { ...prev.personalInfo, summary: e.target.value }
                }))}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Write a compelling professional summary that highlights your key achievements and career goals..."
              />
              
              {aiSuggestions.length > 0 && (
                <div className="mt-4 space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">AI Suggestions:</h4>
                  {aiSuggestions.map((suggestion, index) => (
                    <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-gray-700 mb-3">{suggestion}</p>
                      <button
                        onClick={() => {
                          setResumeData(prev => ({
                            ...prev,
                            personalInfo: { ...prev.personalInfo, summary: suggestion }
                          }));
                          setAiSuggestions([]);
                        }}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Use This Suggestion
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Work Experience</h2>
              <p className="text-gray-600">Add your professional experience and achievements</p>
            </div>

            <div className="space-y-6">
              {resumeData.experience.map((exp, index) => (
                <div key={exp.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Experience #{index + 1}</h3>
                    <button
                      onClick={() => setResumeData(prev => ({
                        ...prev,
                        experience: prev.experience.filter(e => e.id !== exp.id)
                      }))}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company *</label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="TechCorp Inc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Position *</label>
                      <input
                        type="text"
                        value={exp.position}
                        onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Senior Software Engineer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                      <input
                        type="text"
                        value={exp.location}
                        onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="San Francisco, CA"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                      <input
                        type="month"
                        value={exp.startDate}
                        onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                      <input
                        type="month"
                        value={exp.endDate}
                        onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                        disabled={exp.current}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`current-${exp.id}`}
                        checked={exp.current}
                        onChange={(e) => updateExperience(exp.id, 'current', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`current-${exp.id}`} className="ml-2 text-sm text-gray-700">
                        I currently work here
                      </label>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">Job Description & Achievements</label>
                      <button
                        onClick={() => generateAISuggestions('experience', { position: exp.position })}
                        disabled={isLoadingSuggestions}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50"
                      >
                        {isLoadingSuggestions ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                        <span>AI Suggestions</span>
                      </button>
                    </div>
                    
                    {exp.description.map((desc, descIndex) => (
                      <div key={descIndex} className="flex items-center space-x-2 mb-2">
                        <textarea
                          value={desc}
                          onChange={(e) => {
                            const newDesc = [...exp.description];
                            newDesc[descIndex] = e.target.value;
                            updateExperience(exp.id, 'description', newDesc);
                          }}
                          rows={2}
                          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          placeholder="• Describe your key responsibilities and achievements..."
                        />
                        <button
                          onClick={() => {
                            const newDesc = exp.description.filter((_, i) => i !== descIndex);
                            updateExperience(exp.id, 'description', newDesc);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    
                    <button
                      onClick={() => updateExperience(exp.id, 'description', [...exp.description, ''])}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Achievement</span>
                    </button>

                    {aiSuggestions.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">AI Suggestions:</h4>
                        {aiSuggestions.map((suggestion, index) => (
                          <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-gray-700 mb-2">{suggestion}</p>
                            <button
                              onClick={() => {
                                updateExperience(exp.id, 'description', [...exp.description, suggestion]);
                                setAiSuggestions([]);
                              }}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              Add This
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Technologies Used</label>
                    <input
                      type="text"
                      value={exp.technologies.join(', ')}
                      onChange={(e) => updateExperience(exp.id, 'technologies', e.target.value.split(',').map(t => t.trim()).filter(t => t))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="React, Node.js, TypeScript, AWS..."
                    />
                  </div>
                </div>
              ))}

              <button
                onClick={addExperience}
                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Add Work Experience</span>
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Education</h2>
              <p className="text-gray-600">Add your educational background and achievements</p>
            </div>

            <div className="space-y-6">
              {resumeData.education.map((edu, index) => (
                <div key={edu.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Education #{index + 1}</h3>
                    <button
                      onClick={() => setResumeData(prev => ({
                        ...prev,
                        education: prev.education.filter(e => e.id !== edu.id)
                      }))}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Institution *</label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => setResumeData(prev => ({
                          ...prev,
                          education: prev.education.map(e => 
                            e.id === edu.id ? { ...e, institution: e.target.value } : e
                          )
                        }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="University of California, Berkeley"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Degree *</label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => setResumeData(prev => ({
                          ...prev,
                          education: prev.education.map(e => 
                            e.id === edu.id ? { ...e, degree: e.target.value } : e
                          )
                        }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Bachelor of Science"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Field of Study *</label>
                      <input
                        type="text"
                        value={edu.field}
                        onChange={(e) => setResumeData(prev => ({
                          ...prev,
                          education: prev.education.map(e => 
                            e.id === edu.id ? { ...e, field: e.target.value } : e
                          )
                        }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Computer Science"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                      <input
                        type="text"
                        value={edu.location}
                        onChange={(e) => setResumeData(prev => ({
                          ...prev,
                          education: prev.education.map(e => 
                            e.id === edu.id ? { ...e, location: e.target.value } : e
                          )
                        }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Berkeley, CA"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                      <input
                        type="month"
                        value={edu.startDate}
                        onChange={(e) => setResumeData(prev => ({
                          ...prev,
                          education: prev.education.map(e => 
                            e.id === edu.id ? { ...e, startDate: e.target.value } : e
                          )
                        }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                      <input
                        type="month"
                        value={edu.endDate}
                        onChange={(e) => setResumeData(prev => ({
                          ...prev,
                          education: prev.education.map(e => 
                            e.id === edu.id ? { ...e, endDate: e.target.value } : e
                          )
                        }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">GPA (Optional)</label>
                      <input
                        type="text"
                        value={edu.gpa}
                        onChange={(e) => setResumeData(prev => ({
                          ...prev,
                          education: prev.education.map(e => 
                            e.id === edu.id ? { ...e, gpa: e.target.value } : e
                          )
                        }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="3.8"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Achievements & Activities</label>
                    {edu.achievements.map((achievement, achIndex) => (
                      <div key={achIndex} className="flex items-center space-x-2 mb-2">
                        <input
                          type="text"
                          value={achievement}
                          onChange={(e) => {
                            const newAchievements = [...edu.achievements];
                            newAchievements[achIndex] = e.target.value;
                            setResumeData(prev => ({
                              ...prev,
                              education: prev.education.map(e => 
                                e.id === edu.id ? { ...e, achievements: newAchievements } : e
                              )
                            }));
                          }}
                          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Dean's List, Honor Society, etc."
                        />
                        <button
                          onClick={() => {
                            const newAchievements = edu.achievements.filter((_, i) => i !== achIndex);
                            setResumeData(prev => ({
                              ...prev,
                              education: prev.education.map(e => 
                                e.id === edu.id ? { ...e, achievements: newAchievements } : e
                              )
                            }));
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    
                    <button
                      onClick={() => setResumeData(prev => ({
                        ...prev,
                        education: prev.education.map(e => 
                          e.id === edu.id ? { ...e, achievements: [...e.achievements, ''] } : e
                        )
                      }))}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Achievement</span>
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={addEducation}
                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Add Education</span>
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Skills & Expertise</h2>
              <p className="text-gray-600">Showcase your technical and soft skills</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">Technical Skills</label>
                    <button
                      onClick={() => generateAISuggestions('skills', {})}
                      disabled={isLoadingSuggestions}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50"
                    >
                      {isLoadingSuggestions ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      <span>AI Suggestions</span>
                    </button>
                  </div>
                  <textarea
                    value={resumeData.skills.technical.join(', ')}
                    onChange={(e) => setResumeData(prev => ({
                      ...prev,
                      skills: {
                        ...prev.skills,
                        technical: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                      }
                    }))}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="JavaScript, React, Node.js, Python, AWS, Docker..."
                  />

                  {aiSuggestions.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">AI Suggestions:</h4>
                      {aiSuggestions.map((suggestion, index) => (
                        <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-gray-700 mb-2">{suggestion}</p>
                          <button
                            onClick={() => {
                              setResumeData(prev => ({
                                ...prev,
                                skills: {
                                  ...prev.skills,
                                  technical: suggestion.split(',').map(s => s.trim()).filter(s => s)
                                }
                              }));
                              setAiSuggestions([]);
                            }}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Use These Skills
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Soft Skills</label>
                  <textarea
                    value={resumeData.skills.soft.join(', ')}
                    onChange={(e) => setResumeData(prev => ({
                      ...prev,
                      skills: {
                        ...prev.skills,
                        soft: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                      }
                    }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Leadership, Communication, Problem Solving, Team Management..."
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Languages</label>
                  <textarea
                    value={resumeData.skills.languages.join(', ')}
                    onChange={(e) => setResumeData(prev => ({
                      ...prev,
                      skills: {
                        ...prev.skills,
                        languages: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                      }
                    }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="English (Native), Spanish (Fluent), French (Conversational)..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Tools & Technologies</label>
                  <textarea
                    value={resumeData.skills.tools.join(', ')}
                    onChange={(e) => setResumeData(prev => ({
                      ...prev,
                      skills: {
                        ...prev.skills,
                        tools: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                      }
                    }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Git, Jenkins, Jira, Figma, VS Code, Postman..."
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Certifications</label>
                <textarea
                  value={resumeData.certifications.join(', ')}
                  onChange={(e) => setResumeData(prev => ({
                    ...prev,
                    certifications: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                  }))}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="AWS Certified Solutions Architect, Google Cloud Professional..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Achievements & Awards</label>
                <textarea
                  value={resumeData.achievements.join(', ')}
                  onChange={(e) => setResumeData(prev => ({
                    ...prev,
                    achievements: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                  }))}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Employee of the Year, Hackathon Winner, Conference Speaker..."
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Projects & Portfolio</h2>
              <p className="text-gray-600">Showcase your best work and side projects</p>
            </div>

            <div className="space-y-6">
              {resumeData.projects.map((project, index) => (
                <div key={project.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Project #{index + 1}</h3>
                    <button
                      onClick={() => setResumeData(prev => ({
                        ...prev,
                        projects: prev.projects.filter(p => p.id !== project.id)
                      }))}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Project Name *</label>
                      <input
                        type="text"
                        value={project.name}
                        onChange={(e) => setResumeData(prev => ({
                          ...prev,
                          projects: prev.projects.map(p => 
                            p.id === project.id ? { ...p, name: e.target.value } : p
                          )
                        }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="E-commerce Platform"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Technologies Used</label>
                      <input
                        type="text"
                        value={project.technologies.join(', ')}
                        onChange={(e) => setResumeData(prev => ({
                          ...prev,
                          projects: prev.projects.map(p => 
                            p.id === project.id ? { ...p, technologies: e.target.value.split(',').map(t => t.trim()).filter(t => t) } : p
                          )
                        }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="React, Node.js, MongoDB..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Live Demo URL</label>
                      <input
                        type="url"
                        value={project.link}
                        onChange={(e) => setResumeData(prev => ({
                          ...prev,
                          projects: prev.projects.map(p => 
                            p.id === project.id ? { ...p, link: e.target.value } : p
                          )
                        }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://myproject.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">GitHub Repository</label>
                      <input
                        type="url"
                        value={project.github}
                        onChange={(e) => setResumeData(prev => ({
                          ...prev,
                          projects: prev.projects.map(p => 
                            p.id === project.id ? { ...p, github: e.target.value } : p
                          )
                        }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://github.com/username/project"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Project Description</label>
                    <textarea
                      value={project.description}
                      onChange={(e) => setResumeData(prev => ({
                        ...prev,
                        projects: prev.projects.map(p => 
                          p.id === project.id ? { ...p, description: e.target.value } : p
                        )
                      }))}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Describe what the project does and your role in it..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Key Highlights</label>
                    {project.highlights.map((highlight, highlightIndex) => (
                      <div key={highlightIndex} className="flex items-center space-x-2 mb-2">
                        <input
                          type="text"
                          value={highlight}
                          onChange={(e) => {
                            const newHighlights = [...project.highlights];
                            newHighlights[highlightIndex] = e.target.value;
                            setResumeData(prev => ({
                              ...prev,
                              projects: prev.projects.map(p => 
                                p.id === project.id ? { ...p, highlights: newHighlights } : p
                              )
                            }));
                          }}
                          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Served 10K+ users, 99.9% uptime..."
                        />
                        <button
                          onClick={() => {
                            const newHighlights = project.highlights.filter((_, i) => i !== highlightIndex);
                            setResumeData(prev => ({
                              ...prev,
                              projects: prev.projects.map(p => 
                                p.id === project.id ? { ...p, highlights: newHighlights } : p
                              )
                            }));
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    
                    <button
                      onClick={() => setResumeData(prev => ({
                        ...prev,
                        projects: prev.projects.map(p => 
                          p.id === project.id ? { ...p, highlights: [...p.highlights, ''] } : p
                        )
                      }))}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Highlight</span>
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={addProject}
                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Add Project</span>
              </button>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Resume Preview</h2>
              <p className="text-gray-600">Review your resume and make final adjustments</p>
            </div>

            {/* Template Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Template</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedTemplate === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-full h-24 rounded-lg mb-3 ${template.preview}`}></div>
                    <h4 className="font-medium text-gray-900 text-sm">{template.name}</h4>
                    <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Resume Preview */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
              <div className={`resume-preview ${selectedTemplate}`}>
                {/* Header */}
                <div className="text-center mb-8 pb-6 border-b-2 border-gray-200">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {resumeData.personalInfo.firstName} {resumeData.personalInfo.lastName}
                  </h1>
                  <h2 className="text-xl text-blue-600 font-semibold mb-4">
                    {resumeData.personalInfo.title}
                  </h2>
                  <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Mail className="h-4 w-4" />
                      <span>{resumeData.personalInfo.email}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Phone className="h-4 w-4" />
                      <span>{resumeData.personalInfo.phone}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{resumeData.personalInfo.location}</span>
                    </div>
                    {resumeData.personalInfo.website && (
                      <div className="flex items-center space-x-1">
                        <Globe className="h-4 w-4" />
                        <span>{resumeData.personalInfo.website}</span>
                      </div>
                    )}
                    {resumeData.personalInfo.linkedin && (
                      <div className="flex items-center space-x-1">
                        <Linkedin className="h-4 w-4" />
                        <span>{resumeData.personalInfo.linkedin}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Professional Summary */}
                {resumeData.personalInfo.summary && (
                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-300">
                      PROFESSIONAL SUMMARY
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {resumeData.personalInfo.summary}
                    </p>
                  </div>
                )}

                {/* Experience */}
                {resumeData.experience.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                      WORK EXPERIENCE
                    </h3>
                    <div className="space-y-6">
                      {resumeData.experience.map((exp) => (
                        <div key={exp.id}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold text-gray-900">{exp.position}</h4>
                              <p className="text-blue-600 font-medium">{exp.company}</p>
                            </div>
                            <div className="text-right text-sm text-gray-600">
                              <p>{exp.location}</p>
                              <p>{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</p>
                            </div>
                          </div>
                          <ul className="list-disc list-inside space-y-1 text-gray-700 mb-2">
                            {exp.description.filter(desc => desc.trim()).map((desc, index) => (
                              <li key={index} className="leading-relaxed">{desc}</li>
                            ))}
                          </ul>
                          {exp.technologies.length > 0 && (
                            <p className="text-sm text-gray-600">
                              <strong>Technologies:</strong> {exp.technologies.join(', ')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {resumeData.education.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                      EDUCATION
                    </h3>
                    <div className="space-y-4">
                      {resumeData.education.map((edu) => (
                        <div key={edu.id}>
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {edu.degree} in {edu.field}
                              </h4>
                              <p className="text-blue-600 font-medium">{edu.institution}</p>
                              {edu.gpa && <p className="text-sm text-gray-600">GPA: {edu.gpa}</p>}
                            </div>
                            <div className="text-right text-sm text-gray-600">
                              <p>{edu.location}</p>
                              <p>{edu.startDate} - {edu.endDate}</p>
                            </div>
                          </div>
                          {edu.achievements.filter(ach => ach.trim()).length > 0 && (
                            <p className="text-sm text-gray-600 mt-1">
                              <strong>Achievements:</strong> {edu.achievements.filter(ach => ach.trim()).join(', ')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                    SKILLS
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {resumeData.skills.technical.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Technical Skills</h4>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {resumeData.skills.technical.join(', ')}
                        </p>
                      </div>
                    )}
                    {resumeData.skills.soft.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Soft Skills</h4>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {resumeData.skills.soft.join(', ')}
                        </p>
                      </div>
                    )}
                    {resumeData.skills.languages.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Languages</h4>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {resumeData.skills.languages.join(', ')}
                        </p>
                      </div>
                    )}
                    {resumeData.skills.tools.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Tools & Technologies</h4>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {resumeData.skills.tools.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Projects */}
                {resumeData.projects.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                      PROJECTS
                    </h3>
                    <div className="space-y-4">
                      {resumeData.projects.map((project) => (
                        <div key={project.id}>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-900">{project.name}</h4>
                            <div className="flex space-x-2 text-sm">
                              {project.link && (
                                <span className="text-blue-600">Live Demo</span>
                              )}
                              {project.github && (
                                <span className="text-gray-600">GitHub</span>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-700 text-sm mb-2">{project.description}</p>
                          {project.technologies.length > 0 && (
                            <p className="text-sm text-gray-600 mb-2">
                              <strong>Technologies:</strong> {project.technologies.join(', ')}
                            </p>
                          )}
                          {project.highlights.filter(h => h.trim()).length > 0 && (
                            <ul className="list-disc list-inside text-sm text-gray-700">
                              {project.highlights.filter(h => h.trim()).map((highlight, index) => (
                                <li key={index}>{highlight}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {resumeData.certifications.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-300">
                      CERTIFICATIONS
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {resumeData.certifications.map((cert, index) => (
                        <li key={index}>{cert}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Achievements */}
                {resumeData.achievements.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-300">
                      ACHIEVEMENTS & AWARDS
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {resumeData.achievements.map((achievement, index) => (
                        <li key={index}>{achievement}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={downloadResume}
                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-semibold"
              >
                <Download className="h-5 w-5" />
                <span>Download Resume</span>
              </button>
              <button className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors font-semibold">
                <Share2 className="h-5 w-5" />
                <span>Share Resume</span>
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4 mr-2" />
            AI-Powered Resume Builder
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Create Your Perfect Resume with
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600"> AI Assistance</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Build a professional, ATS-friendly resume in minutes. Our AI helps you craft compelling content 
            that gets you noticed by recruiters and hiring managers.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button
            onClick={generateResume}
            disabled={isGenerating}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader className="h-5 w-5 animate-spin" />
                <span>Generating AI Resume...</span>
              </>
            ) : (
              <>
                <Wand2 className="h-5 w-5" />
                <span>Generate AI Resume</span>
              </>
            )}
          </button>
          <button className="flex items-center justify-center space-x-2 border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors font-semibold">
            <Upload className="h-5 w-5" />
            <span>Import from LinkedIn</span>
          </button>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center space-x-4 overflow-x-auto pb-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => setCurrentStep(step.id)}
                    className={`flex flex-col items-center space-y-2 p-4 rounded-xl transition-all min-w-[120px] ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg'
                        : isCompleted
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isActive
                        ? 'bg-white/20'
                        : isCompleted
                        ? 'bg-green-200'
                        : 'bg-white'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <Icon className={`h-6 w-6 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                      )}
                    </div>
                    <div className="text-center">
                      <div className={`font-semibold text-sm ${isActive ? 'text-white' : ''}`}>
                        {step.title}
                      </div>
                      <div className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                        {step.description}
                      </div>
                    </div>
                  </button>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-2 ${
                      currentStep > step.id ? 'bg-green-400' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="p-8">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between p-6 bg-gray-50 border-t border-gray-200">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                Step {currentStep} of {steps.length}
              </span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / steps.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <button
              onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
              disabled={currentStep === steps.length}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="bg-blue-100 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">AI-Powered Content</h3>
            <p className="text-gray-600">
              Get intelligent suggestions for professional summaries, job descriptions, and skills.
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="bg-green-100 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Layout className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Professional Templates</h3>
            <p className="text-gray-600">
              Choose from multiple professionally designed templates that pass ATS systems.
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="bg-purple-100 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Download className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Easy Export</h3>
            <p className="text-gray-600">
              Download your resume in multiple formats and share it instantly with employers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilderPage;