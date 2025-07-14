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

const ResumeBuilderPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Initialize with proper default values
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
    experience: [{
      id: '1',
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: [''],
      technologies: []
    }],
    education: [{
      id: '1',
      institution: '',
      degree: '',
      field: '',
      location: '',
      startDate: '',
      endDate: '',
      gpa: '',
      achievements: ['']
    }],
    skills: {
      technical: [],
      soft: [],
      languages: [],
      tools: []
    },
    projects: [{
      id: '1',
      name: '',
      description: '',
      technologies: [],
      link: '',
      github: '',
      highlights: ['']
    }],
    certifications: [],
    achievements: []
  });

  const steps = [
    { id: 1, title: 'Personal Info', icon: User, description: 'Basic information and contact details' },
    { id: 2, title: 'Experience', icon: Briefcase, description: 'Work history and achievements' },
    { id: 3, title: 'Education', icon: GraduationCap, description: 'Academic background' },
    { id: 4, title: 'Skills', icon: Code, description: 'Technical and soft skills' },
    { id: 5, title: 'Projects', icon: FolderOpen, description: 'Portfolio and projects' },
    { id: 6, title: 'Preview', icon: Eye, description: 'Review and download' }
  ];

  const templates = [
    { id: 'modern', name: 'Modern', color: 'from-blue-500 to-indigo-600', description: 'Clean and contemporary design' },
    { id: 'executive', name: 'Executive', color: 'from-gray-700 to-gray-900', description: 'Professional and sophisticated' },
    { id: 'creative', name: 'Creative', color: 'from-purple-500 to-pink-600', description: 'Bold and artistic layout' },
    { id: 'minimal', name: 'Minimal', color: 'from-green-500 to-teal-600', description: 'Simple and elegant' }
  ];

  const generateAIResume = async () => {
    setIsGeneratingAI(true);
    
    // Simulate AI generation with realistic data
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const aiGeneratedData: ResumeData = {
      personalInfo: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@email.com',
        phone: '+1 (555) 123-4567',
        location: 'San Francisco, CA',
        website: 'johndoe.dev',
        linkedin: 'linkedin.com/in/johndoe',
        github: 'github.com/johndoe',
        summary: 'Experienced Full Stack Developer with 5+ years of expertise in React, Node.js, and cloud technologies. Passionate about creating scalable web applications and leading development teams to deliver high-quality software solutions.',
        title: 'Senior Full Stack Developer'
      },
      experience: [
        {
          id: '1',
          company: 'TechCorp Inc.',
          position: 'Senior Full Stack Developer',
          location: 'San Francisco, CA',
          startDate: '2022-01',
          endDate: '',
          current: true,
          description: [
            'Led development of microservices architecture serving 1M+ users',
            'Improved application performance by 40% through code optimization',
            'Mentored junior developers and conducted code reviews'
          ],
          technologies: ['React', 'Node.js', 'TypeScript', 'AWS', 'Docker']
        },
        {
          id: '2',
          company: 'StartupXYZ',
          position: 'Full Stack Developer',
          location: 'Remote',
          startDate: '2020-03',
          endDate: '2021-12',
          current: false,
          description: [
            'Built responsive web applications using React and Express.js',
            'Implemented CI/CD pipelines reducing deployment time by 60%',
            'Collaborated with design team to create user-friendly interfaces'
          ],
          technologies: ['React', 'Express.js', 'MongoDB', 'Jenkins']
        }
      ],
      education: [
        {
          id: '1',
          institution: 'University of California, Berkeley',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          location: 'Berkeley, CA',
          startDate: '2016-09',
          endDate: '2020-05',
          gpa: '3.8',
          achievements: ['Dean\'s List', 'Computer Science Honor Society']
        }
      ],
      skills: {
        technical: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'AWS', 'Docker', 'MongoDB', 'PostgreSQL'],
        soft: ['Leadership', 'Problem Solving', 'Communication', 'Team Collaboration', 'Project Management'],
        languages: ['English (Native)', 'Spanish (Conversational)'],
        tools: ['Git', 'VS Code', 'Figma', 'Jira', 'Slack']
      },
      projects: [
        {
          id: '1',
          name: 'E-commerce Platform',
          description: 'Full-stack e-commerce solution with payment integration',
          technologies: ['React', 'Node.js', 'Stripe', 'MongoDB'],
          link: 'https://ecommerce-demo.com',
          github: 'https://github.com/johndoe/ecommerce',
          highlights: ['Processed $100K+ in transactions', 'Mobile-responsive design', 'Real-time inventory management']
        },
        {
          id: '2',
          name: 'Task Management App',
          description: 'Collaborative project management tool with real-time updates',
          technologies: ['React', 'Socket.io', 'Express.js', 'PostgreSQL'],
          link: 'https://taskmanager-demo.com',
          github: 'https://github.com/johndoe/taskmanager',
          highlights: ['Real-time collaboration', 'Drag-and-drop interface', '500+ active users']
        }
      ],
      certifications: ['AWS Certified Developer', 'Google Cloud Professional'],
      achievements: ['Employee of the Year 2023', 'Led team that won company hackathon']
    };
    
    setResumeData(aiGeneratedData);
    setIsGeneratingAI(false);
  };

  const updatePersonalInfo = (field: keyof PersonalInfo, value: string) => {
    setResumeData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }));
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

  const updateExperience = (id: string, field: keyof Experience, value: any) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => 
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const removeExperience = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id)
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

  const updateEducation = (id: string, field: keyof Education, value: any) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.map(edu => 
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const removeEducation = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
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

  const updateProject = (id: string, field: keyof Project, value: any) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.map(project => 
        project.id === id ? { ...project, [field]: value } : project
      )
    }));
  };

  const removeProject = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.filter(project => project.id !== id)
    }));
  };

  const addSkill = (category: keyof typeof resumeData.skills, skill: string) => {
    if (skill.trim()) {
      setResumeData(prev => ({
        ...prev,
        skills: {
          ...prev.skills,
          [category]: [...prev.skills[category], skill.trim()]
        }
      }));
    }
  };

  const removeSkill = (category: keyof typeof resumeData.skills, index: number) => {
    setResumeData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: prev.skills[category].filter((_, i) => i !== index)
      }
    }));
  };

  const downloadResume = () => {
    const resumeText = generateResumeText();
    const blob = new Blob([resumeText], { type: 'text/plain' });
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
    
    let text = `${personalInfo.firstName} ${personalInfo.lastName}\n`;
    text += `${personalInfo.title}\n\n`;
    
    text += `CONTACT INFORMATION\n`;
    text += `Email: ${personalInfo.email}\n`;
    text += `Phone: ${personalInfo.phone}\n`;
    text += `Location: ${personalInfo.location}\n`;
    if (personalInfo.website) text += `Website: ${personalInfo.website}\n`;
    if (personalInfo.linkedin) text += `LinkedIn: ${personalInfo.linkedin}\n`;
    if (personalInfo.github) text += `GitHub: ${personalInfo.github}\n`;
    text += `\n`;
    
    if (personalInfo.summary) {
      text += `PROFESSIONAL SUMMARY\n`;
      text += `${personalInfo.summary}\n\n`;
    }
    
    if (experience.length > 0 && experience[0].company) {
      text += `WORK EXPERIENCE\n`;
      experience.forEach(exp => {
        if (exp.company) {
          text += `${exp.position} at ${exp.company}\n`;
          text += `${exp.location} | ${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}\n`;
          exp.description.forEach(desc => {
            if (desc) text += `• ${desc}\n`;
          });
          if (exp.technologies.length > 0) {
            text += `Technologies: ${exp.technologies.join(', ')}\n`;
          }
          text += `\n`;
        }
      });
    }
    
    if (education.length > 0 && education[0].institution) {
      text += `EDUCATION\n`;
      education.forEach(edu => {
        if (edu.institution) {
          text += `${edu.degree} in ${edu.field}\n`;
          text += `${edu.institution}, ${edu.location}\n`;
          text += `${edu.startDate} - ${edu.endDate}`;
          if (edu.gpa) text += ` | GPA: ${edu.gpa}`;
          text += `\n`;
          edu.achievements.forEach(achievement => {
            if (achievement) text += `• ${achievement}\n`;
          });
          text += `\n`;
        }
      });
    }
    
    if (skills.technical.length > 0 || skills.soft.length > 0 || skills.languages.length > 0 || skills.tools.length > 0) {
      text += `SKILLS\n`;
      if (skills.technical.length > 0) text += `Technical: ${skills.technical.join(', ')}\n`;
      if (skills.soft.length > 0) text += `Soft Skills: ${skills.soft.join(', ')}\n`;
      if (skills.languages.length > 0) text += `Languages: ${skills.languages.join(', ')}\n`;
      if (skills.tools.length > 0) text += `Tools: ${skills.tools.join(', ')}\n`;
      text += `\n`;
    }
    
    if (projects.length > 0 && projects[0].name) {
      text += `PROJECTS\n`;
      projects.forEach(project => {
        if (project.name) {
          text += `${project.name}\n`;
          text += `${project.description}\n`;
          if (project.technologies.length > 0) {
            text += `Technologies: ${project.technologies.join(', ')}\n`;
          }
          if (project.link) text += `Link: ${project.link}\n`;
          if (project.github) text += `GitHub: ${project.github}\n`;
          project.highlights.forEach(highlight => {
            if (highlight) text += `• ${highlight}\n`;
          });
          text += `\n`;
        }
      });
    }
    
    if (certifications.length > 0) {
      text += `CERTIFICATIONS\n`;
      certifications.forEach(cert => text += `• ${cert}\n`);
      text += `\n`;
    }
    
    if (achievements.length > 0) {
      text += `ACHIEVEMENTS\n`;
      achievements.forEach(achievement => text += `• ${achievement}\n`);
    }
    
    return text;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
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
                  onChange={(e) => updatePersonalInfo('firstName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                <input
                  type="text"
                  value={resumeData.personalInfo.lastName}
                  onChange={(e) => updatePersonalInfo('lastName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Doe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Professional Title *</label>
                <input
                  type="text"
                  value={resumeData.personalInfo.title}
                  onChange={(e) => updatePersonalInfo('title', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Senior Software Developer"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={resumeData.personalInfo.email}
                  onChange={(e) => updatePersonalInfo('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="john.doe@email.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                <input
                  type="tel"
                  value={resumeData.personalInfo.phone}
                  onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                <input
                  type="text"
                  value={resumeData.personalInfo.location}
                  onChange={(e) => updatePersonalInfo('location', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="San Francisco, CA"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                <input
                  type="url"
                  value={resumeData.personalInfo.website}
                  onChange={(e) => updatePersonalInfo('website', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="johndoe.dev"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                <input
                  type="url"
                  value={resumeData.personalInfo.linkedin}
                  onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="linkedin.com/in/johndoe"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">GitHub</label>
                <input
                  type="url"
                  value={resumeData.personalInfo.github}
                  onChange={(e) => updatePersonalInfo('github', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="github.com/johndoe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Professional Summary</label>
              <textarea
                value={resumeData.personalInfo.summary}
                onChange={(e) => updatePersonalInfo('summary', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Write a compelling summary of your professional background, key skills, and career objectives..."
              />
              <div className="mt-2 flex justify-between items-center">
                <p className="text-sm text-gray-500">Tip: Keep it concise and highlight your most relevant achievements</p>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1">
                  <Sparkles className="h-4 w-4" />
                  <span>AI Suggest</span>
                </button>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Work Experience</h2>
              <p className="text-gray-600">Add your professional experience and achievements</p>
            </div>

            {resumeData.experience.map((exp, index) => (
              <div key={exp.id} className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Experience {index + 1}</h3>
                  {resumeData.experience.length > 1 && (
                    <button
                      onClick={() => removeExperience(exp.id)}
                      className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
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
                      placeholder="Senior Software Developer"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
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
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Description</label>
                  {exp.description.map((desc, descIndex) => (
                    <div key={descIndex} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={desc}
                        onChange={(e) => {
                          const newDesc = [...exp.description];
                          newDesc[descIndex] = e.target.value;
                          updateExperience(exp.id, 'description', newDesc);
                        }}
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Describe your responsibilities and achievements..."
                      />
                      {exp.description.length > 1 && (
                        <button
                          onClick={() => {
                            const newDesc = exp.description.filter((_, i) => i !== descIndex);
                            updateExperience(exp.id, 'description', newDesc);
                          }}
                          className="text-red-600 hover:text-red-700 p-2"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newDesc = [...exp.description, ''];
                      updateExperience(exp.id, 'description', newDesc);
                    }}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Description</span>
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Technologies Used</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {exp.technologies.map((tech, techIndex) => (
                      <span
                        key={techIndex}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700"
                      >
                        {tech}
                        <button
                          onClick={() => {
                            const newTech = exp.technologies.filter((_, i) => i !== techIndex);
                            updateExperience(exp.id, 'technologies', newTech);
                          }}
                          className="ml-2 text-blue-500 hover:text-blue-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add technology (press Enter)"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const value = e.currentTarget.value.trim();
                        if (value && !exp.technologies.includes(value)) {
                          updateExperience(exp.id, 'technologies', [...exp.technologies, value]);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                </div>
              </div>
            ))}

            <button
              onClick={addExperience}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Add Another Experience</span>
            </button>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Education</h2>
              <p className="text-gray-600">Add your educational background and achievements</p>
            </div>

            {resumeData.education.map((edu, index) => (
              <div key={edu.id} className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Education {index + 1}</h3>
                  {resumeData.education.length > 1 && (
                    <button
                      onClick={() => removeEducation(edu.id)}
                      className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Institution *</label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="University of California, Berkeley"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Degree *</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Bachelor of Science"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Field of Study *</label>
                    <input
                      type="text"
                      value={edu.field}
                      onChange={(e) => updateEducation(edu.id, 'field', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Computer Science"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      value={edu.location}
                      onChange={(e) => updateEducation(edu.id, 'location', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Berkeley, CA"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="month"
                      value={edu.startDate}
                      onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="month"
                      value={edu.endDate}
                      onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">GPA (Optional)</label>
                    <input
                      type="text"
                      value={edu.gpa}
                      onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="3.8"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Achievements & Activities</label>
                  {edu.achievements.map((achievement, achievementIndex) => (
                    <div key={achievementIndex} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={achievement}
                        onChange={(e) => {
                          const newAchievements = [...edu.achievements];
                          newAchievements[achievementIndex] = e.target.value;
                          updateEducation(edu.id, 'achievements', newAchievements);
                        }}
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Dean's List, Honor Society, etc."
                      />
                      {edu.achievements.length > 1 && (
                        <button
                          onClick={() => {
                            const newAchievements = edu.achievements.filter((_, i) => i !== achievementIndex);
                            updateEducation(edu.id, 'achievements', newAchievements);
                          }}
                          className="text-red-600 hover:text-red-700 p-2"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newAchievements = [...edu.achievements, ''];
                      updateEducation(edu.id, 'achievements', newAchievements);
                    }}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Achievement</span>
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={addEducation}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Add Another Education</span>
            </button>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Skills</h2>
              <p className="text-gray-600">Add your technical and soft skills</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Technical Skills */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Skills</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {resumeData.skills.technical.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700"
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill('technical', index)}
                        className="ml-2 text-blue-500 hover:text-blue-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Add technical skill (press Enter)"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const value = e.currentTarget.value.trim();
                      if (value && !resumeData.skills.technical.includes(value)) {
                        addSkill('technical', value);
                        e.currentTarget.value = '';
                      }
                    }
                  }}
                />
              </div>

              {/* Soft Skills */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Soft Skills</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {resumeData.skills.soft.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-700"
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill('soft', index)}
                        className="ml-2 text-green-500 hover:text-green-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Add soft skill (press Enter)"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const value = e.currentTarget.value.trim();
                      if (value && !resumeData.skills.soft.includes(value)) {
                        addSkill('soft', value);
                        e.currentTarget.value = '';
                      }
                    }
                  }}
                />
              </div>

              {/* Languages */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Languages</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {resumeData.skills.languages.map((language, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700"
                    >
                      {language}
                      <button
                        onClick={() => removeSkill('languages', index)}
                        className="ml-2 text-purple-500 hover:text-purple-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Add language (press Enter)"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const value = e.currentTarget.value.trim();
                      if (value && !resumeData.skills.languages.includes(value)) {
                        addSkill('languages', value);
                        e.currentTarget.value = '';
                      }
                    }
                  }}
                />
              </div>

              {/* Tools */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tools & Software</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {resumeData.skills.tools.map((tool, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-700"
                    >
                      {tool}
                      <button
                        onClick={() => removeSkill('tools', index)}
                        className="ml-2 text-orange-500 hover:text-orange-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Add tool (press Enter)"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const value = e.currentTarget.value.trim();
                      if (value && !resumeData.skills.tools.includes(value)) {
                        addSkill('tools', value);
                        e.currentTarget.value = '';
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Projects</h2>
              <p className="text-gray-600">Showcase your best projects and portfolio items</p>
            </div>

            {resumeData.projects.map((project, index) => (
              <div key={project.id} className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Project {index + 1}</h3>
                  {resumeData.projects.length > 1 && (
                    <button
                      onClick={() => removeProject(project.id)}
                      className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Project Name *</label>
                    <input
                      type="text"
                      value={project.name}
                      onChange={(e) => updateProject(project.id, 'name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="E-commerce Platform"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Live Demo Link</label>
                    <input
                      type="url"
                      value={project.link}
                      onChange={(e) => updateProject(project.id, 'link', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://project-demo.com"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">GitHub Repository</label>
                    <input
                      type="url"
                      value={project.github}
                      onChange={(e) => updateProject(project.id, 'github', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://github.com/username/project"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Description *</label>
                  <textarea
                    value={project.description}
                    onChange={(e) => updateProject(project.id, 'description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Describe what the project does, its purpose, and key features..."
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Technologies Used</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {project.technologies.map((tech, techIndex) => (
                      <span
                        key={techIndex}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700"
                      >
                        {tech}
                        <button
                          onClick={() => {
                            const newTech = project.technologies.filter((_, i) => i !== techIndex);
                            updateProject(project.id, 'technologies', newTech);
                          }}
                          className="ml-2 text-blue-500 hover:text-blue-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add technology (press Enter)"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const value = e.currentTarget.value.trim();
                        if (value && !project.technologies.includes(value)) {
                          updateProject(project.id, 'technologies', [...project.technologies, value]);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
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
                          updateProject(project.id, 'highlights', newHighlights);
                        }}
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Key achievement or feature..."
                      />
                      {project.highlights.length > 1 && (
                        <button
                          onClick={() => {
                            const newHighlights = project.highlights.filter((_, i) => i !== highlightIndex);
                            updateProject(project.id, 'highlights', newHighlights);
                          }}
                          className="text-red-600 hover:text-red-700 p-2"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newHighlights = [...project.highlights, ''];
                      updateProject(project.id, 'highlights', newHighlights);
                    }}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Highlight</span>
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={addProject}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Add Another Project</span>
            </button>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Resume Preview</h2>
              <p className="text-gray-600">Review your resume and choose a template</p>
            </div>

            {/* Template Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Template</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-4 border-2 rounded-xl transition-all ${
                      selectedTemplate === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-full h-24 bg-gradient-to-br ${template.color} rounded-lg mb-3`}></div>
                    <h4 className="font-semibold text-gray-900">{template.name}</h4>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Resume Preview */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-4xl mx-auto">
              <div className="space-y-6">
                {/* Header */}
                <div className="text-center border-b border-gray-200 pb-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {resumeData.personalInfo.firstName} {resumeData.personalInfo.lastName}
                  </h1>
                  <p className="text-xl text-gray-600 mb-4">{resumeData.personalInfo.title}</p>
                  <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
                    {resumeData.personalInfo.email && (
                      <div className="flex items-center space-x-1">
                        <Mail className="h-4 w-4" />
                        <span>{resumeData.personalInfo.email}</span>
                      </div>
                    )}
                    {resumeData.personalInfo.phone && (
                      <div className="flex items-center space-x-1">
                        <Phone className="h-4 w-4" />
                        <span>{resumeData.personalInfo.phone}</span>
                      </div>
                    )}
                    {resumeData.personalInfo.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{resumeData.personalInfo.location}</span>
                      </div>
                    )}
                    {resumeData.personalInfo.website && (
                      <div className="flex items-center space-x-1">
                        <Globe className="h-4 w-4" />
                        <span>{resumeData.personalInfo.website}</span>
                      </div>
                    )}
                    {resumeData.personalInfo.linkedin && (
                      <div className="flex items-center space-x-1">
                        <Linkedin className="h-4 w-4" />
                        <span>LinkedIn</span>
                      </div>
                    )}
                    {resumeData.personalInfo.github && (
                      <div className="flex items-center space-x-1">
                        <Github className="h-4 w-4" />
                        <span>GitHub</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Professional Summary */}
                {resumeData.personalInfo.summary && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-200 pb-2">
                      Professional Summary
                    </h2>
                    <p className="text-gray-700 leading-relaxed">{resumeData.personalInfo.summary}</p>
                  </div>
                )}

                {/* Experience */}
                {resumeData.experience.length > 0 && resumeData.experience[0].company && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-200 pb-2">
                      Work Experience
                    </h2>
                    <div className="space-y-4">
                      {resumeData.experience.map((exp) => (
                        exp.company && (
                          <div key={exp.id}>
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold text-gray-900">{exp.position}</h3>
                                <p className="text-blue-600 font-medium">{exp.company}</p>
                              </div>
                              <div className="text-right text-sm text-gray-600">
                                <p>{exp.location}</p>
                                <p>{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</p>
                              </div>
                            </div>
                            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-2">
                              {exp.description.map((desc, index) => (
                                desc && <li key={index}>{desc}</li>
                              ))}
                            </ul>
                            {exp.technologies.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                <span className="text-sm text-gray-600 mr-2">Technologies:</span>
                                {exp.technologies.map((tech, index) => (
                                  <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {resumeData.education.length > 0 && resumeData.education[0].institution && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-200 pb-2">
                      Education
                    </h2>
                    <div className="space-y-3">
                      {resumeData.education.map((edu) => (
                        edu.institution && (
                          <div key={edu.id}>
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold text-gray-900">{edu.degree} in {edu.field}</h3>
                                <p className="text-blue-600">{edu.institution}</p>
                                {edu.achievements.some(a => a) && (
                                  <ul className="list-disc list-inside text-sm text-gray-700 mt-1">
                                    {edu.achievements.map((achievement, index) => (
                                      achievement && <li key={index}>{achievement}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                              <div className="text-right text-sm text-gray-600">
                                <p>{edu.location}</p>
                                <p>{edu.startDate} - {edu.endDate}</p>
                                {edu.gpa && <p>GPA: {edu.gpa}</p>}
                              </div>
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {(resumeData.skills.technical.length > 0 || resumeData.skills.soft.length > 0 || 
                  resumeData.skills.languages.length > 0 || resumeData.skills.tools.length > 0) && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-200 pb-2">
                      Skills
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {resumeData.skills.technical.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">Technical Skills</h3>
                          <div className="flex flex-wrap gap-1">
                            {resumeData.skills.technical.map((skill, index) => (
                              <span key={index} className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {resumeData.skills.soft.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">Soft Skills</h3>
                          <div className="flex flex-wrap gap-1">
                            {resumeData.skills.soft.map((skill, index) => (
                              <span key={index} className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {resumeData.skills.languages.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">Languages</h3>
                          <div className="flex flex-wrap gap-1">
                            {resumeData.skills.languages.map((language, index) => (
                              <span key={index} className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                {language}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {resumeData.skills.tools.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">Tools & Software</h3>
                          <div className="flex flex-wrap gap-1">
                            {resumeData.skills.tools.map((tool, index) => (
                              <span key={index} className="text-sm bg-orange-100 text-orange-700 px-2 py-1 rounded">
                                {tool}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Projects */}
                {resumeData.projects.length > 0 && resumeData.projects[0].name && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-200 pb-2">
                      Projects
                    </h2>
                    <div className="space-y-4">
                      {resumeData.projects.map((project) => (
                        project.name && (
                          <div key={project.id}>
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold text-gray-900">{project.name}</h3>
                              <div className="flex space-x-2">
                                {project.link && (
                                  <span className="text-sm text-blue-600">Live Demo</span>
                                )}
                                {project.github && (
                                  <span className="text-sm text-gray-600">GitHub</span>
                                )}
                              </div>
                            </div>
                            <p className="text-gray-700 mb-2">{project.description}</p>
                            {project.highlights.some(h => h) && (
                              <ul className="list-disc list-inside text-sm text-gray-700 mb-2">
                                {project.highlights.map((highlight, index) => (
                                  highlight && <li key={index}>{highlight}</li>
                                ))}
                              </ul>
                            )}
                            {project.technologies.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                <span className="text-sm text-gray-600 mr-2">Technologies:</span>
                                {project.technologies.map((tech, index) => (
                                  <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {resumeData.certifications.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-200 pb-2">
                      Certifications
                    </h2>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {resumeData.certifications.map((cert, index) => (
                        <li key={index}>{cert}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Achievements */}
                {resumeData.achievements.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-200 pb-2">
                      Achievements
                    </h2>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {resumeData.achievements.map((achievement, index) => (
                        <li key={index}>{achievement}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Download Actions */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={downloadResume}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-semibold flex items-center space-x-2"
              >
                <Download className="h-5 w-5" />
                <span>Download Resume</span>
              </button>
              <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors font-semibold flex items-center space-x-2">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            AI Resume Builder
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600"> Pro</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Create a professional resume in minutes with AI-powered suggestions and beautiful templates
          </p>
          
          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              onClick={generateAIResume}
              disabled={isGeneratingAI}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isGeneratingAI ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  <span>Generating AI Resume...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  <span>Generate AI Resume</span>
                </>
              )}
            </button>
            <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors font-semibold flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Import from LinkedIn</span>
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => setCurrentStep(step.id)}
                    className={`flex flex-col items-center p-4 rounded-xl transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg'
                        : isCompleted
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                      isActive
                        ? 'bg-white/20'
                        : isCompleted
                        ? 'bg-green-200'
                        : 'bg-white/50'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <Icon className="h-6 w-6" />
                      )}
                    </div>
                    <span className="text-sm font-medium hidden sm:block">{step.title}</span>
                    <span className="text-xs text-center hidden md:block max-w-20">{step.description}</span>
                  </button>
                  
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 rounded-full ${
                      currentStep > step.id ? 'bg-green-400' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Previous</span>
            </button>

            <div className="text-sm text-gray-500">
              Step {currentStep} of {steps.length}
            </div>

            <button
              onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
              disabled={currentStep === steps.length}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{currentStep === steps.length ? 'Complete' : 'Next'}</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilderPage;